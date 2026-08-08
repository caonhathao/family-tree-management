import { Injectable } from '@nestjs/common';
import { addDays, addWeeks, lastDayOfMonth } from 'date-fns';
import { RECURRENCE_FREQUENCY } from '@prisma/client';

export interface RecurrenceRule {
  freq: RECURRENCE_FREQUENCY;
  interval?: number;
  endsAt?: Date;
  count?: number;
}

export interface ExpandOccurrencesOptions {
  /** Lower bound (inclusive) for generated occurrences. */
  from?: Date;
  /** Upper bound (inclusive) for generated occurrences. */
  to?: Date;
}

export interface OccurrenceSlot {
  startTime: Date;
  endTime: Date;
}

const DEFAULT_RECURRING_HORIZON_DAYS = 365;

@Injectable()
export class RecurrenceService {
  /** Horizon used when a recurring event has no `endsAt`. */
  getDefaultHorizon(from: Date = new Date()): Date {
    return addDays(from, DEFAULT_RECURRING_HORIZON_DAYS);
  }

  /**
   * Expand a recurrence rule into concrete occurrence slots.
   *
   * The event's own start time (the first occurrence) is NOT included;
   * callers always create the base instance themselves. Occurrences are
   * generated deterministically from `firstStartTime`, so calling this
   * repeatedly (e.g. roll-forward jobs) is idempotent given a unique
   * constraint on (eventId, startTime).
   */
  expand(
    rule: RecurrenceRule,
    firstStartTime: Date,
    firstEndTime: Date,
    options: ExpandOccurrencesOptions = {},
  ): OccurrenceSlot[] {
    const { from, to } = options;
    const interval = rule.interval ?? 1;
    if (interval < 1) throw new Error('interval must be >= 1');

    const durationMs = firstEndTime.getTime() - firstStartTime.getTime();
    if (durationMs <= 0) throw new Error('endTime must be after startTime');

    const now = new Date();
    const upperBound = rule.endsAt
      ? new Date(
          Math.min(
            rule.endsAt.getTime(),
            (to ?? this.getDefaultHorizon(now)).getTime(),
          ),
        )
      : (to ?? this.getDefaultHorizon(now));

    // `count` = total occurrences in the series (including the first one).
    const maxAdditional = rule.count
      ? rule.count - 1
      : Number.POSITIVE_INFINITY;

    const result: OccurrenceSlot[] = [];
    let step = 1;

    while (result.length < maxAdditional) {
      const candidate = this.advance(
        firstStartTime,
        step * interval,
        rule.freq,
      );

      if (candidate.getTime() > upperBound.getTime()) break;

      if (!from || candidate.getTime() >= from.getTime()) {
        result.push({
          startTime: candidate,
          endTime: new Date(candidate.getTime() + durationMs),
        });
      }

      step += 1;
    }

    return result;
  }

  private advance(date: Date, steps: number, freq: RECURRENCE_FREQUENCY): Date {
    switch (freq) {
      case RECURRENCE_FREQUENCY.DAILY:
        return addDays(date, steps);
      case RECURRENCE_FREQUENCY.WEEKLY:
        return addWeeks(date, steps);
      case RECURRENCE_FREQUENCY.MONTHLY:
        return this.addMonthsClamped(date, steps);
      default:
        throw new Error(`Unsupported frequency: ${String(freq)}`);
    }
  }

  /**
   * Monthly advance that clamps the day-of-month when the target month
   * has fewer days than the base (e.g. 31/01 -> 28/02, 30/04).
   */
  private addMonthsClamped(date: Date, months: number): Date {
    const day = date.getDate();
    const baseMonth = new Date(date.getFullYear(), date.getMonth() + months, 1);
    const lastDay = lastDayOfMonth(baseMonth).getDate();
    return new Date(
      baseMonth.getFullYear(),
      baseMonth.getMonth(),
      Math.min(day, lastDay),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds(),
    );
  }
}

import { RECURRENCE_FREQUENCY } from '@prisma/client';
import { RecurrenceService } from './recurrence.service';

describe('RecurrenceService', () => {
  let service: RecurrenceService;

  beforeEach(() => {
    service = new RecurrenceService();
  });

  const iso = (value: string) => new Date(value);

  describe('expand', () => {
    it('expands daily occurrences with default interval', () => {
      const result = service.expand(
        { freq: RECURRENCE_FREQUENCY.DAILY },
        iso('2026-01-01T09:00:00.000Z'),
        iso('2026-01-01T11:00:00.000Z'),
        {
          from: iso('2026-01-01T00:00:00.000Z'),
          to: iso('2026-01-05T23:59:59.000Z'),
        },
      );

      expect(result).toEqual([
        {
          startTime: iso('2026-01-02T09:00:00.000Z'),
          endTime: iso('2026-01-02T11:00:00.000Z'),
        },
        {
          startTime: iso('2026-01-03T09:00:00.000Z'),
          endTime: iso('2026-01-03T11:00:00.000Z'),
        },
        {
          startTime: iso('2026-01-04T09:00:00.000Z'),
          endTime: iso('2026-01-04T11:00:00.000Z'),
        },
        {
          startTime: iso('2026-01-05T09:00:00.000Z'),
          endTime: iso('2026-01-05T11:00:00.000Z'),
        },
      ]);
    });

    it('expands weekly occurrences keeping the same weekday', () => {
      const result = service.expand(
        { freq: RECURRENCE_FREQUENCY.WEEKLY },
        iso('2026-01-05T10:00:00.000Z'),
        iso('2026-01-05T12:00:00.000Z'),
        {
          from: iso('2026-01-01T00:00:00.000Z'),
          to: iso('2026-01-25T23:59:59.000Z'),
        },
      );

      expect(result.map((slot) => slot.startTime.toISOString())).toEqual([
        '2026-01-12T10:00:00.000Z',
        '2026-01-19T10:00:00.000Z',
      ]);
    });

    it('expands monthly with clamping when target month has fewer days', () => {
      const result = service.expand(
        { freq: RECURRENCE_FREQUENCY.MONTHLY },
        iso('2026-01-31T09:00:00.000Z'),
        iso('2026-01-31T10:00:00.000Z'),
        {
          from: iso('2026-01-01T00:00:00.000Z'),
          to: iso('2026-05-31T23:59:59.000Z'),
        },
      );

      expect(result.map((slot) => slot.startTime.toISOString())).toEqual([
        '2026-02-28T09:00:00.000Z',
        '2026-03-31T09:00:00.000Z',
        '2026-04-30T09:00:00.000Z',
        '2026-05-31T09:00:00.000Z',
      ]);
    });

    it('respects interval (every 2 weeks)', () => {
      const result = service.expand(
        { freq: RECURRENCE_FREQUENCY.WEEKLY, interval: 2 },
        iso('2026-01-05T10:00:00.000Z'),
        iso('2026-01-05T12:00:00.000Z'),
        {
          from: iso('2026-01-01T00:00:00.000Z'),
          to: iso('2026-02-08T23:59:59.000Z'),
        },
      );

      expect(result.map((slot) => slot.startTime.toISOString())).toEqual([
        '2026-01-19T10:00:00.000Z',
        '2026-02-02T10:00:00.000Z',
      ]);
    });

    it('stops at endsAt', () => {
      const result = service.expand(
        {
          freq: RECURRENCE_FREQUENCY.DAILY,
          endsAt: iso('2026-01-05T09:00:00.000Z'),
        },
        iso('2026-01-01T09:00:00.000Z'),
        iso('2026-01-01T11:00:00.000Z'),
        { from: iso('2026-01-01T00:00:00.000Z') },
      );

      expect(result.map((slot) => slot.startTime.toISOString())).toEqual([
        '2026-01-02T09:00:00.000Z',
        '2026-01-03T09:00:00.000Z',
        '2026-01-04T09:00:00.000Z',
        '2026-01-05T09:00:00.000Z',
      ]);
    });

    it('respects count (total occurrences including the first)', () => {
      const result = service.expand(
        { freq: RECURRENCE_FREQUENCY.DAILY, count: 3 },
        iso('2026-01-01T09:00:00.000Z'),
        iso('2026-01-01T11:00:00.000Z'),
        {
          from: iso('2026-01-01T00:00:00.000Z'),
          to: iso('2026-02-01T00:00:00.000Z'),
        },
      );

      // 3 total occurrences => base + 2 additional
      expect(result).toEqual([
        {
          startTime: iso('2026-01-02T09:00:00.000Z'),
          endTime: iso('2026-01-02T11:00:00.000Z'),
        },
        {
          startTime: iso('2026-01-03T09:00:00.000Z'),
          endTime: iso('2026-01-03T11:00:00.000Z'),
        },
      ]);
    });

    it('respects from lower bound', () => {
      const result = service.expand(
        { freq: RECURRENCE_FREQUENCY.DAILY },
        iso('2026-01-01T09:00:00.000Z'),
        iso('2026-01-01T11:00:00.000Z'),
        {
          from: iso('2026-01-03T00:00:00.000Z'),
          to: iso('2026-01-05T23:59:59.000Z'),
        },
      );

      expect(result.map((slot) => slot.startTime.toISOString())).toEqual([
        '2026-01-03T09:00:00.000Z',
        '2026-01-04T09:00:00.000Z',
        '2026-01-05T09:00:00.000Z',
      ]);
    });

    it('handles leap-year February in monthly recurrence', () => {
      const result = service.expand(
        { freq: RECURRENCE_FREQUENCY.MONTHLY },
        iso('2028-01-31T09:00:00.000Z'),
        iso('2028-01-31T10:00:00.000Z'),
        {
          from: iso('2028-01-01T00:00:00.000Z'),
          to: iso('2028-03-31T23:59:59.000Z'),
        },
      );

      expect(result.map((slot) => slot.startTime.toISOString())).toEqual([
        '2028-02-29T09:00:00.000Z',
        '2028-03-31T09:00:00.000Z',
      ]);
    });

    it('returns empty when no occurrence fits the bounds', () => {
      const result = service.expand(
        { freq: RECURRENCE_FREQUENCY.WEEKLY },
        iso('2026-01-05T10:00:00.000Z'),
        iso('2026-01-05T12:00:00.000Z'),
        {
          from: iso('2026-01-10T00:00:00.000Z'),
          to: iso('2026-01-11T23:59:59.000Z'),
        },
      );

      expect(result).toEqual([]);
    });
  });

  describe('getDefaultHorizon', () => {
    it('returns 365 days after the given date', () => {
      expect(
        service.getDefaultHorizon(iso('2026-01-01T00:00:00.000Z')),
      ).toEqual(iso('2027-01-01T00:00:00.000Z'));
    });
  });
});

import { EVENT_TYPE } from '@prisma/client';
import type { ReactElement } from 'react';
import { render } from 'react-email';
import { EventEmailService } from './event-email.service';

jest.mock('react-email', () => ({
  render: jest.fn().mockResolvedValue('<html></html>'),
}));

interface EmailLogCreateArgs {
  data: {
    userId: string;
    eventId: string;
    eventInstanceId: string;
    to: string;
    subject: string;
    status: 'SENT' | 'FAILED';
    error: string | null;
    sentAt: Date | null;
  };
}

describe('EventEmailService', () => {
  let service: EventEmailService;
  let prisma: {
    eventInstance: { findMany: jest.Mock };
    groupMember: { findMany: jest.Mock };
    emailLog: {
      findMany: jest.Mock;
      create: jest.Mock<Promise<{ id: string }>, [EmailLogCreateArgs]>;
    };
  };
  let resendService: {
    enabled: boolean;
    sendEmail: jest.Mock;
  };
  let envConfig: { clientDomain: string };

  const member = (id: string, email: string) => ({
    member: { id, email },
  });

  const instance = {
    id: 'instance-1',
    startTime: new Date('2026-08-11T09:00:00.000Z'),
    endTime: new Date('2026-08-11T11:00:00.000Z'),
    event: {
      id: 'event-1',
      title: 'Giỗ cụ tổ',
      type: EVENT_TYPE.DEATH_ANNIVERSARY,
      group: { id: 'group-1', name: 'Dòng họ Nguyễn' },
    },
  };

  beforeEach(() => {
    prisma = {
      eventInstance: { findMany: jest.fn() },
      groupMember: { findMany: jest.fn() },
      emailLog: {
        findMany: jest.fn(),
        create: jest.fn<Promise<{ id: string }>, [EmailLogCreateArgs]>(),
      },
    };
    resendService = { enabled: true, sendEmail: jest.fn() };
    envConfig = { clientDomain: 'http://localhost:3000' };

    service = new EventEmailService(
      prisma as never,
      resendService as never,
      envConfig as never,
    );
  });

  it('sends emails to group members and logs them as SENT', async () => {
    prisma.eventInstance.findMany.mockResolvedValue([instance]);
    prisma.groupMember.findMany.mockResolvedValue([
      member('user-1', 'a@example.com'),
      member('user-2', 'b@example.com'),
    ]);
    prisma.emailLog.findMany.mockResolvedValue([]);
    resendService.sendEmail.mockResolvedValue('email-id');

    await service.sendTodayEmails();

    expect(resendService.sendEmail).toHaveBeenCalledTimes(2);
    expect(resendService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'a@example.com',
        subject: 'Hôm nay: Giỗ cụ tổ',
      }),
    );
    expect(prisma.emailLog.create).toHaveBeenCalledTimes(2);
    const logData = prisma.emailLog.create.mock.calls[0][0].data;
    expect(logData).toMatchObject({
      userId: 'user-1',
      eventId: 'event-1',
      eventInstanceId: 'instance-1',
      to: 'a@example.com',
      subject: 'Hôm nay: Giỗ cụ tổ',
      status: 'SENT',
      error: null,
    });
    expect(logData.sentAt).toBeInstanceOf(Date);
  });

  it('builds the group link with the groupId query param', async () => {
    prisma.eventInstance.findMany.mockResolvedValue([instance]);
    prisma.groupMember.findMany.mockResolvedValue([
      member('user-1', 'a@example.com'),
    ]);
    prisma.emailLog.findMany.mockResolvedValue([]);
    resendService.sendEmail.mockResolvedValue('email-id');

    await service.sendTodayEmails();

    const renderMock = render as jest.MockedFunction<
      (component: ReactElement<{ link: string }>) => Promise<string>
    >;
    expect(renderMock.mock.calls[0][0].props.link).toBe(
      'http://localhost:3000/group?groupId=group-1',
    );
  });

  it('skips members already notified for the same instance and kind', async () => {
    prisma.eventInstance.findMany.mockResolvedValue([instance]);
    prisma.groupMember.findMany.mockResolvedValue([
      member('user-1', 'a@example.com'),
      member('user-2', 'b@example.com'),
    ]);
    prisma.emailLog.findMany.mockResolvedValue([{ userId: 'user-1' }]);

    await service.sendTodayEmails();

    expect(resendService.sendEmail).toHaveBeenCalledTimes(1);
    expect(resendService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'b@example.com' }),
    );
  });

  it('records FAILED logs when Resend rejects', async () => {
    prisma.eventInstance.findMany.mockResolvedValue([instance]);
    prisma.groupMember.findMany.mockResolvedValue([
      member('user-1', 'a@example.com'),
    ]);
    prisma.emailLog.findMany.mockResolvedValue([]);
    resendService.sendEmail.mockRejectedValue(new Error('rate limit exceeded'));

    await service.sendTodayEmails();

    const logData = prisma.emailLog.create.mock.calls[0][0].data;
    expect(logData).toMatchObject({
      userId: 'user-1',
      status: 'FAILED',
      error: 'rate limit exceeded',
      sentAt: null,
    });
  });

  it('sends reminder emails with the "Ngày mai" subject', async () => {
    prisma.eventInstance.findMany.mockResolvedValue([instance]);
    prisma.groupMember.findMany.mockResolvedValue([
      member('user-1', 'a@example.com'),
    ]);
    prisma.emailLog.findMany.mockResolvedValue([]);

    await service.sendReminderEmails();

    expect(resendService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Ngày mai: Giỗ cụ tổ' }),
    );
  });

  it('does nothing when Resend is disabled', async () => {
    resendService.enabled = false;

    await service.sendTodayEmails();

    expect(prisma.eventInstance.findMany).not.toHaveBeenCalled();
    expect(resendService.sendEmail).not.toHaveBeenCalled();
    expect(prisma.emailLog.create).not.toHaveBeenCalled();
  });
});

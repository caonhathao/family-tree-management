import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'react-email';

export interface EventNotificationEmailProps {
  eventTitle: string;
  eventType: string;
  startTime: string;
  endTime: string;
  groupName: string;
  link: string;
  reminder?: boolean;
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '24px 16px',
  maxWidth: '520px',
};

const card = {
  backgroundColor: '#ffffff',
  border: '1px solid #e6edf5',
  borderRadius: '8px',
  padding: '24px',
};

const heading = {
  color: '#1f2937',
  fontSize: '22px',
  fontWeight: 600,
  lineHeight: '28px',
  margin: '0 0 12px',
};

const paragraph = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0 0 16px',
};

const label = {
  color: '#6b7280',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 2px',
};

const value = {
  color: '#111827',
  fontSize: '15px',
  fontWeight: 500,
  margin: '0 0 12px',
};

const button = {
  backgroundColor: '#b45309',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'block',
  fontSize: '15px',
  fontWeight: 600,
  padding: '12px 20px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  margin: '8px 0 0',
};

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '16px 0 0',
  textAlign: 'center' as const,
};

export const EventNotificationEmail = ({
  eventTitle,
  eventType,
  startTime,
  endTime,
  groupName,
  link,
  reminder = false,
}: EventNotificationEmailProps) => {
  const headline = reminder
    ? `Ngày mai: ${eventTitle}`
    : `Hôm nay: ${eventTitle}`;

  return (
    <Html lang="vi">
      <Head />
      <Preview>{headline}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={card}>
            <Heading style={heading}>{headline}</Heading>
            <Text style={paragraph}>
              Nhóm <strong>{groupName}</strong> có sự kiện{' '}
              {reminder ? 'sẽ diễn ra ngày mai' : 'diễn ra hôm nay'}:
            </Text>

            <Text style={label}>Tên sự kiện</Text>
            <Text style={value}>{eventTitle}</Text>

            <Text style={label}>Loại sự kiện</Text>
            <Text style={value}>{eventType}</Text>

            <Text style={label}>Thời gian</Text>
            <Text style={value}>
              {startTime} - {endTime}
            </Text>

            <Button href={link} style={button}>
              Xem chi tiết sự kiện
            </Button>
          </Section>
          <Text style={footer}>Family Management</Text>
        </Container>
      </Body>
    </Html>
  );
};

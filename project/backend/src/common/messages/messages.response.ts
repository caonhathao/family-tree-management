export const InvalidMessageResponse = {
  EMAIL: 't_email_invalid',
  NAME_EMPTY: 't_name_empty',
  PASSWORD_MIN: 't_password_min_invalid',
  OTP_MIN: 't_otp_code_min_invalid',
  GOOGLE_TOKEN: 't_google_empty',
  CREATED: 't_created_failed',
  UDPATED: 't_updated_failed',
} as const;

export type InvalidMessage =
  (typeof InvalidMessageResponse)[keyof typeof InvalidMessageResponse];

export const InvalidMessageResponse = {
  EMAIL: 't_email_invalid',
  EMAIL_INCORRECT: 't_email_incorrect',
  NAME_EMPTY: 't_name_empty',
  PASSWORD_MIN: 't_password_min_invalid',
  PASSWORD_INCORRECT: 't_password_incorrect',
  ROLE_EMPTY: 't_role_empty',
  OTP_MIN: 't_otp_code_min_invalid',
  GOOGLE_TOKEN: 't_google_empty',
  CREATED: 't_created_failed',
  UDPATED: 't_updated_failed',
} as const;

export type InvalidMessage =
  (typeof InvalidMessageResponse)[keyof typeof InvalidMessageResponse];

export const ValidMessageResponse = {
  REGISTER: 't_register_success',
  LOGIN: 't_login_success',
};

export type ValidMessage =
  (typeof ValidMessageResponse)[keyof typeof ValidMessageResponse];

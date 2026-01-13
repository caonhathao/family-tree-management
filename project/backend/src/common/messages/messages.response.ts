export const InvalidMessageResponse = {
  EMAIL: 't_email_invalid',
  EMAIL_INCORRECT: 't_email_incorrect',
  NAME_EMPTY: 't_name_empty',
  PASSWORD_MIN: 't_password_min_invalid',
  PASSWORD_INCORRECT: 't_password_incorrect',
  ROLE_EMPTY: 't_role_empty',
  DESC_EMPTY: 't_description_empty',
  ID_EMPTY: 't_id_empty',
  OTP_MIN: 't_otp_code_min_invalid',
  GOOGLE_TOKEN: 't_google_empty',
  CREATED: 't_created_failed',
  UDPATED: 't_updated_failed',
  USER_NOT_FOUND: 't_user_not_found',
  SESSION_BAD_ACCESS: 't_session_bad_access',
} as const;

export type InvalidMessage =
  (typeof InvalidMessageResponse)[keyof typeof InvalidMessageResponse];

export const ValidMessageResponse = {
  REGISTER: 't_register_success',
  LOGIN: 't_login_success',
  CREATED: 't_created_success',
  UPDATED: 't_updated_success',
} as const;

export type ValidMessage =
  (typeof ValidMessageResponse)[keyof typeof ValidMessageResponse];

export const Exception = {
  PEMRISSION: 't_need_role_permission',
} as const;

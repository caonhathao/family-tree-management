export const InvalidMessageResponse = {
  EMAIL: 't_email_invalid',
  EMAIL_INCORRECT: 't_email_incorrect',
  NAME_EMPTY: 't_name_empty',
  NAME_MIN: 't_name_min',
  NAME_MAX: 't_name_max',
  PASSWORD_MIN: 't_password_min_invalid',
  PASSWORD_INCORRECT: 't_password_incorrect',
  ROLE_EMPTY: 't_role_empty',
  DESC_EMPTY: 't_description_empty',
  ID_EMPTY: 't_id_empty',
  ID_INVAILD: 't_id_invalid',
  GENDER_EMPTY: 't_gender_empty',
  OTP_MIN: 't_otp_code_min_invalid',
  GOOGLE_TOKEN: 't_google_empty',
  CREATED: 't_created_failed',
  UDPATED: 't_updated_failed',
  USER_NOT_FOUND: 't_user_not_found',
  SESSION_BAD_ACCESS: 't_session_bad_access',
  FIELD_EMPTY: 't_field_empty',
} as const;

export type InvalidMessage =
  (typeof InvalidMessageResponse)[keyof typeof InvalidMessageResponse];

export const ValidMessageResponse = {
  REGISTER: 't_register_success',
  LOGIN: 't_login_success',
  CREATED: 't_created_success',
  UPDATED: 't_updated_success',
  GETTED: 't_getted_success',
  DELETED: ' t_deleted_success',
} as const;

export type ValidMessage =
  (typeof ValidMessageResponse)[keyof typeof ValidMessageResponse];

export const Exception = {
  BAD_REQUEST: 't_bad_request',
  CONFLICT: 't_conflict',
  CREATED: 't_created_failed',
  PEMRISSION: 't_need_role_permission',
  UNAUTHORIZED: 't_unauthorized',
  FILE_MISSING: 't_file_missing',
  FILE_BUFFER_MISSING: 't_file_buffer_missing',
  UPLOAD_FAILED: 't_upload_failed',
  URL_MISSING: 't_url_asset_missing',
  ID_MISSING: 't_id_missing',
  ID_INVALID: 't_id_invalid',
  NOT_EXIST: 't_data_not_exist',
  EXISTED: 't_data_existed',
  EXPIRED: 't_expires',
  SIZE_INVALID: 't_size_invalid',
  UNIQUE_INVALID: 't_unique_invalid',
} as const;

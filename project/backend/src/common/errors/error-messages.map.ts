import { HttpStatus, StatusCode } from '../constants/api';
import { ErrorCode } from './error-codes.enum';

export interface ErrorCodeConfig {
  httpStatus: StatusCode;
  /** Default message — a translation key by convention (e.g. `t_data_not_exist`). */
  message: string;
}

/**
 * Maps every ErrorCode to its default HTTP status and message (translation key).
 * BusinessException uses this to resolve `getStatus()` and the response message.
 */
export const ErrorMessagesMap: Record<ErrorCode, ErrorCodeConfig> = {
  // ── Exception codes ──
  [ErrorCode.BAD_REQUEST]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.BAD_REQUEST,
  },
  [ErrorCode.CONFLICT]: {
    httpStatus: HttpStatus.CONFLICT,
    message: ErrorCode.CONFLICT,
  },
  [ErrorCode.CREATED_FAILED]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.CREATED_FAILED,
  },
  [ErrorCode.PERMISSION]: {
    httpStatus: HttpStatus.FORBIDDEN,
    message: ErrorCode.PERMISSION,
  },
  [ErrorCode.UNAUTHORIZED]: {
    httpStatus: HttpStatus.UNAUTHORIZED,
    message: ErrorCode.UNAUTHORIZED,
  },
  [ErrorCode.FILE_MISSING]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.FILE_MISSING,
  },
  [ErrorCode.FILE_BUFFER_MISSING]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.FILE_BUFFER_MISSING,
  },
  [ErrorCode.UPLOAD_FAILED]: {
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    message: ErrorCode.UPLOAD_FAILED,
  },
  [ErrorCode.URL_MISSING]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.URL_MISSING,
  },
  [ErrorCode.ID_MISSING]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.ID_MISSING,
  },
  [ErrorCode.ID_INVALID]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.ID_INVALID,
  },
  [ErrorCode.NOT_EXIST]: {
    httpStatus: HttpStatus.NOT_FOUND,
    message: ErrorCode.NOT_EXIST,
  },
  [ErrorCode.EXISTED]: {
    httpStatus: HttpStatus.CONFLICT,
    message: ErrorCode.EXISTED,
  },
  [ErrorCode.EXPIRED]: {
    httpStatus: HttpStatus.UNAUTHORIZED,
    message: ErrorCode.EXPIRED,
  },
  [ErrorCode.SIZE_INVALID]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.SIZE_INVALID,
  },
  [ErrorCode.UNIQUE_INVALID]: {
    httpStatus: HttpStatus.CONFLICT,
    message: ErrorCode.UNIQUE_INVALID,
  },

  // ── Invalid codes ──
  [ErrorCode.EMAIL_INVALID]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.EMAIL_INVALID,
  },
  [ErrorCode.EMAIL_INCORRECT]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.EMAIL_INCORRECT,
  },
  [ErrorCode.NAME_EMPTY]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.NAME_EMPTY,
  },
  [ErrorCode.NAME_MIN]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.NAME_MIN,
  },
  [ErrorCode.NAME_MAX]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.NAME_MAX,
  },
  [ErrorCode.PASSWORD_MIN]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.PASSWORD_MIN,
  },
  [ErrorCode.PASSWORD_INCORRECT]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.PASSWORD_INCORRECT,
  },
  [ErrorCode.ROLE_EMPTY]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.ROLE_EMPTY,
  },
  [ErrorCode.DESC_EMPTY]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.DESC_EMPTY,
  },
  [ErrorCode.ID_EMPTY]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.ID_EMPTY,
  },
  [ErrorCode.GENDER_EMPTY]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.GENDER_EMPTY,
  },
  [ErrorCode.GENDER_INVALID]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.GENDER_INVALID,
  },
  [ErrorCode.OTP_MIN]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.OTP_MIN,
  },
  [ErrorCode.GOOGLE_TOKEN]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.GOOGLE_TOKEN,
  },
  [ErrorCode.USER_NOT_FOUND]: {
    httpStatus: HttpStatus.NOT_FOUND,
    message: ErrorCode.USER_NOT_FOUND,
  },
  [ErrorCode.SESSION_BAD_ACCESS]: {
    httpStatus: HttpStatus.FORBIDDEN,
    message: ErrorCode.SESSION_BAD_ACCESS,
  },
  [ErrorCode.FIELD_EMPTY]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.FIELD_EMPTY,
  },
  [ErrorCode.LINEAGE_TYPE_INVALID]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.LINEAGE_TYPE_INVALID,
  },
  [ErrorCode.CONTENT_EMPTY]: {
    httpStatus: HttpStatus.BAD_REQUEST,
    message: ErrorCode.CONTENT_EMPTY,
  },

  // ── Valid codes ──
  [ErrorCode.REGISTER_SUCCESS]: {
    httpStatus: HttpStatus.OK,
    message: ErrorCode.REGISTER_SUCCESS,
  },
  [ErrorCode.LOGIN_SUCCESS]: {
    httpStatus: HttpStatus.OK,
    message: ErrorCode.LOGIN_SUCCESS,
  },
  [ErrorCode.CREATED_SUCCESS]: {
    httpStatus: HttpStatus.CREATED,
    message: ErrorCode.CREATED_SUCCESS,
  },
  [ErrorCode.UPDATED_SUCCESS]: {
    httpStatus: HttpStatus.OK,
    message: ErrorCode.UPDATED_SUCCESS,
  },
  [ErrorCode.GETTED_SUCCESS]: {
    httpStatus: HttpStatus.OK,
    message: ErrorCode.GETTED_SUCCESS,
  },
  [ErrorCode.DELETED_SUCCESS]: {
    httpStatus: HttpStatus.OK,
    message: ErrorCode.DELETED_SUCCESS,
  },
};

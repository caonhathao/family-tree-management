import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Môi trường chạy (dev, prod, test)
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),

  // Cấu hình Cổng
  PORT: Joi.number().default(3000),

  // Database - Bắt buộc phải có chuỗi kết nối
  DATABASE_URL: Joi.string().required().messages({
    'any.required': 'DATABASE_URL là bắt buộc trong file .env',
  }),

  // JWT Secrets - Bắt buộc phải có để bảo mật
  JWT_ACCESS_SECRET_KEY: Joi.string().required(),
  JWT_REFRESH_SECRET_KEY: Joi.string().required(),

  // Thời hạn token (tùy chọn, có mặc định)
  ACCESS_TOKEN_EXPIRES_IN: Joi.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),
});

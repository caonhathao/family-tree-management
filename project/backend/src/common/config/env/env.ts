import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),

  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().required().messages({
    'any.required': 'DATABASE_URL là bắt buộc trong file .env',
  }),

  JWT_ACCESS_SECRET_KEY: Joi.string().required(),
  JWT_REFRESH_SECRET_KEY: Joi.string().required(),

  ACCESS_TOKEN_EXPIRES_IN: Joi.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),

  MAX_FILE_SIZE: Joi.number().default(2),

  FOLDER_ALBUM: Joi.string().required(),
  FOLDER_USER: Joi.string().required(),
  FOLDER_FAMILY: Joi.string().required(),
  CLOUDINARY_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),
  CLOUDINARY_URL: Joi.string().required(),
});

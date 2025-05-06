import * as Joi from 'joi';

import { ENV } from '../enums';

export const ENV_VALIDATION = {
  [ENV.PORT]: Joi.number(),

  [ENV.IS_PRODUCTION]: Joi.boolean().required(),

  [ENV.CLIENT_URL]: Joi.string().required(),

  [ENV.CORS_ORIGIN]: Joi.string().required(),
  [ENV.CORS_HEADERS]: Joi.string().required(),
  [ENV.CORS_CREDENTIALS]: Joi.boolean().required(),
  [ENV.CORS_METHODS]: Joi.string().required(),

  [ENV.DATABASE_URL]: Joi.string().required(),

  [ENV.JWT_ACCESS_SECRET]: Joi.string().required(),
  [ENV.JWT_REFRESH_SECRET]: Joi.string().required(),
  [ENV.JWT_ACCESS_TOKEN_EXPIRATION_TIME]: Joi.string().required(),
  [ENV.JWT_REFRESH_TOKEN_EXPIRATION_TIME]: Joi.string().required(),

  [ENV.GOOGLE_CLIENT_ID]: Joi.string().required(),
  [ENV.GOOGLE_CLIENT_SECRET]: Joi.string().required(),
  [ENV.GOOGLE_CALLBACK_URL]: Joi.string().required(),

  [ENV.MAILGUN_KEY]: Joi.string().required(),
  [ENV.MAILGUN_DOMAIN]: Joi.string().required(),
  [ENV.EMAIL_SEND_FROM]: Joi.string().required(),
};

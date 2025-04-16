import * as Joi from 'joi';

import { ENV } from '../enums';

export const ENV_VALIDATION = Joi.object({
  [ENV.PORT]: Joi.number(),

  [ENV.IS_PRODUCTION]: Joi.boolean().required(),

  [ENV.CLIENT_URL]: Joi.string().required(),

  [ENV.CORS_ORIGIN]: Joi.string().required(),
  [ENV.CORS_HEADERS]: Joi.string().required(),
  [ENV.CORS_CREDENTIALS]: Joi.boolean().required(),

  [ENV.DATABASE_URL]: Joi.string().required(),
});

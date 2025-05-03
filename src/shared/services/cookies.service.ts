import { Response } from 'express';

import { Injectable } from '@nestjs/common';

import { CookiesKeys, TimePeriods } from '@/shared/enums';

@Injectable()
export class CookiesService {
  /**
   * Sets a cookie on the response object.
   *
   * @param res - The response object from Express.
   * @param key - The key/name of the cookie.
   * @param value - The value of the cookie.
   * @param maxAge - The maximum age (in milliseconds) of the cookie. Defaults to one day.
   */
  public setCookie(
    res: Response,
    key: CookiesKeys,
    value: string,
    maxAge: number = TimePeriods.DAY,
  ): void {
    res.cookie(key, value, {
      httpOnly: true,
      maxAge,
      sameSite: 'none',
      secure: true,
    });
  }

  /**
   * Removes a cookie from the response object.
   *
   * @param res - The response object from Express.
   * @param key - The key/name of the cookie to remove.
   */
  public removeCookie(res: Response, key: CookiesKeys): void {
    res.clearCookie(key, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });
  }
}

import { Strategy } from 'passport-local';

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { User } from '@/modules/users/entities';
import { UsersService } from '@/modules/users/services';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      usernameField: 'email',
    });
  }

  public async validate(email: string, password: string): Promise<User> {
    const user = await this.usersService.validateUser(email, password);
    return user;
  }
}

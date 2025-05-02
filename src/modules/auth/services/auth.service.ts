import { BadRequestException, Injectable } from '@nestjs/common';

import { User } from '@/modules/users/entities';
import { UsersService } from '@/modules/users/services';

import { SignInDto, SignUpDto } from '../dtos';
import { Tokens } from '../types';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  public async signUp(signUpDto: SignUpDto): Promise<{ user: User; tokens: Tokens }> {
    const userExists = await this.usersService.findOneByEmail(signUpDto.email);
    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    const newUser = await this.usersService.create(signUpDto);
    const tokens = await this.generateAndStoreTokens(newUser);
    return { user: newUser, tokens };
  }

  public async signIn(signInDto: SignInDto): Promise<{ user: User; tokens: Tokens }> {
    const user = await this.usersService.validateUser(signInDto.email, signInDto.password);
    const tokens = await this.generateAndStoreTokens(user);
    return { user, tokens };
  }

  public async logout(id: number): Promise<void> {
    return this.tokenService.removeRefreshToken(id);
  }

  private async generateAndStoreTokens(user: User): Promise<Tokens> {
    const tokens = await this.tokenService.createTokens(user);
    await this.tokenService.storeRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }
}

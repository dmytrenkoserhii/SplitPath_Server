import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { ENV } from '@/shared/enums';
import { EmailService } from '@/shared/services';

import { VerifyEmailDto } from '../dtos';
import { VerificationTokenPayload } from '../types';
import { UsersService } from './users.service';

@Injectable()
export class VerificationService {
  private readonly jwtVerificationTokenSecret: string;
  private readonly jwtVerificationTokenExpirationTime: string;
  private readonly clientUrl: string;
  private readonly emailSendFrom: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
  ) {
    this.jwtVerificationTokenSecret = this.configService.get<string>(
      ENV.JWT_VERIFICATION_TOKEN_SECRET,
      '',
    );
    this.jwtVerificationTokenExpirationTime = this.configService.get<string>(
      ENV.JWT_VERIFICATION_TOKEN_EXPIRATION_TIME,
      '',
    );
    this.clientUrl = this.configService.get<string>(ENV.CLIENT_URL, '');
    this.emailSendFrom = this.configService.get<string>(ENV.EMAIL_SEND_FROM, '');
  }

  public async sendVerificationLink(id: number): Promise<void> {
    const user = await this.usersService.findOneById(id);

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const payload: VerificationTokenPayload = { email: user.email };
    const token = this.jwtService.sign(payload, {
      secret: this.jwtVerificationTokenSecret,
      expiresIn: this.jwtVerificationTokenExpirationTime,
    });

    await this.usersService.update(user.id, { emailVerificationToken: token });

    const url = `${this.clientUrl}/email-verification?token=${token}`;

    await this.emailService.send({
      to: user.email,
      from: this.emailSendFrom,
      subject: 'Email verification',
      html: `<p>Please verify your email address by clicking this link: <a href="${url}">${url}</a></p>`,
    });
  }

  public async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<void> {
    const email = await this.decodeConfirmationToken(verifyEmailDto.token);
    const user = await this.usersService.findOneByEmail(email, [], ['emailVerificationToken']);

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (user.emailVerificationToken !== verifyEmailDto.token) {
      throw new BadRequestException('Invalid token');
    }

    await this.usersService.update(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
    });
  }

  private async decodeConfirmationToken(token: string): Promise<string> {
    try {
      const payload = await this.jwtService.verify<VerificationTokenPayload>(token, {
        secret: this.jwtVerificationTokenSecret,
      });

      if (payload?.email) {
        return payload.email;
      }

      throw new BadRequestException('Bad confirmation token');
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new BadRequestException('Email confirmation token expired');
      }

      throw new BadRequestException('Bad confirmation token');
    }
  }
}

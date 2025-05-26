import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { ENV } from '@/shared/enums';
import { EmailService } from '@/shared/services';
import { ErrorHandler } from '@/shared/utils';

import { VerifyEmailDto } from '../dtos';
import { VerificationTokenPayload } from '../types';
import { UsersService } from './users.service';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
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
    try {
      this.logger.debug(`Starting email verification process for user: ${id}`);
      const user = await this.usersService.findOneById(id);

      if (user.isEmailVerified) {
        this.logger.warn(`Email verification skipped - already verified for user: ${id}`);
        throw new BadRequestException('Email already verified');
      }

      this.logger.debug(`Generating verification token for user: ${id}`);
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
      this.logger.log(`Verification email sent successfully to: ${user.email}`);
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'VerificationService.sendVerificationLink');
    }
  }

  public async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<void> {
    try {
      this.logger.debug('Starting email verification request');
      const email = await this.decodeConfirmationToken(verifyEmailDto.token);
      const user = await this.usersService.findOneByEmail(email, [], ['emailVerificationToken']);

      if (user.isEmailVerified) {
        this.logger.warn(`Email verification skipped - already verified for user: ${user.id}`);
        throw new BadRequestException('Email already verified');
      }

      if (user.emailVerificationToken !== verifyEmailDto.token) {
        this.logger.warn(`Invalid verification token provided for user: ${user.id}`);
        throw new BadRequestException('Invalid token');
      }

      await this.usersService.update(user.id, {
        isEmailVerified: true,
        emailVerificationToken: null,
      });
      this.logger.log(`Email verified successfully for user: ${user.id}`);
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'VerificationService.verifyEmail');
    }
  }

  private async decodeConfirmationToken(token: string): Promise<string> {
    try {
      this.logger.debug('Decoding email verification token');
      const payload = await this.jwtService.verify<VerificationTokenPayload>(token, {
        secret: this.jwtVerificationTokenSecret,
      });

      if (payload?.email) {
        this.logger.debug('Email verification token decoded successfully');
        return payload.email;
      }

      this.logger.warn('Invalid verification token - missing email in payload');
      throw new BadRequestException('Bad confirmation token');
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        this.logger.warn('Email verification token expired');
        throw new BadRequestException('Email confirmation token expired');
      }

      this.logger.warn('Invalid verification token format');
      throw new BadRequestException('Bad confirmation token');
    }
  }
}

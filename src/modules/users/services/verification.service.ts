import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { ENV } from '@/shared/enums';
import { EmailService } from '@/shared/services';

import { ConfirmEmailDto } from '../dtos';
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

  public async sendVerificationLink(email: string): Promise<void> {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const payload: VerificationTokenPayload = { email };
    const token = this.jwtService.sign(payload, {
      secret: this.jwtVerificationTokenSecret,
      expiresIn: this.jwtVerificationTokenExpirationTime,
    });
    console.log('Generated token:', token);

    await this.usersService.update(user.id, { emailVerificationToken: token });

    const url = `${this.clientUrl}/email-verification?token=${token}`;

    await this.emailService.send({
      to: email,
      from: this.emailSendFrom,
      subject: 'Email verification',
      html: `<p>Please verify your email address by clicking this link: <a href="${url}">${url}</a></p>`,
    });
  }

  public async resendConfirmationLink(userId: number): Promise<void> {
    const user = await this.usersService.findOneById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    await this.sendVerificationLink(user.email);
  }

  public async confirmEmail(confirmEmailDto: ConfirmEmailDto): Promise<void> {
    console.log('Starting email confirmation process...');
    const email = await this.decodeConfirmationToken(confirmEmailDto.token);
    console.log('Decoded email:', email);
    const user = await this.usersService.findOneByEmail(email, [], ['emailVerificationToken']);

    if (!user) {
      console.log('User not found for email:', email);
      throw new NotFoundException('User not found');
    }
    console.log('User found:', user.id);

    if (user.isEmailVerified) {
      console.log('Email already verified for user:', user.id);
      throw new BadRequestException('Email already verified');
    }

    console.log('DB token:', user.emailVerificationToken);
    console.log('Request token:', confirmEmailDto.token);
    console.log('Tokens match:', user.emailVerificationToken === confirmEmailDto.token);

    if (user.emailVerificationToken !== confirmEmailDto.token) {
      console.log('Token mismatch for user:', user.id);
      throw new BadRequestException('Invalid token');
    }

    console.log('Updating user verification status...');
    await this.usersService.update(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
    });
    console.log('Email verification completed successfully for user:', user.id);
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

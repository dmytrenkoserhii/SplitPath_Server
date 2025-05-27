import { validateOrReject } from 'class-validator';

import * as bcrypt from 'bcrypt';
import { DeleteResult, In, Repository } from 'typeorm';

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import { ENV } from '@/shared/enums';
import { EmailService } from '@/shared/services';
import { ErrorHandler } from '@/shared/utils';

import { CreateUserDto, CreateUserWithoutPasswordDto, UpdateUserDto } from '../dtos';
import { ForgotPasswordDto, ResetPasswordDto } from '../dtos';
import { User, UserField } from '../entities';
import { ResetPasswordTokenPayload } from '../types';
import { AccountService } from './account.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly emailSendFrom: string;
  private readonly clientUrl: string;
  private readonly jwtResetPasswordTokenSecret: string;
  private readonly jwtResetPasswordTokenExpirationTime: string;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly accountService: AccountService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.emailSendFrom = this.configService.get<string>(ENV.EMAIL_SEND_FROM, '');
    this.clientUrl = this.configService.get<string>(ENV.CLIENT_URL, '');
    this.jwtResetPasswordTokenSecret = this.configService.get<string>(
      ENV.JWT_RESET_PASSWORD_TOKEN_SECRET,
      '',
    );
    this.jwtResetPasswordTokenExpirationTime = this.configService.get<string>(
      ENV.JWT_RESET_PASSWORD_TOKEN_EXPIRATION_TIME,
      '',
    );
  }

  public async findAll(): Promise<User[]> {
    try {
      this.logger.debug('Fetching all users');
      return await this.usersRepository.find();
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'UsersService.findAll');
    }
  }

  public async findOneById(
    id: number,
    relationsToInclude: UserField[] = [],
    fieldsToInclude: UserField[] = [],
  ): Promise<User> {
    try {
      this.logger.debug(`Finding user by ID: ${id}`);
      let query = this.usersRepository.createQueryBuilder('user').where('user.id = :id', { id });

      fieldsToInclude.forEach((field) => {
        query = query.addSelect(`user.${field}`);
      });

      relationsToInclude.forEach((relation) => {
        query = query.leftJoinAndSelect(`user.${relation}`, relation as string);
      });

      const user = await query.getOne();

      if (!user) {
        this.logger.warn(`User with ID ${id} not found`);
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'UsersService.findOneById');
    }
  }

  public async findManyByIds(ids: number[], relations: string[] = []): Promise<User[]> {
    try {
      if (!ids.length) return [];

      this.logger.debug(`Finding users by IDs: ${ids.join(', ')}`);
      return await this.usersRepository.find({
        where: { id: In(ids) },
        relations,
      });
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'UsersService.findManyByIds');
    }
  }

  public async findOneByEmail(
    email: string,
    relationsToInclude: UserField[] = [],
    fieldsToInclude: UserField[] = [],
  ): Promise<User> {
    try {
      this.logger.debug(`Finding user by email: ${email}`);
      let query = this.usersRepository
        .createQueryBuilder('user')
        .where('user.email = :email', { email });

      fieldsToInclude.forEach((field) => {
        query = query.addSelect(`user.${field}`);
      });

      relationsToInclude.forEach((relation) => {
        query = query.leftJoinAndSelect(`user.${relation}`, relation as string);
      });

      const user = await query.getOne();

      if (!user) {
        this.logger.warn(`User with email ${email} not found`);
        throw new NotFoundException(`User with email ${email} not found`);
      }

      return user;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'UsersService.findOneByEmail');
    }
  }

  public async findOneByOAuthId(
    oauthId: string,
    relationsToInclude: UserField[] = [],
    fieldsToInclude: UserField[] = [],
  ): Promise<User | null> {
    try {
      this.logger.debug(`Finding user by OAuth ID: ${oauthId}`);
      let query = this.usersRepository
        .createQueryBuilder('user')
        .where('user.oauthId = :oauthId', { oauthId });

      fieldsToInclude.forEach((field) => {
        query = query.addSelect(`user.${field}`);
      });

      relationsToInclude.forEach((relation) => {
        query = query.leftJoinAndSelect(`user.${relation}`, relation as string);
      });

      return await query.getOne();
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'UsersService.findOneByOAuthId');
    }
  }

  public async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      this.logger.log(`Creating new user with email: ${createUserDto.email}`);
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

      const { username, ...userData } = createUserDto;

      const user = this.usersRepository.create({
        email: userData.email,
        hashedPassword,
      });

      await this.usersRepository.save(user);
      this.logger.log(`User created successfully with ID: ${user.id}`);

      await this.accountService.create({ username }, user);

      return user;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'UsersService.create');
    }
  }

  public async createWithoutPassword(createUserDto: CreateUserWithoutPasswordDto): Promise<User> {
    try {
      this.logger.log(`Creating new OAuth user with email: ${createUserDto.email}`);
      await validateOrReject(createUserDto);

      const user = this.usersRepository.create(createUserDto);
      await this.usersRepository.save(user);
      this.logger.log(`OAuth user created successfully with ID: ${user.id}`);

      return user;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'UsersService.createWithoutPassword');
    }
  }

  public async update(id: number, updateData: UpdateUserDto): Promise<User> {
    try {
      this.logger.log(`Updating user: ${id}`);
      const user = await this.findOneById(id);

      Object.assign(user, updateData);
      await this.usersRepository.save(user);
      this.logger.log(`User ${id} updated successfully`);

      return user;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'UsersService.update');
    }
  }

  public async deleteById(id: number): Promise<DeleteResult> {
    try {
      this.logger.log(`Deleting user: ${id}`);
      const user = await this.findOneById(id);
      const result = await this.usersRepository.delete(user.id);
      this.logger.log(`User ${id} deleted successfully`);
      return result;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'UsersService.deleteById');
    }
  }

  public async validateUser(email: string, password: string): Promise<User> {
    try {
      this.logger.debug(`Validating user credentials for: ${email}`);
      const user = await this.findOneByEmail(email, [], ['hashedPassword']);

      if (!user.hashedPassword) {
        this.logger.warn(`Invalid credentials - no password set for user: ${email}`);
        throw new BadRequestException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
      if (!isPasswordValid) {
        this.logger.warn(`Invalid password for user: ${email}`);
        throw new BadRequestException('Invalid credentials');
      }

      this.logger.debug(`User ${email} validated successfully`);
      return user;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'UsersService.validateUser');
    }
  }

  public async sendPasswordResetEmail(forgotPasswordDto: ForgotPasswordDto) {
    try {
      this.logger.log(`Processing password reset request for: ${forgotPasswordDto.email}`);
      const user = await this.findOneByEmail(forgotPasswordDto.email, [], ['oauthId']);

      if (user.oauthId) {
        this.logger.log(`Sending OAuth account notification to: ${forgotPasswordDto.email}`);
        await this.emailService.send({
          to: forgotPasswordDto.email,
          from: this.emailSendFrom,
          subject: 'Sign in using Google',
          html: `<p>It looks like you signed up using Google. Please continue to sign in using Google. If you're having trouble accessing your account, please contact our support team.</p>`,
        });
        return;
      }

      const payload: ResetPasswordTokenPayload = { email: user.email };
      const resetPasswordToken = this.jwtService.sign(payload, {
        secret: this.jwtResetPasswordTokenSecret,
        expiresIn: this.jwtResetPasswordTokenExpirationTime,
      });

      await this.update(user.id, { resetPasswordToken });

      const resetUrl = `${this.clientUrl}/reset-password?token=${resetPasswordToken}`;
      this.logger.log(`Sending password reset email to: ${forgotPasswordDto.email}`);

      await this.emailService.send({
        to: forgotPasswordDto.email,
        from: this.emailSendFrom,
        subject: 'Password Reset',
        html: `<p>Please use the following link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
      });
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'UsersService.sendPasswordResetEmail');
    }
  }

  public async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    try {
      this.logger.log('Processing password reset');
      const email = await this.decodeResetPasswordToken(resetPasswordDto.token);
      const user = await this.findOneByEmail(email, [], ['resetPasswordToken']);

      if (user.resetPasswordToken !== resetPasswordDto.token) {
        this.logger.warn(`Invalid reset token for user: ${email}`);
        throw new BadRequestException('Invalid token');
      }

      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(resetPasswordDto.password, salt);

      user.hashedPassword = hashedPassword;
      user.resetPasswordToken = null;

      await this.usersRepository.save(user);
      this.logger.log(`Password reset completed successfully for user: ${email}`);
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'UsersService.resetPassword');
    }
  }

  private async decodeResetPasswordToken(token: string): Promise<string> {
    try {
      this.logger.debug('Decoding reset password token');
      const payload = await this.jwtService.verify<ResetPasswordTokenPayload>(token, {
        secret: this.jwtResetPasswordTokenSecret,
      });

      if (!payload?.email) {
        this.logger.warn('Invalid reset token - no email in payload');
        throw new BadRequestException('Invalid reset token');
      }

      return payload.email;
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        this.logger.warn('Password reset token expired');
        throw new BadRequestException('Password reset token expired');
      }

      this.logger.warn('Invalid reset token');
      throw new BadRequestException('Invalid reset token');
    }
  }
}

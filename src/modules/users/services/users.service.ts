import { validateOrReject } from 'class-validator';

import * as bcrypt from 'bcrypt';
import { DeleteResult, In, Repository } from 'typeorm';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import { ENV } from '@/shared/enums';
import { EmailService } from '@/shared/services';

import { CreateUserDto, CreateUserWithoutPasswordDto, UpdateUserDto } from '../dtos';
import { ForgotPasswordDto, ResetPasswordDto } from '../dtos';
import { User, UserField } from '../entities';
import { ResetPasswordTokenPayload } from '../types';
import { AccountService } from './account.service';

@Injectable()
export class UsersService {
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
    return this.usersRepository.find();
  }

  public async findOneById(
    id: number,
    relationsToInclude: UserField[] = [],
    fieldsToInclude: UserField[] = [],
  ): Promise<User> {
    let query = this.usersRepository.createQueryBuilder('user').where('user.id = :id', { id });

    fieldsToInclude.forEach((field) => {
      query = query.addSelect(`user.${field}`);
    });

    relationsToInclude.forEach((relation) => {
      query = query.leftJoinAndSelect(`user.${relation}`, relation as string);
    });

    const user = await query.getOne();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  public async findManyByIds(ids: number[], relations: string[] = []): Promise<User[]> {
    if (!ids.length) return [];

    return this.usersRepository.find({
      where: { id: In(ids) },
      relations,
    });
  }

  public async findOneByEmail(
    email: string,
    relationsToInclude: UserField[] = [],
    fieldsToInclude: UserField[] = [],
  ): Promise<User | null> {
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

    return user;
  }

  public async findOneByOAuthId(
    oauthId: string,
    relationsToInclude: UserField[] = [],
    fieldsToInclude: UserField[] = [],
  ): Promise<User | null> {
    let query = this.usersRepository
      .createQueryBuilder('user')
      .where('user.oauthId = :oauthId', { oauthId });

    fieldsToInclude.forEach((field) => {
      query = query.addSelect(`user.${field}`);
    });

    relationsToInclude.forEach((relation) => {
      query = query.leftJoinAndSelect(`user.${relation}`, relation as string);
    });

    return query.getOne();
  }

  public async create(createUserDto: CreateUserDto): Promise<User> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const { username, ...userData } = createUserDto;

    const user = this.usersRepository.create({
      email: userData.email,
      hashedPassword,
    });

    await this.usersRepository.save(user);
    await this.accountService.create({ username }, user);

    return user;
  }

  public async createWithoutPassword(createUserDto: CreateUserWithoutPasswordDto): Promise<User> {
    try {
      await validateOrReject(createUserDto);
    } catch (errors) {
      throw new BadRequestException(errors);
    }

    const user = this.usersRepository.create(createUserDto);
    await this.usersRepository.save(user);

    return user;
  }

  public async update(id: number, updateData: UpdateUserDto): Promise<User> {
    const user = await this.findOneById(id);

    Object.assign(user, updateData);
    await this.usersRepository.save(user);

    return user;
  }

  public async deleteById(id: number): Promise<DeleteResult> {
    const user = await this.findOneById(id);
    return this.usersRepository.delete(user.id);
  }

  public async validateUser(email: string, password: string): Promise<User> {
    const user = await this.findOneByEmail(email, [], ['hashedPassword']);

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    if (!user.hashedPassword) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    return user;
  }

  public async sendPasswordResetEmail(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.findOneByEmail(forgotPasswordDto.email, [], ['oauthId']);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.oauthId) {
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

    await this.emailService.send({
      to: forgotPasswordDto.email,
      from: this.emailSendFrom,
      subject: 'Password Reset',
      html: `<p>Please use the following link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  }

  public async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const email = await this.decodeResetPasswordToken(resetPasswordDto.token);
    const user = await this.findOneByEmail(email, [], ['resetPasswordToken']);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.resetPasswordToken !== resetPasswordDto.token) {
      throw new BadRequestException('Invalid token');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(resetPasswordDto.password, salt);

    user.hashedPassword = hashedPassword;
    user.resetPasswordToken = null;

    await this.usersRepository.save(user);
  }

  private async decodeResetPasswordToken(token: string): Promise<string> {
    try {
      const payload = await this.jwtService.verify<ResetPasswordTokenPayload>(token, {
        secret: this.jwtResetPasswordTokenSecret,
      });

      if (payload?.email) {
        return payload.email;
      }

      throw new BadRequestException('Invalid reset token');
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new BadRequestException('Password reset token expired');
      }

      throw new BadRequestException('Invalid reset token');
    }
  }
}

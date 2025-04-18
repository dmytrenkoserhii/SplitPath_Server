import * as bcrypt from 'bcrypt';
import { DeleteResult, Repository } from 'typeorm';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateUserDto, UpdateUserDto } from '../dtos';
import { User } from '../entities';
import { AccountService } from './account.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly accountService: AccountService,
  ) {}

  public async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  public async findOneById(id: number, fieldsToInclude: string[] = ['id', 'email']): Promise<User> {
    let query = this.usersRepository.createQueryBuilder('user').where('user.id = :id', { id });

    fieldsToInclude.forEach((field) => {
      query = query.addSelect(`user.${field}`);
    });

    const user = await query.getOne();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  public async findOneByEmail(
    email: string,
    fieldsToInclude: string[] = ['id', 'email'],
  ): Promise<User> {
    let query = this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email });

    fieldsToInclude.forEach((field) => {
      query = query.addSelect(`user.${field}`);
    });

    const user = await query.getOne();
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
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

  public async update(id: number, updateData: UpdateUserDto): Promise<User> {
    const user = await this.findOneById(id);

    Object.assign(user, updateData);
    await this.usersRepository.save(user);

    return user;
  }

  public async deleteById(id: number): Promise<DeleteResult> {
    return this.usersRepository.delete(id);
  }
}

import { Repository } from 'typeorm';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateAccountDto, UpdateAccountDto } from '../dtos';
import { Account, User } from '../entities';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  public async findOneById(id: number): Promise<Account | null> {
    return this.accountRepository.findOne({
      where: { id },
    });
  }

  public async create(createAccountDto: CreateAccountDto, user: User): Promise<Account> {
    const account = await this.accountRepository.create({
      ...createAccountDto,
      user,
    });

    return this.accountRepository.save(account);
  }

  public async update(id: number, updateAccountDto: UpdateAccountDto): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    Object.assign(account, updateAccountDto);

    return this.accountRepository.save(account);
  }
}

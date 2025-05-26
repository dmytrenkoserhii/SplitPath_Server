import { Repository } from 'typeorm';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ErrorHandler } from '@/shared/utils';

import { CreateAccountDto, UpdateAccountDto } from '../dtos';
import { Account, User } from '../entities';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  public async findOneById(id: number): Promise<Account> {
    try {
      this.logger.debug(`Finding account by ID: ${id}`);
      const account = await this.accountRepository.findOne({ where: { id } });

      if (!account) {
        this.logger.warn(`Account not found with ID: ${id}`);
        throw new NotFoundException(`Account with ID ${id} not found`);
      }

      return account;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'AccountService.findOneById');
    }
  }

  public async findOneByUsername(username: string): Promise<Account | null> {
    try {
      this.logger.debug(`Finding account by username: ${username}`);
      const account = await this.accountRepository.findOne({ where: { username } });

      if (!account) {
        this.logger.debug(`No account found with username: ${username}`);
      }

      return account;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'AccountService.findOneByUsername');
    }
  }

  public async create(createAccountDto: CreateAccountDto, user: User): Promise<Account> {
    try {
      this.logger.debug(`Creating account with username: ${createAccountDto.username}`);
      const account = await this.accountRepository.create({
        ...createAccountDto,
        user,
      });

      const savedAccount = await this.accountRepository.save(account);
      this.logger.debug(`Account saved with ID: ${savedAccount.id}`);

      return savedAccount;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'AccountService.create');
    }
  }

  public async update(id: number, updateAccountDto: UpdateAccountDto): Promise<Account> {
    try {
      this.logger.debug(`Updating account details: ${id}`);
      const account = await this.findOneById(id);

      Object.assign(account, updateAccountDto);
      const updatedAccount = await this.accountRepository.save(account);

      this.logger.debug(`Account details updated: ${id}`);
      return updatedAccount;
    } catch (error: unknown) {
      ErrorHandler.handle(error, this.logger, 'AccountService.update');
    }
  }
}

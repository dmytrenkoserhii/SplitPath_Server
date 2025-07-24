import { Body, Controller, Get, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentSession } from '@/modules/auth/decorators';
import { AccessTokenGuard } from '@/modules/auth/guards';

import { UpdateAccountDto } from '../dtos';
import { Account } from '../entities';
import { AccountService, UsersService } from '../services';

@ApiTags('Account')
@Controller('account')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current user account details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns current user account details',
    type: Account,
  })
  public async getCurrentAccount(@CurrentSession('sub') sub: number): Promise<Account> {
    const user = await this.usersService.findOneById(sub, ['account']);
    return this.accountService.findOneById(user.account.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update current user account details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account updated successfully',
    type: Account,
  })
  public async updateCurrentAccount(
    @CurrentSession('sub') sub: number,
    @Body() updateAccountDto: UpdateAccountDto,
  ): Promise<Account> {
    const user = await this.usersService.findOneById(sub, ['account']);
    return this.accountService.update(user.account.id, updateAccountDto);
  }
}

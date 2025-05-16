import { In, Repository } from 'typeorm';

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UsersService } from '@/modules/users/services/users.service';
import { PaginatedResponse } from '@/shared/types';
import { createPaginatedResponse } from '@/shared/utils';

import { FRIEND_ERROR_MESSAGES } from '../constants/error-messages';
import { CreateFriendRequestDto, GetFriendRequestsDto } from '../dtos';
import { RequestDirection } from '../dtos/get-friend-requests.dto';
import { Friend } from '../entities';
import { FriendStatus } from '../enums';
import { FriendRequestWhereConditions } from '../types';

interface PaginationOptions {
  page: number;
  limit: number;
}

@Injectable()
export class FriendsService {
  private readonly logger = new Logger(FriendsService.name);

  constructor(
    @InjectRepository(Friend)
    private readonly friendsRepository: Repository<Friend>,
    private readonly usersService: UsersService,
  ) {}

  async sendFriendRequest(
    senderId: number,
    createFriendRequestDto: CreateFriendRequestDto,
  ): Promise<Friend> {
    const receiver = await this.usersService.findOneByEmail(createFriendRequestDto.email);

    if (!receiver) {
      throw new NotFoundException(FRIEND_ERROR_MESSAGES.NOT_FOUND);
    }

    if (receiver.id === senderId) {
      throw new BadRequestException(FRIEND_ERROR_MESSAGES.SELF_REQUEST);
    }

    const existingRequest = await this.friendsRepository.findOne({
      where: [
        { sender: { id: senderId }, receiver: { id: receiver.id } },
        { sender: { id: receiver.id }, receiver: { id: senderId } },
      ],
    });

    if (existingRequest) {
      throw new BadRequestException(FRIEND_ERROR_MESSAGES.DUPLICATE_REQUEST);
    }

    const friendRequest = this.friendsRepository.create({
      sender: { id: senderId },
      receiver: { id: receiver.id },
      status: FriendStatus.PENDING,
    });

    await this.friendsRepository.save(friendRequest);

    // Fetch and return the friend request with relations
    const friendRequestWithRelations = await this.friendsRepository.findOne({
      where: { id: friendRequest.id },
      relations: ['sender', 'receiver', 'sender.account', 'receiver.account'],
    });

    if (!friendRequestWithRelations) {
      throw new NotFoundException(FRIEND_ERROR_MESSAGES.NOT_FOUND);
    }

    return friendRequestWithRelations;
  }

  async acceptFriendRequest(userId: number, requestId: number): Promise<Friend> {
    const friendRequest = await this.friendsRepository.findOne({
      where: {
        id: requestId,
        receiver: { id: userId },
        status: In([FriendStatus.PENDING, FriendStatus.REJECTED]),
      },
      relations: ['sender', 'receiver', 'sender.account', 'receiver.account'],
    });

    if (!friendRequest) {
      throw new NotFoundException(FRIEND_ERROR_MESSAGES.NOT_FOUND);
    }

    friendRequest.status = FriendStatus.ACCEPTED;
    return this.friendsRepository.save(friendRequest);
  }

  async rejectFriendRequest(userId: number, requestId: number): Promise<Friend> {
    const friendRequest = await this.friendsRepository.findOne({
      where: { id: requestId, receiver: { id: userId }, status: FriendStatus.PENDING },
      relations: ['sender', 'receiver', 'sender.account', 'receiver.account'],
    });

    if (!friendRequest) {
      throw new NotFoundException(FRIEND_ERROR_MESSAGES.NOT_FOUND);
    }

    friendRequest.status = FriendStatus.REJECTED;
    return this.friendsRepository.save(friendRequest);
  }

  async getFriendsList(
    userId: number,
    { page, limit }: PaginationOptions,
  ): Promise<PaginatedResponse<Friend>> {
    const [items, total] = await this.friendsRepository.findAndCount({
      where: [
        { sender: { id: userId }, status: FriendStatus.ACCEPTED },
        { receiver: { id: userId }, status: FriendStatus.ACCEPTED },
      ],
      relations: ['sender', 'receiver', 'sender.account', 'receiver.account'],
      skip: (page - 1) * limit,
      take: limit,
    });

    return createPaginatedResponse(items, total, page, limit);
  }

  async getFriendRequests(
    userId: number,
    { status, direction, page = 1, limit = 10 }: GetFriendRequestsDto,
  ): Promise<PaginatedResponse<Friend>> {
    const whereConditions: FriendRequestWhereConditions = {};

    if (direction === RequestDirection.INCOMING) {
      whereConditions.receiver = { id: userId };
    } else if (direction === RequestDirection.OUTGOING) {
      whereConditions.sender = { id: userId };
    } else {
      // If no direction specified, get both incoming and outgoing
      whereConditions.where = [{ sender: { id: userId } }, { receiver: { id: userId } }];
    }

    if (status) {
      if (whereConditions.where) {
        whereConditions.where[0].status = status;
        whereConditions.where[1].status = status;
      } else {
        whereConditions.status = status;
      }
    }

    const [items, total] = await this.friendsRepository.findAndCount({
      where: whereConditions.where || whereConditions,
      relations: ['sender', 'receiver', 'sender.account', 'receiver.account'],
      skip: (page - 1) * limit,
      take: limit,
    });

    return createPaginatedResponse(items, total, page, limit);
  }

  async areFriends(userId1: number, userId2: number): Promise<boolean> {
    const friendship = await this.friendsRepository.findOne({
      where: [
        {
          sender: { id: userId1 },
          receiver: { id: userId2 },
          status: FriendStatus.ACCEPTED,
        },
        {
          sender: { id: userId2 },
          receiver: { id: userId1 },
          status: FriendStatus.ACCEPTED,
        },
      ],
    });

    if (!friendship) {
      this.logger.debug(`No friendship found between users ${userId1} and ${userId2}`);
      return false;
    }

    return true;
  }

  async deleteFriend(userId: number, id: number): Promise<Friend> {
    const friend = await this.friendsRepository.findOne({
      where: [
        {
          id,
          sender: { id: userId },
        },
        {
          id,
          receiver: { id: userId },
        },
      ],
    });

    if (!friend) {
      throw new NotFoundException(FRIEND_ERROR_MESSAGES.NOT_FOUND);
    }

    return this.friendsRepository.remove(friend);
  }

  async resendFriendRequest(userId: number, requestId: number): Promise<Friend> {
    const friendRequest = await this.friendsRepository.findOne({
      where: [{ id: requestId, sender: { id: userId }, status: FriendStatus.REJECTED }],
    });

    if (!friendRequest) {
      throw new NotFoundException(FRIEND_ERROR_MESSAGES.NOT_FOUND);
    }

    friendRequest.status = FriendStatus.PENDING;
    return this.friendsRepository.save(friendRequest);
  }
}

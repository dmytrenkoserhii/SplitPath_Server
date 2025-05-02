import { In, Repository } from 'typeorm';

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UsersService } from '@/modules/users/services/users.service';
import { PaginatedResponse } from '@/shared/types';

import { CreateFriendRequestDto } from '../dtos';
import { Friend } from '../entities';
import { FriendStatus } from '../enums';

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
    // Find receiver by email
    const receiver = await this.usersService.findOneByEmail(createFriendRequestDto.email);

    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    // Prevent self-friend request
    if (receiver.id === senderId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if friend request already exists
    const existingRequest = await this.friendsRepository.findOne({
      where: [
        { sender: { id: senderId }, receiver: { id: receiver.id } },
        { sender: { id: receiver.id }, receiver: { id: senderId } },
      ],
    });

    if (existingRequest) {
      throw new BadRequestException('Friend request already exists');
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

    // TODO: fix
    if (!friendRequestWithRelations) {
      throw new NotFoundException('Friend request not found');
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
      throw new NotFoundException('Friend request not found');
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
      throw new NotFoundException('Friend request not found');
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

    return this.createPaginatedResponse(items, total, page, limit);
  }

  async getPendingIncomingRequests(
    userId: number,
    { page, limit }: PaginationOptions,
  ): Promise<PaginatedResponse<Friend>> {
    const [items, total] = await this.friendsRepository.findAndCount({
      where: { receiver: { id: userId }, status: FriendStatus.PENDING },
      relations: ['sender', 'receiver', 'sender.account', 'receiver.account'],
      skip: (page - 1) * limit,
      take: limit,
    });

    return this.createPaginatedResponse(items, total, page, limit);
  }

  async getPendingOutgoingRequests(
    userId: number,
    { page, limit }: PaginationOptions,
  ): Promise<PaginatedResponse<Friend>> {
    const [items, total] = await this.friendsRepository.findAndCount({
      where: { sender: { id: userId }, status: FriendStatus.PENDING },
      relations: ['sender', 'receiver', 'sender.account', 'receiver.account'],
      skip: (page - 1) * limit,
      take: limit,
    });

    return this.createPaginatedResponse(items, total, page, limit);
  }

  async getRejectedIncomingRequests(
    userId: number,
    { page, limit }: PaginationOptions,
  ): Promise<PaginatedResponse<Friend>> {
    const [items, total] = await this.friendsRepository.findAndCount({
      where: { receiver: { id: userId }, status: FriendStatus.REJECTED },
      relations: ['sender', 'receiver', 'sender.account', 'receiver.account'],
      skip: (page - 1) * limit,
      take: limit,
    });

    return this.createPaginatedResponse(items, total, page, limit);
  }

  async getRejectedOutgoingRequests(
    userId: number,
    { page, limit }: PaginationOptions,
  ): Promise<PaginatedResponse<Friend>> {
    const [items, total] = await this.friendsRepository.findAndCount({
      where: { sender: { id: userId }, status: FriendStatus.REJECTED },
      relations: ['sender', 'receiver', 'sender.account', 'receiver.account'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return this.createPaginatedResponse(items, total, page, limit);
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
      throw new NotFoundException('Friend not found');
    }

    // Soft delete if your entity uses @DeleteDateColumn, otherwise use remove()
    return this.friendsRepository.remove(friend);
  }

  async resendFriendRequest(userId: number, requestId: number): Promise<Friend> {
    const friendRequest = await this.friendsRepository.findOne({
      where: [
        { id: requestId, sender: { id: userId }, status: FriendStatus.REJECTED },
        { id: requestId, sender: { id: userId }, status: FriendStatus.ACCEPTED },
      ],
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found or cannot be resent');
    }

    friendRequest.status = FriendStatus.PENDING;
    return this.friendsRepository.save(friendRequest);
  }

  private createPaginatedResponse<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      meta: {
        total,
        currentPage: page,
        itemsPerPage: limit,
        totalPages,
        hasNextPage: page < totalPages,
      },
    };
  }
}

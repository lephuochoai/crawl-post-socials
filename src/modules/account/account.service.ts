import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '@/databases/entities';
import { QueryPaginationDto } from '@/shared/dto/pagination.query';
import { paginateEntities, FetchType } from '@/utils/paginate';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>
  ) {}

  async getPosts(accountId: number, paginationDto: QueryPaginationDto) {
    const query = this.postRepository
      .createQueryBuilder('post')
      .where('post.socialAccountId = :accountId', { accountId })
      .orderBy('post.postedAt', 'DESC');

    return paginateEntities(query, paginationDto, FetchType.MANAGED);
  }
}

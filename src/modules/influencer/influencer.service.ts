import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Influencer } from '@/databases/entities';
import { GetInfluencersDto } from './dto/get-influencers.dto';
import { paginateEntities, FetchType } from '@/utils/paginate';

@Injectable()
export class InfluencerService {
  constructor(
    @InjectRepository(Influencer)
    private readonly influencerRepository: Repository<Influencer>
  ) {}

  async getAll(dto: GetInfluencersDto) {
    const { search } = dto;

    const query = this.influencerRepository
      .createQueryBuilder('influencer')
      .leftJoinAndSelect('influencer.accounts', 'accounts')
      .leftJoinAndSelect('accounts.social', 'social')
      .orderBy('influencer.id', 'ASC');

    if (search) {
      query.where('influencer.name ILIKE :search', { search: `%${search}%` });
    }

    return paginateEntities(query, dto, FetchType.MANAGED);
  }
}

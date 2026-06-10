import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { MatchModelName, type MatchDocument } from '../models/match.model';
import type { QueryMatchesDto } from '../dto/matches/query-matches.dto';

@Injectable()
export class MatchesService {
  constructor(
    @InjectModel(MatchModelName)
    private readonly matchModel: Model<MatchDocument>,
  ) {}

  async list(query: QueryMatchesDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    const tab = query.tab ?? 'all';
    if (tab === 'live') filter['status'] = 'live';
    else if (tab === 'upcoming') filter['status'] = 'not_started';
    else if (tab === 'finished') filter['status'] = 'finished';

    if (query.game) filter['game'] = query.game.toLowerCase().trim();

    if (query.region) {
      filter['region'] = {
        $regex: new RegExp(escapeRegex(query.region.trim()), 'i'),
      };
    }

    const total = await this.matchModel.countDocuments(filter).exec();

    let items: any[];
    if (tab === 'all') {
      items = await this.matchModel
        .aggregate([
          { $match: filter },
          {
            $addFields: {
              _statusOrder: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$status', 'live'] }, then: 0 },
                    { case: { $eq: ['$status', 'not_started'] }, then: 1 },
                    { case: { $eq: ['$status', 'finished'] }, then: 2 },
                  ],
                  default: 1,
                },
              },
            },
          },
          { $sort: { _statusOrder: 1, startsAt: 1 } },
          { $skip: skip },
          { $limit: limit },
          { $project: { _statusOrder: 0 } },
        ])
        .exec();
    } else {
      const sort: Record<string, 1 | -1> =
        tab === 'finished' ? { startsAt: -1 } : { startsAt: 1 };
      items = await this.matchModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();
    }

    return { items, page, limit, total, hasMore: skip + items.length < total };
  }

  async getById(id: string) {
    const match = await this.matchModel.findById(id).lean().exec();
    if (!match) throw new NotFoundException('Match not found');
    return match;
  }

  async getStats() {
    const [live, upcoming, finished] = await Promise.all([
      this.matchModel.countDocuments({ status: 'live' }),
      this.matchModel.countDocuments({ status: 'not_started' }),
      this.matchModel.countDocuments({ status: 'finished' }),
    ]);
    return { live, upcoming, finished, total: live + upcoming + finished };
  }
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

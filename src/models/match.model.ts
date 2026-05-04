import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type MatchDocument = HydratedDocument<Match>;

export const MatchModelName = 'Match';

export type MatchStatus = 'live' | 'not_started' | 'finished';

@Schema({ timestamps: true })
export class Match {
  @Prop({ type: String, required: true, unique: true, index: true })
  externalId!: string;

  @Prop({ type: String, required: true, index: true })
  game!: string; // normalized short slug: lol, csgo, dota2, valorant …

  @Prop({ type: String, index: true })
  region?: string; // league slug: lck, lcs, lec, vcs …

  @Prop({
    type: String,
    enum: ['live', 'not_started', 'finished'],
    required: true,
    index: true,
  })
  status!: MatchStatus;

  @Prop({ type: Date, index: true })
  startsAt?: Date;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        acronym: { type: String },
        imageUrl: { type: String },
        score: { type: Number },
        externalId: { type: Number },
      },
    ],
    default: [],
  })
  teams!: Array<{
    name: string;
    acronym?: string;
    imageUrl?: string;
    score?: number;
    externalId?: number;
  }>;

  @Prop({ type: String })
  matchName?: string;

  @Prop({ type: String })
  tournamentName?: string;

  @Prop({ type: String })
  leagueName?: string;

  @Prop({ type: String })
  serieName?: string;

  @Prop({ type: Number })
  numberOfGames?: number;

  @Prop({ type: Date })
  endedAt?: Date; // populated from provider's end_at when status=finished

  @Prop({ type: String, index: true })
  provider?: string; // 'pandascoree' | 'mock'

  @Prop({ type: Date, required: true })
  syncedAt!: Date;
}

export const MatchSchema = SchemaFactory.createForClass(Match);

MatchSchema.index({ status: 1, startsAt: 1 });
MatchSchema.index({ game: 1, status: 1, startsAt: 1 });
MatchSchema.index({ region: 1, status: 1, startsAt: 1 });
MatchSchema.index({ game: 1, region: 1, status: 1, startsAt: -1 });

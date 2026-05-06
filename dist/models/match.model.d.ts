import type { HydratedDocument } from 'mongoose';
export type MatchDocument = HydratedDocument<Match>;
export declare const MatchModelName = "Match";
export type MatchStatus = 'live' | 'not_started' | 'finished';
export declare class Match {
    externalId: string;
    game: string;
    region?: string;
    status: MatchStatus;
    startsAt?: Date;
    teams: Array<{
        name: string;
        acronym?: string;
        imageUrl?: string;
        score?: number;
        externalId?: number;
    }>;
    matchName?: string;
    tournamentName?: string;
    leagueName?: string;
    serieName?: string;
    numberOfGames?: number;
    endedAt?: Date;
    provider?: string;
    syncedAt: Date;
}
export declare const MatchSchema: import("mongoose").Schema<Match, import("mongoose").Model<Match, any, any, any, any, any, Match>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Match, import("mongoose").Document<unknown, {}, Match, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Match & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    externalId?: import("mongoose").SchemaDefinitionProperty<string, Match, import("mongoose").Document<unknown, {}, Match, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Match & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    game?: import("mongoose").SchemaDefinitionProperty<string, Match, import("mongoose").Document<unknown, {}, Match, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Match & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    region?: import("mongoose").SchemaDefinitionProperty<string | undefined, Match, import("mongoose").Document<unknown, {}, Match, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Match & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<MatchStatus, Match, import("mongoose").Document<unknown, {}, Match, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Match & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    startsAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Match, import("mongoose").Document<unknown, {}, Match, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Match & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    teams?: import("mongoose").SchemaDefinitionProperty<{
        name: string;
        acronym?: string;
        imageUrl?: string;
        score?: number;
        externalId?: number;
    }[], Match, import("mongoose").Document<unknown, {}, Match, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Match & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    matchName?: import("mongoose").SchemaDefinitionProperty<string | undefined, Match, import("mongoose").Document<unknown, {}, Match, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Match & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    tournamentName?: import("mongoose").SchemaDefinitionProperty<string | undefined, Match, import("mongoose").Document<unknown, {}, Match, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Match & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    leagueName?: import("mongoose").SchemaDefinitionProperty<string | undefined, Match, import("mongoose").Document<unknown, {}, Match, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Match & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    serieName?: import("mongoose").SchemaDefinitionProperty<string | undefined, Match, import("mongoose").Document<unknown, {}, Match, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Match & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    numberOfGames?: import("mongoose").SchemaDefinitionProperty<number | undefined, Match, import("mongoose").Document<unknown, {}, Match, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Match & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    endedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Match, import("mongoose").Document<unknown, {}, Match, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Match & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    provider?: import("mongoose").SchemaDefinitionProperty<string | undefined, Match, import("mongoose").Document<unknown, {}, Match, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Match & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    syncedAt?: import("mongoose").SchemaDefinitionProperty<Date, Match, import("mongoose").Document<unknown, {}, Match, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Match & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Match>;

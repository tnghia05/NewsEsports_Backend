import { LoLEsportsService } from '../services/lol-esports.service';
export declare class LoLEsportsController {
    private readonly lolesports;
    constructor(lolesports: LoLEsportsService);
    getLive(hl?: string): Promise<{
        id: any;
        startTime: any;
        state: any;
        blockName: any;
        league: {
            id: any;
            name: any;
            slug: any;
            image: any;
        };
        tournament: any;
        match: {
            id: any;
            strategy: any;
            teams: any;
            games: {
                number: any;
                id: any;
                state: any;
            }[];
        };
        streams: {
            youtube: {
                videoId: any;
                locale: any;
                statsEnabled: boolean;
            } | null;
            twitch: {
                channel: any;
                locale: any;
                statsEnabled: boolean;
            } | null;
            lpl: {
                url: any;
                locale: any;
            } | null;
            bilibili: {
                url: any;
                locale: any;
            } | null;
        };
        liveGameId: any;
    }[]>;
    getSchedule(hl?: string, pageToken?: string): Promise<{
        events: {
            id: any;
            startTime: any;
            state: any;
            blockName: any;
            league: {
                id: any;
                name: any;
                slug: any;
                image: any;
            };
            tournament: any;
            match: {
                id: any;
                strategy: any;
                teams: any;
                games: {
                    number: any;
                    id: any;
                    state: any;
                }[];
            };
            streams: {
                youtube: {
                    videoId: any;
                    locale: any;
                    statsEnabled: boolean;
                } | null;
                twitch: {
                    channel: any;
                    locale: any;
                    statsEnabled: boolean;
                } | null;
                lpl: {
                    url: any;
                    locale: any;
                } | null;
                bilibili: {
                    url: any;
                    locale: any;
                } | null;
            };
            liveGameId: any;
        }[];
        pages: any;
    }>;
    getEventDetails(matchId: string, hl?: string): Promise<{
        match: {
            games: any;
            id: any;
            strategy: any;
            teams: any;
        };
        id: any;
        startTime: any;
        state: any;
        blockName: any;
        league: {
            id: any;
            name: any;
            slug: any;
            image: any;
        };
        tournament: any;
        streams: {
            youtube: {
                videoId: any;
                locale: any;
                statsEnabled: boolean;
            } | null;
            twitch: {
                channel: any;
                locale: any;
                statsEnabled: boolean;
            } | null;
            lpl: {
                url: any;
                locale: any;
            } | null;
            bilibili: {
                url: any;
                locale: any;
            } | null;
        };
        liveGameId: any;
    } | null>;
    getLiveStats(gameId: string, startingTime?: string): Promise<any>;
    getLiveStatsDetails(gameId: string, startingTime?: string): Promise<any>;
    getPostgameStats(gameId: string, firstFrameTime?: string): Promise<{
        gameState: any;
        blueTeam: {
            totalGold: any;
            totalKills: any;
            towers: any;
            inhibitors: any;
            barons: any;
            dragons: any;
            participants: {
                participantId: any;
                summonerName: any;
                championId: any;
                role: any;
                kills: any;
                deaths: any;
                assists: any;
                totalGold: any;
                creepScore: any;
                level: any;
            }[];
        };
        redTeam: {
            totalGold: any;
            totalKills: any;
            towers: any;
            inhibitors: any;
            barons: any;
            dragons: any;
            participants: {
                participantId: any;
                summonerName: any;
                championId: any;
                role: any;
                kills: any;
                deaths: any;
                assists: any;
                totalGold: any;
                creepScore: any;
                level: any;
            }[];
        };
    } | null>;
    getGameTimeline(gameId: string): Promise<{
        minute: number;
        blueGold: number;
        redGold: number;
        diff: number;
    }[] | null>;
}

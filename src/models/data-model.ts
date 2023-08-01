export type DataModel = {
  version: number;
  lastUpdate: number;
  // interventions: Intervention[];
  users: User[];
  /** Page blocks selected for display, e.g. beeldvorming, oordeelsvorming or besluitvorming */
  logs: Log[];
  /** Events on the timeline */
  timelineEvents: TimelineEventType[];
  /** Organisations involved in the crisis */
  organisations: string[];
  /** Locations involved in the crisis */
  locations: string[];
};

export const defaultModel = {
  version: 1,
  lastUpdate: new Date().valueOf(),
  users: [],
  logs: [],
  timelineEvents: [],
  organisations: [],
  locations: [],
} as DataModel;

export type ID = string;

export type User = {
  id: ID;
  name: string;
  phone?: string;
  email?: string;
  url?: string;
  isAuthor?: boolean;
};

export type PageInfo = {
  offsetX: number;
  offsetY: number;
  fontHeight: number;
  line: string;
};

export type EnrichedPageInfo = PageInfo & {
  style: string;
  indented: boolean;
  join: boolean;
  startParagraph: boolean;
  /** Timestamp of the subsequent content blocks */
  timestamp?: number;
};

export type Page = {
  pageNumber: number;
  pageInfo: PageInfo[];
};

export type Log = {
  timestamp?: number;
  author?: string;
  grip?: number;
  blocks: EnrichedPageInfo[];
};

export type TimelineEventType = {
  /** Number representing a JS date */
  timestamp: number;
  /** Index in the logbook that use this timestamp */
  logIndex: number;
  // kind: 'melding' | 'bob' | 'gms' | 'edit';
  // summary?: string;
  author?: string;
};

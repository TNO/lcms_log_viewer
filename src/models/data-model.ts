export type DataModel = {
  version: number;
  lastUpdate: number;
  // interventions: Intervention[];
  users: User[];
};

export const defaultModel = {
  version: 1,
  lastUpdate: new Date().valueOf(),
  interventions: [],
  users: [],
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

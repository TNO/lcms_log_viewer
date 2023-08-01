import m, { FactoryComponent } from 'mithril';
import { meiosisSetup } from 'meiosis-setup';
import { routingSvc } from '.';
import {
  Dashboards,
  DataModel,
  defaultModel,
  Log,
  TimelineEventType,
  EnrichedPageInfo,
} from '../models';
import { ldb } from '../utils/local-ldb';
import { MeiosisCell, Update } from 'meiosis-setup/types';

const MODEL_KEY = 'LLV_MODEL';
const JOURNAL_TITLE = 'LLV_JOURNAL_TITLE';
const PAGE_BLOCKS = 'LLV_PAGES';

export interface State {
  page: Dashboards;
  model: DataModel;
  curLogIndex: number;
  title: string;
  pageEntries: EnrichedPageInfo[];
  timeline: TimelineEventType[];
}

export interface Actions {
  setPage: (page: Dashboards) => void;
  changePage: (
    page: Dashboards,
    params?: Record<string, string | number | undefined>,
    query?: Record<string, string | number | undefined>
  ) => void;
  saveModel: (ds: DataModel) => void;
  saveLog: (title: string, blocks: EnrichedPageInfo[]) => Promise<void>;
  setLogIndex: (curLogIndex: number) => void;
}

export type MeiosisComponent<T extends { [key: string]: any } = {}> = FactoryComponent<{
  state: State;
  actions: Actions;
  options?: T;
}>;

const setTitle = (title: string) => {
  document.title = `LCMS LOG VIEWER: ${title}`;
};

const createLogs = (pageEntries: EnrichedPageInfo[]) => {
  let addToLog = false;
  let skipLines = 0;
  let grip: number;
  const organisations = [] as string[];
  const locations = [] as string[];
  const logs = pageEntries
    .reduce((acc, cur, i) => {
      if (skipLines > 0) {
        skipLines--;
        return acc;
      }
      // console.log(cur.line);
      if (['h1', 'h2'].indexOf(cur.style) >= 0) {
        addToLog = false;
        return acc;
      }
      if (cur.style === 'h4' && i + 1 < pageEntries.length) {
        const nextIsBody = pageEntries[i + 1].style === 'body';
        if (nextIsBody && /algemeen\s+-\s+grip-status/i.test(cur.line)) {
          const match = /grip\s+.*(\d)\s*$/i.exec(pageEntries[i + 1].line);
          if (match && match.length >= 2) grip = +match[1];
          skipLines = 1;
          return acc;
        } else if (nextIsBody && /algemeen\s+-\s+locatie/i.test(cur.line)) {
          let j = i + 1;
          do {
            locations.push(pageEntries[j].line);
            j++;
            skipLines++;
          } while (j < pageEntries.length && pageEntries[j].style === 'body');
          skipLines = 1;
          return acc;
        } else if (nextIsBody && /algemeen\s+-\s+betrokken organisaties/i.test(cur.line)) {
          let j = i + 1;
          do {
            organisations.push(pageEntries[j].line);
            j++;
            skipLines++;
          } while (j < pageEntries.length && pageEntries[j].style === 'body');
          skipLines = 1;
          return acc;
        } else if (!/beeldvorming|oordeel|besluitvorming/i.test(cur.line)) {
          let j = i + 1;
          do {
            j++;
            skipLines++;
          } while (j < pageEntries.length && pageEntries[j].style === 'body');
          return acc;
        }
      }
      if (cur.style === 'h3') {
        addToLog = true;
        acc.push({
          grip,
          timestamp: cur.timestamp,
          author: cur.line,
          blocks: [],
        });
      } else if (addToLog && acc.length > 0) {
        acc[acc.length - 1].blocks.push(cur);
      }
      return acc;
    }, [] as Log[])
    .filter((log: Log) => log.blocks.length > 0);
  // console.log(logs);
  const timelineEvents: TimelineEventType[] = logs.map((cur, i) => ({
    timestamp: cur.timestamp || 0,
    logIndex: i,
    author: cur.author,
  }));

  // console.log({ logs, organisations, timelineEvents, locations });
  return { logs, organisations, timelineEvents, locations };
};

export const appActions: (cell: MeiosisCell<State>) => Actions = ({ update }) => ({
  // addDucks: (cell, amount) => {
  //   cell.update({ ducks: (value) => value + amount });
  // },
  setPage: (page) => update({ page }),
  changePage: (page, params, query) => {
    routingSvc && routingSvc.switchTo(page, params, query);
    update({ page });
  },
  saveModel: (model) => {
    model.lastUpdate = Date.now();
    model.version = model.version ? ++model.version : 1;
    ldb.set(MODEL_KEY, JSON.stringify(model));
    // console.log(JSON.stringify(model, null, 2));
    update({ model: () => model, curLogIndex: -1, pageEntries: () => [], timeline: () => [] });
  },
  saveLog: async (title, pageEntries) => {
    setTitle(title);
    await ldb.set(JOURNAL_TITLE, title);
    await ldb.set(PAGE_BLOCKS, JSON.stringify(pageEntries));
    update({
      title,
      curLogIndex: pageEntries.length > 0 ? 0 : -1,
      pageEntries: () => pageEntries,
      model: (m) => ({ ...m, ...createLogs(pageEntries) }),
    });
  },
  setLogIndex: (curLogIndex) => update({ curLogIndex }),
});

const initialize = async (update: Update<State>) => {
  const ds = await ldb.get(MODEL_KEY);
  const model = ds ? JSON.parse(ds) : defaultModel;
  const p = await ldb.get(PAGE_BLOCKS);
  const pageEntries = (p ? JSON.parse(p) : []) as EnrichedPageInfo[];
  const t = await ldb.get(JOURNAL_TITLE);
  const title = t ? t : '';
  setTitle(title);

  update({
    model: () => ({ ...model, ...createLogs(pageEntries) }),
    pageEntries: () => pageEntries,
    curLogIndex: pageEntries.length > 0 ? 0 : -1,
    title,
  });
};

const app = {
  initial: {
    title: '',
    page: Dashboards.HOME,
    model: defaultModel,
    curLogIndex: -1,
    pageEntries: [],
    timeline: [],
  } as State,
};
export const cells = meiosisSetup<State>({ app });
initialize(cells().update);

cells.map(() => {
  m.redraw();
});

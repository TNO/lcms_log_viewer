import m, { FactoryComponent } from 'mithril';
import { meiosisSetup } from 'meiosis-setup';
import { routingSvc } from '.';
import { Dashboards, DataModel, defaultModel, ID, SearchFilter } from '../models';
import { ldb } from '../utils/local-ldb';
import { MeiosisCell, Update } from 'meiosis-setup/types';
import { EnrichedPageInfo } from '../utils';

const MODEL_KEY = 'LLV_MODEL';
const CUR_USER_KEY = 'LLV_CUR_USER';
const BOOKMARKS_KEY = 'LLV_BOOKMARK';
const COMPARE_LIST_KEY = 'LLV_COMPARE_LIST_KEY';
const JOURNAL_TITLE = 'LLV_JOURNAL_TITLE';
const PAGE_BLOCKS = 'LLV_PAGES';

export interface State {
  page: Dashboards;
  model: DataModel;
  curUser?: string;
  bookmarks: ID[];
  compareList: ID[];
  searchFilters: SearchFilter;
  title: string;
  blocks: EnrichedPageInfo[];
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
  saveCurUser: (ds: string) => void;
  bookmark: (id: ID) => void;
  compare: (id: ID) => void;
  setCompareList: (ids: ID[]) => void;
  setSearchFilters: (sf: Partial<SearchFilter>) => void;
}

export type MeiosisComponent<T extends { [key: string]: any } = {}> = FactoryComponent<{
  state: State;
  actions: Actions;
  options?: T;
}>;

const setTitle = (title: string) => {
  document.title = `LCMS LOG VIEWER: ${title}`;
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
    update({ model: () => model });
  },
  saveLog: async (title, blocks) => {
    setTitle(title);
    await ldb.set(JOURNAL_TITLE, title);
    await ldb.set(PAGE_BLOCKS, JSON.stringify(blocks));
    update({ title, blocks: () => blocks });
  },
  saveCurUser: (curUser: string) => {
    ldb.set(CUR_USER_KEY, curUser);
    update({ curUser });
  },
  bookmark: (id: ID) =>
    update({
      bookmarks: (bookmarks = []) => {
        const newBookmarks = (() => {
          if (bookmarks.indexOf(id) >= 0) return bookmarks.filter((b) => b !== id);
          bookmarks.push(id);
          return bookmarks;
        })();
        ldb.set(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
        return newBookmarks;
      },
    }),
  compare: (id: ID) =>
    update({
      compareList: (compareList = []) => {
        const newCompareList = (() => {
          if (compareList.indexOf(id) >= 0) return compareList.filter((b) => b !== id);
          compareList.push(id);
          return compareList;
        })();
        ldb.set(COMPARE_LIST_KEY, JSON.stringify(newCompareList));
        return newCompareList;
      },
    }),
  setCompareList: (ids: ID[]) => {
    ldb.set(COMPARE_LIST_KEY, JSON.stringify(ids));
    update({ compareList: () => ids });
  },
  setSearchFilters: (searchFilters: Partial<SearchFilter>) => {
    // console.log(JSON.stringify(searchFilters, null, 2));
    update({ searchFilters });
  },
});

const initialize = async (update: Update<State>) => {
  const ds = await ldb.get(MODEL_KEY);
  const model = ds ? JSON.parse(ds) : defaultModel;
  const b = await ldb.get(BOOKMARKS_KEY);
  const bookmarks = b ? JSON.parse(b) : [];
  const p = await ldb.get(PAGE_BLOCKS);
  const blocks = p ? JSON.parse(p) : [];
  const t = await ldb.get(JOURNAL_TITLE);
  const title = t ? t : '';
  setTitle(title);

  const curUser = (await ldb.get(CUR_USER_KEY)) || '';
  update({
    model: () => model,
    bookmarks: () => bookmarks,
    blocks: () => blocks,
    title,
    curUser,
  });
};

const app = {
  initial: {
    page: Dashboards.HOME,
    model: defaultModel,
    curIntervention: undefined,
    bookmarks: [],
    compareList: [],
    curUser: 'mod',
    searchFilters: {} as SearchFilter,
    showFutureInterventions: 'HIDE',
    title: '',
    blocks: [],
  } as State,
};
export const cells = meiosisSetup<State>({ app });
initialize(cells().update);

cells.map(() => {
  m.redraw();
});

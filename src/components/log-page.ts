import m from 'mithril';
import { Dashboards } from '../models';
import { MeiosisComponent } from '../services';
import { EnrichedPageInfo, toMarkdown } from '../utils';
import { render } from 'slimdown-js';
import { Icon, Select } from 'mithril-materialized';

export const LogPage: MeiosisComponent = () => {
  type Log = {
    timestamp?: number;
    author?: string;
    grip?: number;
    blocks: EnrichedPageInfo[];
  };

  let location: string;
  let organisations: string;
  let logs = [] as Log[];
  let curLogIndex = 0;
  let timestamps = [] as Array<{ logIndex: number; timestamp: number }>;

  const getGridIcon = () => {
    if (curLogIndex >= 0 && curLogIndex < logs.length) {
      const grip = logs[curLogIndex].grip;
      if (grip && 1 <= grip && grip < 6) return ['one', 'two', 3, 4, 5, 6][grip - 1];
    }
    return undefined;
  };

  const createLogs = (blocks: EnrichedPageInfo[]) => {
    console.log(logs);
    let addToLog = false;
    let skipLines = 0;
    let grip: number;
    logs = blocks
      .reduce((acc, cur, i) => {
        console.log(cur.line);
        if (skipLines > 0) {
          skipLines--;
          return acc;
        }
        if (['h1', 'h2'].indexOf(cur.style) >= 0) {
          addToLog = false;
          return acc;
        }
        if (cur.style === 'h4' && i + 1 < blocks.length) {
          const nextIsBody = blocks[i + 1].style === 'body';
          if (nextIsBody && /algemeen\s+-\s+grip-status/i.test(cur.line)) {
            const match = /grip\s+.*(\d)\s*$/i.exec(blocks[i + 1].line);
            if (match && match.length >= 2) grip = +match[1];
            skipLines = 1;
            return acc;
          } else if (nextIsBody && /algemeen\s+-\s+locatie/i.test(cur.line)) {
            location = blocks[i + 1].line;
            skipLines = 1;
            return acc;
          } else if (nextIsBody && /algemeen\s+-\s+betrokken organisaties/i.test(cur.line)) {
            organisations = blocks[i + 1].line;
            skipLines = 1;
            return acc;
          } else if (!/beeldvorming|oordeel|besluitvorming/i.test(cur.line)) {
            let j = i + 1;
            do {
              j++;
              skipLines++;
            } while (j < blocks.length && blocks[j].style === 'body');
            return acc;
          }
        }
        if (cur.style === 'h3') {
          addToLog = true;
          cur.timestamp && timestamps.push({ logIndex: acc.length, timestamp: cur.timestamp });
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
      .filter((log) => log.blocks.length > 0);
  };

  return {
    oninit: ({
      attrs: {
        state: { blocks },
        actions: { setPage },
      },
    }) => {
      createLogs(blocks);
      setPage(Dashboards.LOG);
    },
    view: ({
      attrs: {
        state: { blocks },
      },
    }) => {
      if (!logs || logs.length === 0) {
        createLogs(blocks);
      }
      const fullText =
        logs &&
        curLogIndex >= 0 &&
        logs.length > 0 &&
        logs[curLogIndex].blocks.map(toMarkdown).join('\n');
      const gripIcon = getGridIcon();
      return m('.log-viewer', { style: 'height: 95vh' }, [
        m('.row', [
          m(Select, {
            className: 'col s6',
            label: 'Selecteer tijd',
            onchange: (i) => {
              curLogIndex = +i[0];
            },
            options: timestamps.map(({ logIndex, timestamp }) => ({
              id: logIndex,
              label: new Date(timestamp).toLocaleString(),
            })),
          }),
          gripIcon &&
            m(Icon, {
              className: 'col s1 offset-s5 medium',
              iconName: `looks_${gripIcon}`,
            }),
        ]),
        m('.row', [fullText && m('.col.s12.markdown', m.trust(render(fullText, false)))]),
      ]);
    },
  };
};

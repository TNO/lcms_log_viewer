import m, { FactoryComponent } from 'mithril';
import { Dashboards, Log } from '../models';
import { MeiosisComponent } from '../services';
import { toMarkdown } from '../utils';
import { render } from 'slimdown-js';
import { ISelectOptions, Icon, RoundIconButton, Select } from 'mithril-materialized';
import { Timeline } from './ui';

const LogView: FactoryComponent<{ logs: Log[] }> = () => {
  const logsToMarkdown = (logs: Log) => logs.blocks.map(toMarkdown).join('\n');

  return {
    view: ({ attrs: { logs } }) => {
      console.log(logs);
      const { beeld, oordeel, besluit } = logs.reduce(
        (acc, cur) => {
          const header = (cur.blocks && cur.blocks.length && cur.blocks[0].line) || '';
          if (/beeld/i.test(header)) {
            acc.beeld += logsToMarkdown(cur);
          } else if (/oordeel/i.test(header)) {
            acc.oordeel += logsToMarkdown(cur);
          } else if (/besluit/i.test(header)) {
            acc.besluit += logsToMarkdown(cur);
          }
          return acc;
        },
        { beeld: '', oordeel: '', besluit: '' } as {
          beeld: string;
          oordeel: string;
          besluit: string;
        }
      );
      return m('.log-view.markdown.row', [
        m('.beeld.col.s6', m.trust(render(beeld))),
        m(
          '.ob.col.s6',
          m('.row', [
            m('.oordeel.col.s12', m.trust(render(oordeel))),
            m('.oordeel.col.s12', m.trust(render(besluit))),
          ])
        ),
      ]);
    },
  };
};

export const LogPage: MeiosisComponent = () => {
  const getGridIcon = (curLogIndex: number, logs: Log[]) => {
    if (curLogIndex >= 0 && curLogIndex < logs.length) {
      const grip = logs[curLogIndex].grip;
      if (grip && 1 <= grip && grip < 6) return ['one', 'two', 3, 4, 5, 6][grip - 1];
    }
    return undefined;
  };
  const getCurrentTime = (curLogIndex: number, logs: Log[]) => {
    if (curLogIndex >= 0 && curLogIndex < logs.length) {
      return logs[curLogIndex].timestamp;
    }
    return undefined;
  };
  let curView = 1 as 1 | 2 | 3;

  return {
    oninit: ({
      attrs: {
        // state: { pageEntries: blocks },
        actions: { setPage },
      },
    }) => {
      // createLogs(blocks);
      setPage(Dashboards.LOG);
    },
    view: ({ attrs: { state, actions } }) => {
      const {
        curLogIndex,
        title,
        model: { logs, timelineEvents, locations, organisations },
      } = state;
      const { setLogIndex } = actions;

      const gripIcon = getGridIcon(curLogIndex, logs);
      const curTime = getCurrentTime(curLogIndex, logs);
      const activeLogs =
        curTime &&
        logs
          .filter((log) => !log.timestamp || log.timestamp <= curTime)
          .reduce((acc, cur) => {
            let curBlock: string;
            cur.blocks.forEach((block) => {
              if (block.style === 'h4') {
                curBlock = block.line;
                acc[curBlock] = { ...cur, blocks: [block] } as Log;
              } else if (acc[curBlock]) {
                acc[curBlock].blocks.push(block);
              }
            });
            return acc;
          }, {} as Record<string, Log>);
      const tabs =
        activeLogs &&
        Object.keys(activeLogs).reduce(
          (acc, cur) => {
            if (/meldkamer/i.test(cur)) acc['MELDKAMER'].push(activeLogs[cur]);
            else if (/copi/i.test(cur)) acc['CoPI'].push(activeLogs[cur]);
            return acc;
          },
          { CoPI: [], MELDKAMER: [] } as { CoPI: Log[]; MELDKAMER: Log[] }
        );
      // console.log(tabs);

      return m('.log-viewer', [
        m('.row', [
          tabs &&
            m(Select, {
              initialValue: curView,
              options: [
                tabs.MELDKAMER.length && { id: 2, label: 'Meldkamer' },
                tabs.CoPI.length && { id: 3, label: 'COPI' },
                { id: 1, label: 'Overig' },
              ].filter(Boolean),
              onchange: (i) => {
                curView = i[0] as 1 | 2 | 3;
              },
              className: 'col s4',
            } as ISelectOptions<number>),
          curTime &&
            m('.col.s5', [
              m(Icon, { iconName: 'access_time', className: 'left medium' }),
              m(Icon, {
                iconName: 'chevron_left',
                className: 'left medium clickable',
                disable: curLogIndex <= 0,
                onclick: () => setLogIndex(curLogIndex - 1),
              }),
              m('h5.left', new Date(curTime).toLocaleString('nl-NL')),
              m(Icon, {
                iconName: 'chevron_right',
                className: 'right medium clickable',
                disable: curLogIndex >= logs.length - 1,
                onclick: () => setLogIndex(curLogIndex + 1),
              }),
            ]),
          gripIcon &&
            m('.col.s3', [
              m(Icon, {
                className: 'medium right',
                iconName: `looks_${gripIcon}`,
              }),
              m('h5.right', 'GRIP'),
            ]),
          tabs &&
            m(
              '.col.s12',
              curView === 1
                ? [
                    locations.length > 0 &&
                      m('.row', m('.col.s12', [m('h5', 'Locaties'), m('p', locations)])),
                    organisations.length > 0 &&
                      m('.row', m('.col.s12', [m('h5', 'Organisaties'), m('p', organisations)])),
                  ]
                : curView === 2
                ? m(LogView, { logs: tabs.MELDKAMER })
                : curView === 3
                ? m(LogView, { logs: tabs.CoPI })
                : []
            ),
        ]),
        timelineEvents &&
          timelineEvents.length > 0 &&
          m('.row', m('.col.s12', { key: title }, m(Timeline, { state, actions }))),
      ]);
    },
  };
};

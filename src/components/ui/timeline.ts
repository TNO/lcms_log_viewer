import m from 'mithril';
import { MeiosisComponent } from '../../services';
import { generateNumbers } from '../../utils';
// import { Operation } from 'rfc6902';

export type MeldingsClassificatie = {
  mc1?: string;
  mc2?: string;
  mc3?: string;
  priority?: 'prio1' | 'prio2' | 'prio3' | 'prio4' | 'prio5';
};

export const Timeline: MeiosisComponent = () => {
  const margin = 20;
  const height = 60;
  const lineHeight = 4;
  const y = 10;
  const cy = y + lineHeight / 2;

  let width = 0;
  let secondsPerPixel = 1;
  /** Earliest time (rounded to hours) */
  let startTime: number;
  /** Latest time (rounded to hours) */
  let endTime: number;

  return {
    oninit: async ({
      attrs: {
        state: {
          model: { timelineEvents },
        },
      },
    }) => {
      if (!timelineEvents) return;
      const timestamps = timelineEvents.map((e) => e.timestamp);
      const minTimestamp = new Date(Math.min(...timestamps));
      startTime = new Date(
        minTimestamp.getFullYear(),
        minTimestamp.getMonth(),
        minTimestamp.getDate(),
        minTimestamp.getHours(),
        0,
        0
      ).valueOf();
      const maxTimestamp = new Date(Math.max(...timestamps));
      endTime = new Date(
        maxTimestamp.getFullYear(),
        maxTimestamp.getMonth(),
        maxTimestamp.getDate(),
        maxTimestamp.getHours() + 1,
        0,
        0
      ).valueOf();
    },
    oncreate: ({ dom }) => {
      width = dom.clientWidth - 2 * margin;
      secondsPerPixel = (endTime.valueOf() - startTime.valueOf()) / (1000 * width);
      m.redraw();
    },
    view: ({
      attrs: {
        state: {
          curLogIndex,
          model: { timelineEvents },
        },
        actions: { setLogIndex },
      },
    }) => {
      if (width === 0) return m('.timeline');

      // TODO Add the current timeline events to the timeline, using the specified times, not their created times...
      // This will also prevent entries when a timeline event is renamed.
      const events = timelineEvents
        .map((ti) => {
          const { timestamp, author } = ti;
          const ts = new Date(timestamp).toLocaleTimeString('nl-NL');
          const cx = margin + +((timestamp - startTime) / (1000 * secondsPerPixel)).toFixed(1);
          const title = author;
          return {
            ts,
            cx,
            title,
          };
        })
        .filter(Boolean);

      const markers = generateNumbers(startTime, endTime, 3600000).map((timestamp) => ({
        timestamp,
        x: margin + +((timestamp - startTime) / (1000 * secondsPerPixel)).toFixed(1),
      }));
      return (
        width > 0 &&
        m(
          '.timeline',
          m(
            'svg',
            {
              style: 'margin: 0px;',
              width: `${width + 2 * margin}px`,
              height: `${height}px`,
            },
            [
              m('rect', {
                x: margin,
                y,
                width,
                height: lineHeight,
                color: 'fill: black',
              }),
              markers.map(({ timestamp, x }) => [
                m('line', {
                  x1: x,
                  y1: y,
                  x2: x,
                  y2: y + 15,
                  stroke: 'black',
                  'stroke-width': lineHeight,
                }),
                // m('title', new Date(timestamp).toLocaleTimeString('nl-NL')),
                m(
                  'text[text-anchor=middle]',
                  { x, y: y + 35 },
                  timestamp &&
                    new Date(timestamp).toLocaleTimeString('nl-NL').replace(/:\d{2}$/, '')
                ),
              ]),
              events.length > 0 &&
                events
                  .map((ev, i) => {
                    const { ts, cx, title } = ev || {};
                    const color = i === curLogIndex ? 'red' : 'black';
                    return m(
                      'circle',
                      {
                        cx,
                        cy,
                        r: 6,
                        stroke: color,
                        'stroke-width': 3,
                        fill: color,
                        onclick: () => {
                          // console.log(ts + ': ' + title);
                          setLogIndex(i);
                        },
                      },
                      m('title', title ? `${ts}: ${title}` : ts)
                    );
                  })
                  .reverse(),
            ]
          )
        )
      );
    },
  };
};

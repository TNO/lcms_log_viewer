import m from 'mithril';
import { Select } from 'mithril-materialized';
import { render } from 'slimdown-js';
import { Dashboards } from '../models';
import { MeiosisComponent } from '../services';

const md = `#### About`;

export const AboutPage: MeiosisComponent = () => {
  return {
    oninit: ({
      attrs: {
        actions: { setPage },
      },
    }) => setPage(Dashboards.ABOUT),
    view: ({
      attrs: {
        state: { curUser },
        actions: { saveCurUser },
      },
    }) => {
      // const isCleared = !model;
      if (!curUser) saveCurUser('mod');
      return [
        m('.row', [
          [
            m(Select, {
              key: curUser,
              label: 'Current user',
              initialValue: curUser,
              placeholder: 'Select user',
              options: [
                { id: 'mod', label: 'Defence employee' },
                { id: 'admin', label: 'TNO researcher' },
              ],
              // data: users.reduce((acc, cur) => {
              //   acc[cur.name] = cur.url || null;
              //   return acc;
              // }, {} as Record<string, string | null>),
              onchange: (v) => v && saveCurUser(v[0] as string),
              className: 'col s6',
            }),
          ],
          // m(FlatButton, {
          //   label: 'Logout',
          //   onclick: () => saveCurUser(''),
          //   iconName: 'logout',
          //   className: 'col s6',
          // }),
        ]),
        m('.row', m.trust(render(md))),
      ];
    },
  };
};

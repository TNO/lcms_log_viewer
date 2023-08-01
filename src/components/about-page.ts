import m from 'mithril';
import { render } from 'slimdown-js';
import { Dashboards } from '../models';
import { MeiosisComponent } from '../services';

const md = `#### Over deze applicatie

Deze EXPERIMENTELE LCMS viewer stelt je in staat om een LCMS log, als PDF document, in te laden. Vervolgens kan het incident nogmaals doorlopen worden in de tijd. 
Op dit moment zijn er nog een aantal beperkingen:

- Doorgestreepte tekst wordt niet als dusdanig weergegeven. Dus als 1 slachtoffer wordt verandert in 2 slachtoffers, dan staat er 12 slachtoffers.
- Tabellen worden nog niet goed weergegeven. Dit is een groot nadeel, vooral in de besluitvorming.
`;

export const AboutPage: MeiosisComponent = () => {
  return {
    oninit: ({
      attrs: {
        actions: { setPage },
      },
    }) => setPage(Dashboards.ABOUT),
    view: (
      {
        // attrs: {
        //   state: { curUser },
        //   actions: { saveCurUser },
        // },
      }
    ) => {
      // const isCleared = !model;
      // if (!curUser) saveCurUser('mod');
      return [
        m('.row', [
          // [
          //   m(Select, {
          //     key: curUser,
          //     label: 'Current user',
          //     initialValue: curUser,
          //     placeholder: 'Select user',
          //     options: [
          //       { id: 'mod', label: 'Defence employee' },
          //       { id: 'admin', label: 'TNO researcher' },
          //     ],
          //     // data: users.reduce((acc, cur) => {
          //     //   acc[cur.name] = cur.url || null;
          //     //   return acc;
          //     // }, {} as Record<string, string | null>),
          //     onchange: (v) => v && saveCurUser(v[0] as string),
          //     className: 'col s6',
          //   }),
          // ],
          // m(FlatButton, {
          //   label: 'Logout',
          //   onclick: () => saveCurUser(''),
          //   iconName: 'logout',
          //   className: 'col s6',
          // }),
        ]),
        m('.row.markdown', m.trust(render(md))),
      ];
    },
  };
};

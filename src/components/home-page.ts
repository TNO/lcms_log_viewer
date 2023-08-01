import m from 'mithril';
import { Button, Icon, ModalPanel, padLeft } from 'mithril-materialized';
import background from '../assets/lcms_logo.png';
import { MeiosisComponent, routingSvc } from '../services';
import { Page, Dashboards, DataModel, defaultModel } from '../models';
import { formatDate, onFinish, pdfToText } from '../utils';
// import { padLeft } from '';

export const HomePage: MeiosisComponent = () => {
  const readerAvailable = window.File && window.FileReader && window.FileList && window.Blob;

  return {
    oninit: ({
      attrs: {
        actions: { setPage },
      },
    }) => {
      setPage(Dashboards.HOME);
      // const uriModel = m.route.param('model');
      // if (!uriModel) {
      //   return;
      // }
      // try {
      //   const decompressed = lz.decompressFromEncodedURIComponent(uriModel);
      //   if (!decompressed) {
      //     return;
      //   }
      //   const model = JSON.parse(decompressed);
      //   saveModel(model);
      //   changePage(Dashboards.OVERVIEW);
      // } catch (err) {
      //   console.error(err);
      // }
    },
    view: ({
      attrs: {
        actions: { saveModel, saveLog, changePage },
      },
    }) => {
      const isCleared = false;

      return [
        m('div', { style: 'position: relative;' }, [
          m('img.responsive-img.center', { src: background }),
          m('.buttons.center', { style: 'margin: 10px auto;' }, [
            m(Button, {
              iconName: 'clear',
              disabled: isCleared,
              className: 'btn-large',
              label: 'Clear',
              modalId: 'clearAll',
            }),
            // m('a#downloadAnchorElem', { style: 'display:none' }),
            // m(Button, {
            //   iconName: 'download',
            //   disabled: isCleared,
            //   className: 'btn-large',
            //   label: 'Download',
            //   onclick: () => {
            //     const dlAnchorElem = document.getElementById('downloadAnchorElem');
            //     if (!dlAnchorElem) {
            //       return;
            //     }
            //     const version = typeof model.version === 'undefined' ? 1 : model.version++;
            //     const dataStr =
            //       'data:text/json;charset=utf-8,' +
            //       encodeURIComponent(JSON.stringify({ ...model, version }, null, 2));
            //     dlAnchorElem.setAttribute('href', dataStr);
            //     dlAnchorElem.setAttribute(
            //       'download',
            //       `${formatDate()}_v${padLeft(version, 3)}_hpte_model.json`
            //     );
            //     dlAnchorElem.click();
            //   },
            // }),
            m('input#selectFiles[type=file][accept=.pdf]', { style: 'display:none' }),
            // m('input#selectFiles[type=file][accept=.json,.pdf]', { style: 'display:none' }),
            readerAvailable &&
              m(Button, {
                iconName: 'upload',
                className: 'btn-large',
                label: 'Upload',
                onclick: () => {
                  const fileInput = document.getElementById('selectFiles') as HTMLInputElement;
                  fileInput.onchange = () => {
                    if (!fileInput) {
                      return;
                    }
                    const files = fileInput.files;
                    if (!files || (files && files.length <= 0)) {
                      return;
                    }
                    const data = files && files.item(0);
                    const isJson = data && /json$/i.test(data.name);
                    const reader = new FileReader();
                    reader.onload = async (e: ProgressEvent<FileReader>) => {
                      if (isJson) {
                        const result = (e && e.target && e.target.result) as string;
                        const json = JSON.parse(result.toString()) as DataModel;
                        json && json.version && saveModel(json);
                        changePage(Dashboards.LOG);
                      } else {
                        const t = new Uint8Array(reader.result as ArrayBuffer);
                        const done = async (title: string, pages: Page[]) => {
                          const allBlocks = onFinish(pages);
                          await saveLog(title, allBlocks);
                          // const fullText = allBlocks.map(toMarkdown).join('') + '\n\n';
                          // console.log(fullText);
                        };
                        await pdfToText(t, done);
                        changePage(Dashboards.LOG);
                      }
                    };
                    if (data) {
                      isJson ? reader.readAsText(data) : reader.readAsArrayBuffer(data);
                    }
                  };
                  fileInput.click();
                },
              }),
            // m(Button, {
            //   iconName: 'link',
            //   className: 'btn-large',
            //   label: 'Permalink',
            //   onclick: () => {
            //     const permLink = document.createElement('input') as HTMLInputElement;
            //     document.body.appendChild(permLink);
            //     if (!permLink) {
            //       return;
            //     }
            //     const compressed = lz.compressToEncodedURIComponent(JSON.stringify(model));
            //     const url = `${window.location.href}${
            //       /\?/.test(window.location.href) ? '&' : '?'
            //     }model=${compressed}`;
            //     permLink.value = url;
            //     permLink.select();
            //     permLink.setSelectionRange(0, 999999); // For mobile devices
            //     try {
            //       const successful = document.execCommand('copy');
            //       if (successful) {
            //         M.toast({
            //           html: 'Copied permanent link to clipboard.',
            //           classes: 'yellow black-text',
            //         });
            //       }
            //     } catch (err) {
            //       M.toast({
            //         html: 'Failed copying link to clipboard: ' + err,
            //         classes: 'red',
            //       });
            //     } finally {
            //       document.body.removeChild(permLink);
            //     }
            //   },
            // }),
          ]),
          m(
            '.section.white',
            m('.row.container.center', [
              m(
                '.row',
                m(
                  '.col.s12.align-center',
                  'Deze EXPERIMENTELE viewer staat je toe om een LCMS log (PDF) in te laden, en het incident nog eens na te lopen.'
                )
              ),
              m('.row', [
                m(
                  '.col.s12.m4',
                  m('.icon-block', [
                    m('.center', m(Icon, { iconName: 'visibility' })),
                    m('h5.center', 'Beeldvorming'),
                    m('p', 'Lees nog eens na hoe het allemaal verlopen is.'),
                  ])
                ),
                m(
                  '.col.s12.m4',
                  m('.icon-block', [
                    m('.center', m(Icon, { iconName: 'balance' })),
                    m('h5.center', 'Beoordeel'),
                    m('p', `Liep het incident lekker, of kan het nog beter.`),
                  ])
                ),
                m(
                  '.col.s12.m4',
                  m('.icon-block', [
                    m('.center', m(Icon, { iconName: 'edit_note' })),
                    m('h5.center', 'Beslis'),
                    m(
                      'p',
                      'Valt hier iets uit te leren? Zo ja, misschien goed om deze lessen op te nemen in de Lessons Learned Library...'
                    ),
                  ])
                ),
              ]),
            ])
          ),
          m(ModalPanel, {
            id: 'clearAll',
            title: 'Do you really want to delete everything?',
            description: 'Are you sure that you want to delete your model?',
            buttons: [
              {
                label: 'Yes',
                iconName: 'delete',
                onclick: () => {
                  saveModel(defaultModel);
                  routingSvc.switchTo(Dashboards.LOG);
                },
              },
              { label: 'No', iconName: 'cancel' },
            ],
          }),
        ]),
      ];
    },
  };
};

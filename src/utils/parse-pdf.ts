// This file is called myPDFfileToText.js and is in the root folder
import { getDocument, PDFPageProxy } from 'pdfjs-dist';
import { TextItem, TypedArray } from 'pdfjs-dist/types/src/display/api';
import { EnrichedPageInfo, Page, PageInfo } from '../models';

/**
 *
 * @param arr Path to the pdf file.
 * @param callbackAllDone Called after all text has been collected. Input parameters:
 *        1) Pdf pages.
 * @param callbackPageDone To inform the progress each time
 *        when a page is finished. The callback function's input parameters are:
 *        1) number of pages done.
 *        2) total number of pages in file.
 *        3) the `page` PDFPageProxy object itself or null.
 *
 */
export const pdfToText = async (
  arr: TypedArray,
  callbackAllDone: (title: string, page: Page[]) => void | Promise<void>,
  callbackPageDone?: (completed: number, total: number, page?: PDFPageProxy) => void | Promise<void>
) => {
  let complete = 0;
  const pdf = await getDocument(arr).promise;
  const total = pdf.numPages;
  const md = await pdf.getMetadata();
  const title: string = (md && md.info && (md.info as any)['Title']) || '';
  callbackPageDone && callbackPageDone(0, total);

  let pages: Page[] = [];
  // For some (pdf?) reason these don't all come in consecutive
  // order. That's why they're stored as an object and then
  // processed one final time at the end.
  for (let pageIndex = 1; pageIndex <= total; pageIndex++) {
    const page = await pdf.getPage(pageIndex);
    let pageNumber = page.pageNumber;
    const textContent = await page.getTextContent();
    if (textContent.items !== null) {
      const pageInfo = [] as PageInfo[];
      let line = '';
      let offsetX = -1;
      let offsetY = -1;
      let lastItem: TextItem | null = null;
      for (const item of (textContent.items as TextItem[])
        .filter((item) => item.str)
        .sort((a, b) => (a.transform[5] > b.transform[5] ? -1 : 1))) {
        if (offsetX < 0) offsetX = item.transform[4];
        if (offsetY < 0) offsetY = item.transform[5];
        // I think to add whitespace properly would be more complex and
        // would require two loops.
        if (lastItem !== null && lastItem.str[lastItem.str.length - 1] !== ' ') {
          const itemX = item.transform[4];
          const lastItemX = lastItem.transform[4];
          const itemY = item.transform[5];
          const lastItemY = lastItem.transform[5];
          if (itemY < lastItemY) {
            // New line
            pageInfo.push({
              offsetX,
              offsetY,
              fontHeight: lastItem.transform[3],
              line,
            });
            offsetX = itemX;
            offsetY = itemY;
            line = '';
          } else if (
            itemX !== lastItemX &&
            !/^(\s?[a-zA-Z0-9])$|^(.+\s[a-zA-Z0-9])$/.test(lastItem.str)
          ) {
            line += ' ';
          }
        }

        line += item.str;
        lastItem = item;
      }
      pageInfo.push({
        offsetX,
        offsetY,
        fontHeight: lastItem?.transform[3],
        line,
      });

      pages.push({ pageNumber, pageInfo });
    }

    ++complete;

    callbackPageDone && callbackPageDone(complete, total, page);

    // If all done, put pages in order and combine all
    // text, then pass that to the callback
    if (complete === total) {
      // Using `setTimeout()` isn't a stable way of making sure
      // the process has finished. Watch out for missed pages.
      // A future version might do this with promises.
      setTimeout(function () {
        // let full_text = [];
        // let num_pages = Object.keys(pages).length;
        // for (let pageNum = 1; pageNum <= num_pages; pageNum++)
        //   full_text += pages[pageNum];
        // callbackAllDone(full_text);
        callbackAllDone(title, pages);
      }, 1000);
    }
  }
};

const headerAndFooterFilter = (pageInfoBlock: PageInfo) =>
  pageInfoBlock.fontHeight !== 12 && 50 <= pageInfoBlock.offsetY && pageInfoBlock.offsetY < 790;

const fontToStyle = (fontHeights: number[]) => {
  const styles = fontHeights.map((_, i) => (i + 1 < fontHeights.length ? `h${i + 1}` : 'body'));
  return (fontHeight: number) => styles[fontHeights.indexOf(fontHeight)];
};

const offsetToIndent = () => {
  // const isIndented = indents.map(
  //   (indent, i) => i === 0 || indent > indents[i - 1] + 20
  // );
  let lastOffsetX = 0;
  let lastStyle = '';
  return (style: string, offsetX: number) => {
    // const indented =  isIndented[indents.indexOf(offsetX)];
    const indented = style === lastStyle && offsetX > lastOffsetX + 20;
    if (!indented) lastOffsetX = offsetX;
    lastStyle = style;
    return indented;
  };
};

const newParagraphFactory = (fontHeightBody = 0) => {
  const threshold = 2 * fontHeightBody;
  let lastOffsetY = 0;
  let lastStyle = '';
  return (style: string, indented = false, offsetY = 0) => {
    const newParagraph =
      style === 'body' &&
      indented === false &&
      (lastStyle !== 'body' || offsetY < lastOffsetY - threshold);
    lastOffsetY = offsetY;
    lastStyle = style;
    return newParagraph;
  };
};

const joinLineWithPrevious = () => {
  let lastOffsetX = 0;
  let lastStyle = '';
  return (style: string, offsetX = 0, line = '') => {
    const joinLine =
      style === lastStyle &&
      offsetX === lastOffsetX &&
      line.length > 0 &&
      !/\d/.test(line[0]) &&
      line[0] === line[0].toLowerCase();
    lastStyle = style;
    lastOffsetX = offsetX;
    return joinLine;
  };
};

const styleToMarkdown = (style = 'h1') => {
  const match = /h(\d+)/.exec(style);
  return match && match.length === 2 ? `\n\n${Array(+match[1]).fill('#').join('')} ` : '';
};

const timestampFactory = () => {
  const extractTime = /(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/i;
  let timestamp: Date | undefined;
  return (line: string) => {
    if (!extractTime.test(line)) return timestamp;
    const match = extractTime.exec(line);
    if (!match || match.length < 6) return timestamp;
    timestamp = new Date(+match[3], +match[2] - 1, +match[1], +match[4], +match[5], 0, 0);
    return timestamp.valueOf();
  };
};

export const toMarkdown: (params: EnrichedPageInfo) => string = ({
  style,
  indented,
  startParagraph,
  line,
}) => {
  const prefix =
    style === 'body'
      ? startParagraph
        ? '\n\n'
        : indented
        ? '\n- '
        : ''
      : `${styleToMarkdown(style)}`;
  return `${prefix}${line}`;
};

export const onFinish = (pages: Page[]) => {
  const fontHeights = Array.from(
    pages.reduce((acc, { pageInfo }) => {
      pageInfo
        .filter(headerAndFooterFilter)
        .map(({ fontHeight }) => fontHeight)
        .forEach((fontHeight) => acc.add(fontHeight));
      return acc;
    }, new Set<number>())
  ).sort((a, b) => (a > b ? -1 : 1));
  // console.table({ fontHeights });
  const styler = fontToStyle(fontHeights);

  const isIndented = offsetToIndent();
  const newParagraph = newParagraphFactory(fontHeights[fontHeights.length - 1]);
  const joinLine = joinLineWithPrevious();
  const timestamper = timestampFactory();

  const allBlocks = [] as EnrichedPageInfo[];

  pages
    .sort((a, b) => (a.pageNumber > b.pageNumber ? 1 : -1))
    .map(({ pageInfo }) => {
      const blocks = pageInfo
        .filter(headerAndFooterFilter)
        .map(({ fontHeight, offsetX, offsetY, line }) => {
          const style = styler(fontHeight);
          const indented = isIndented(style, offsetX);
          const join = joinLine(style, offsetX, line);
          const startParagraph = newParagraph(style, indented, offsetY);
          const timestamp = timestamper(line);
          // console.log(`${style} ${fontHeight} ${line}`);
          return {
            style,
            indented,
            join,
            startParagraph,
            fontHeight,
            offsetX,
            offsetY,
            line,
            timestamp,
          } as EnrichedPageInfo;
        })
        .reduce((acc, cur) => {
          if (cur.join && acc.length) {
            acc[acc.length - 1].line += ' ' + cur.line;
          } else {
            acc.push(cur);
          }
          return acc;
        }, [] as EnrichedPageInfo[]);

      allBlocks.push(...blocks);
      // const fullText = blocks.map(toMarkdown).join('') + '\n\n';
      // return fullText;
    });
  return allBlocks;
};

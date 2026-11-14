/** Test double for pdfjs-dist, mapped in jest.config.cjs. pdf.js itself cannot run in jsdom. */
export const GlobalWorkerOptions = { workerSrc: '' };

export const getDocument = jest.fn();

/** Creates one span per text item, like pdf.js does, without positioning */
export class TextLayer {
  textDivs: HTMLElement[] = [];
  textContentItemsStr: string[] = [];
  private container: HTMLElement;
  private items: { str?: string }[];

  constructor({
    textContentSource,
    container,
  }: {
    textContentSource: any;
    container: HTMLElement;
  }) {
    this.container = container;
    this.items = textContentSource.items;
  }

  render() {
    this.items.forEach((item) => {
      if (item.str === undefined) {
        return;
      }

      const span = document.createElement('span');
      span.textContent = item.str;
      this.textDivs.push(span);
      this.textContentItemsStr.push(item.str);
      this.container.append(span);
    });

    return Promise.resolve();
  }

  cancel() {}
}

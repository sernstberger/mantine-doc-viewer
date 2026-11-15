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

export const AnnotationType = { LINK: 2, WIDGET: 20 };

interface LinkData {
  id: string;
  url?: string;
  dest?: unknown;
  action?: string;
}

/** Creates one link per annotation and binds it through the link service, like pdf.js does */
export class AnnotationLayer {
  private div: HTMLElement;
  private linkService: any;

  constructor({ div, linkService }: { div: HTMLElement; linkService: any }) {
    this.div = div;
    this.linkService = linkService;
  }

  render({ annotations }: { annotations: LinkData[] }) {
    annotations.forEach((data) => {
      const section = document.createElement('section');
      section.className = 'linkAnnotation';
      const link = document.createElement('a');
      link.setAttribute('data-element-id', data.id);

      if (data.url) {
        this.linkService.addLinkAttributes(link, data.url);
      } else if (data.action) {
        link.href = this.linkService.getAnchorUrl('');
        link.onclick = () => {
          this.linkService.executeNamedAction(data.action);
          return false;
        };
      } else {
        link.href = this.linkService.getDestinationHash(data.dest);
        link.onclick = () => {
          this.linkService.goToDestination(data.dest);
          return false;
        };
      }

      section.append(link);
      this.div.append(section);
    });

    return Promise.resolve();
  }
}

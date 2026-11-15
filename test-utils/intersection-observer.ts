/**
 * IntersectionObserver for tests, which jsdom does not have. Without it the viewer treats every
 * element as visible; with it, tests decide what is in view:
 *
 *   const io = installIntersectionObserver();
 *   io.setIntersecting(element, true);   // calls the observers watching element
 *   io.uninstall();
 */
type Callback = (entries: Partial<IntersectionObserverEntry>[], observer: unknown) => void;

class TestIntersectionObserver {
  static instances = new Set<TestIntersectionObserver>();
  readonly elements = new Set<Element>();
  readonly options?: IntersectionObserverInit;
  private readonly callback: Callback;

  constructor(callback: Callback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    TestIntersectionObserver.instances.add(this);
  }

  observe(element: Element) {
    this.elements.add(element);
  }

  unobserve(element: Element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
    TestIntersectionObserver.instances.delete(this);
  }

  takeRecords() {
    return [];
  }

  notify(element: Element, isIntersecting: boolean) {
    if (this.elements.has(element)) {
      this.callback(
        [{ target: element, isIntersecting, intersectionRatio: isIntersecting ? 1 : 0 }],
        this
      );
    }
  }
}

export function installIntersectionObserver() {
  const previous = (window as any).IntersectionObserver;
  (window as any).IntersectionObserver = TestIntersectionObserver;

  return {
    /** Observers created since installing */
    get observers() {
      return Array.from(TestIntersectionObserver.instances);
    },

    /** Reports `element` as in or out of view to every observer watching it */
    setIntersecting(element: Element, isIntersecting: boolean) {
      TestIntersectionObserver.instances.forEach((observer) =>
        observer.notify(element, isIntersecting)
      );
    },

    /** Reports every observed element as in or out of view */
    setAllIntersecting(isIntersecting: boolean) {
      TestIntersectionObserver.instances.forEach((observer) =>
        Array.from(observer.elements).forEach((element) => observer.notify(element, isIntersecting))
      );
    },

    uninstall() {
      TestIntersectionObserver.instances.clear();
      (window as any).IntersectionObserver = previous;
    },
  };
}

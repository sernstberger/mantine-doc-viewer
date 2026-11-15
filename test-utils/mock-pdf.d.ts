export declare const getDocument: jest.Mock;
export declare const PAGE_TEXT: {
    str: string;
    hasEOL: boolean;
}[][];
export declare function mockPdf({ numPages, fail, unreadablePage, outline, password, links, layers, attachments, 
/** Size of the file that pdf.js reports through onProgress */
total, 
/** Document information, or 'fail' when it cannot be read */
info, }?: {
    numPages?: number | undefined;
    fail?: boolean | undefined;
    unreadablePage?: number | undefined;
    outline?: unknown[] | null | undefined;
    password?: string | undefined;
    links?: unknown[] | undefined;
    layers?: {
        id: string;
        name: string;
        visible: boolean;
    }[] | undefined;
    attachments?: Map<string, {
        filename: string;
        description: string;
    }> | null | undefined;
    total?: number | undefined;
    info?: Record<string, unknown> | "fail" | undefined;
}): {
    page: {
        render: jest.Mock<{
            promise: Promise<void>;
            cancel: jest.Mock<any, any, any>;
        }, [], any>;
        cleanup: jest.Mock<boolean, [], any>;
    };
    document: {
        numPages: number;
        getPage: jest.Mock<Promise<{
            rotate: number;
            getViewport: ({ scale, rotation }: {
                scale: number;
                rotation?: number;
            }) => {
                clone: () => {
                    width: number;
                    height: number;
                };
                convertToPdfPoint: (x: number, y: number) => number[];
                width: number;
                height: number;
            };
            render: jest.Mock<{
                promise: Promise<void>;
                cancel: jest.Mock<any, any, any>;
            }, [], any>;
            cleanup: jest.Mock<boolean, [], any>;
            getAnnotations: jest.Mock<Promise<unknown[]>, [], any>;
            view: number[];
            getTextContent: jest.Mock<Promise<{
                items: {
                    str: string;
                    hasEOL: boolean;
                }[];
                styles: {};
            }>, [], any>;
        }>, [pageNumber: number], any>;
        getOutline: jest.Mock<Promise<unknown[] | null>, [], any>;
        getDestination: jest.Mock<Promise<{
            num: number;
        }[] | null>, [name: string], any>;
        getPageIndex: jest.Mock<Promise<number>, [], any>;
        getData: jest.Mock<Promise<Uint8Array<ArrayBuffer>>, [], any>;
        extractPages: jest.Mock<Promise<Uint8Array<ArrayBuffer>>, [], any>;
        annotationStorage: {
            values: Map<string, unknown>;
            setValue(key: string, value: unknown): void;
            remove(key: string): void;
        };
        saveDocument: jest.Mock<Promise<Uint8Array<ArrayBuffer>>, [], any>;
        getMetadata: jest.Mock<Promise<{
            info: Record<string, unknown>;
        }>, [], any>;
        getDownloadInfo: jest.Mock<Promise<{
            length: number;
        }>, [], any>;
        getAttachments: jest.Mock<Promise<Map<string, {
            filename: string;
            description: string;
        }> | null>, [], any>;
        getAttachmentContent: jest.Mock<Promise<Uint8Array<ArrayBuffer>>, [], any>;
        getOptionalContentConfig: jest.Mock<Promise<{
            [Symbol.iterator]: () => MapIterator<[string, {
                id: string;
                name: string;
                visible: boolean;
            }]>;
            setVisibility: (id: string, visible: boolean) => void;
        }>, [], any>;
    };
    annotationStorage: {
        values: Map<string, unknown>;
        setValue(key: string, value: unknown): void;
        remove(key: string): void;
    };
    saved: Map<string, unknown>[];
};

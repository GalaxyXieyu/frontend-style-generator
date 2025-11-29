export interface Snapshot {
    id: string;
    url: string;
    title: string;
    html: string;
    css: string;
    assets: {
        images: ImageAsset[];
        fonts: FontAsset[];
    };
    metadata: {
        viewport: {
            width: number;
            height: number;
            devicePixelRatio: number;
        };
        userAgent: string;
        language: string;
        charset: string;
        meta: {
            description?: string;
            keywords?: string;
            author?: string;
            ogImage?: string;
            ogTitle?: string;
            ogDescription?: string;
        };
        performance?: {
            loadTime: number;
            domReady: number;
            firstPaint?: number;
            navigationType: number;
            redirectCount: number;
        };
        stats: {
            totalElements: number;
            totalImages: number;
            totalLinks: number;
            totalScripts: number;
            totalStyles: number;
        };
    };
    extractedAt: string;
    extractionTime: number;
}

export interface ImageAsset {
    type: 'img' | 'background' | 'srcset';
    src: string;
    originalSrc?: string;
    alt?: string;
    width?: number;
    height?: number;
    base64?: string;
    element?: string;
}

export interface FontAsset {
    family: string;
    src?: string;
    url?: string;
    weight?: string;
    style?: string;
}

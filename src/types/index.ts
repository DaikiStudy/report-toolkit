export interface AnnotationConfig {
  pageTitle: string;
  url: string;
  position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  displayMode: 'title' | 'url' | 'both';
  fontScale: number;
  bgOpacity: number;
  textColor: string;
  bgColor: string;
}

export interface UrlHistoryEntry {
  id: string;
  longUrl: string;
  shortUrl: string;
  createdAt: string;
}

export interface QrConfig {
  text: string;
  size: number;
  darkColor: string;
  lightColor: string;
}

export type ImageFormat = 'image/png' | 'image/jpeg' | 'image/webp';

export type ToolId = 'annotator' | 'bg-removal' | 'converter' | 'upscaler' | 'url-qr';

export interface ToolInfo {
  id: ToolId;
  label: string;
  icon: string;
  description: string;
}

import type { AnnotationConfig, ImageFormat } from '../types';

/**
 * 長いURLをドメイン+短縮パスに省略する。
 * 例: "https://ja.wikipedia.org/wiki/Tokyo_Tower_History" → "ja.wikipedia.org/wiki/Toky…"
 */
function truncateUrl(url: string, maxLen: number = 40): string {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname;
    const path = parsed.pathname + parsed.search;
    const full = domain + path;
    if (full.length <= maxLen) return full;
    if (domain.length >= maxLen - 1) return domain.slice(0, maxLen - 1) + '…';
    const remaining = maxLen - domain.length - 1;
    return domain + path.slice(0, remaining) + '…';
  } catch {
    if (url.length <= maxLen) return url;
    return url.slice(0, maxLen - 1) + '…';
  }
}

/**
 * 高品質アップスケール: 段階的2x拡大+アンシャープマスクで画質を向上する。
 * 一度に大きく拡大するより段階的に2倍ずつ拡大する方が品質が良い。
 */
export function upscaleImage(
  sourceImage: HTMLImageElement,
  scale: number,
  sharpen: boolean = true
): HTMLCanvasElement {
  let current = document.createElement('canvas');
  current.width = sourceImage.naturalWidth;
  current.height = sourceImage.naturalHeight;
  const initCtx = current.getContext('2d')!;
  initCtx.drawImage(sourceImage, 0, 0);

  // 段階的2x拡大
  let remaining = scale;
  while (remaining > 1) {
    const step = Math.min(remaining, 2);
    const newW = Math.round(current.width * step);
    const newH = Math.round(current.height * step);
    const next = document.createElement('canvas');
    next.width = newW;
    next.height = newH;
    const ctx = next.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(current, 0, 0, newW, newH);
    current = next;
    remaining /= step;
  }

  // シャープ化（アンシャープマスク）
  if (sharpen) {
    applyUnsharpMask(current, 0.6);
  }

  return current;
}

/**
 * アンシャープマスク: ぼやけを軽減してシャープに見せる。
 * amount: 0.0〜1.0（シャープの強さ）
 */
function applyUnsharpMask(canvas: HTMLCanvasElement, amount: number) {
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const { data } = imageData;
  const copy = new Uint8ClampedArray(data);

  // 3x3ガウスぼかしカーネル
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  const kSum = 16;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let blurred = 0;
        let ki = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            blurred += copy[((y + ky) * w + (x + kx)) * 4 + c] * kernel[ki++];
          }
        }
        blurred /= kSum;
        const idx = (y * w + x) * 4 + c;
        // original + amount * (original - blurred)
        data[idx] = Math.min(255, Math.max(0, Math.round(copy[idx] + amount * (copy[idx] - blurred))));
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

/**
 * 出典オーバーレイ用: 小さい画像は長辺1920pxまで高品質アップスケール。
 * 大きい画像はそのまま。
 */
const ANNOTATE_MIN_LONG = 1920;

export function prepareAnnotationCanvas(sourceImage: HTMLImageElement): HTMLCanvasElement {
  const origW = sourceImage.naturalWidth;
  const origH = sourceImage.naturalHeight;
  const longSide = Math.max(origW, origH);

  if (longSide >= ANNOTATE_MIN_LONG) {
    // 大きい画像はそのまま
    const c = document.createElement('canvas');
    c.width = origW;
    c.height = origH;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(sourceImage, 0, 0);
    return c;
  }

  // 小さい画像は高品質アップスケール
  const scale = ANNOTATE_MIN_LONG / longSide;
  return upscaleImage(sourceImage, scale, true);
}

/**
 * 準備済みキャンバスにアノテーションを描画する（プレビュー用、再アップスケールなし）。
 */
export function renderAnnotationsOnCanvas(
  preparedCanvas: HTMLCanvasElement,
  config: AnnotationConfig
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = preparedCanvas.width;
  canvas.height = preparedCanvas.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(preparedCanvas, 0, 0);
  drawAnnotationOverlay(ctx, canvas.width, canvas.height, config);
  return canvas;
}

function drawAnnotationOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  config: AnnotationConfig
): void {
  // 表示モードに応じてテキスト行を決定
  const lines: string[] = [];
  if (config.displayMode === 'title' || config.displayMode === 'both') {
    if (config.pageTitle) lines.push(config.pageTitle);
  }
  if (config.displayMode === 'url' || config.displayMode === 'both') {
    if (config.url) lines.push(truncateUrl(config.url));
  }
  if (lines.length === 0) return;

  // 短辺の6%をベースフォントサイズとし、fontScaleで調整
  const shortSide = Math.min(w, h);
  const baseFontSize = Math.max(Math.round(shortSide * 0.06), 20);
  const fontSize = Math.max(Math.round(baseFontSize * (config.fontScale ?? 1)), 12);
  ctx.font = `${fontSize}px sans-serif`;

  // テキストが許容幅を超える場合はフォントを縮小（fontScaleに応じて許容幅を拡大）
  let maxTextWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
  const scale = config.fontScale ?? 1;
  const maxAllowedWidth = w * Math.min(0.3 + 0.2 * scale, 0.9);
  let actualFontSize = fontSize;
  if (maxTextWidth > maxAllowedWidth) {
    actualFontSize = Math.max(Math.round(fontSize * (maxAllowedWidth / maxTextWidth)), 12);
    ctx.font = `${actualFontSize}px sans-serif`;
    maxTextWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
  }
  const lineHeight = actualFontSize * 1.4;
  const padding = actualFontSize * 0.6;

  const boxWidth = maxTextWidth + padding * 2;
  const boxHeight = lines.length * lineHeight + padding * 2;

  const margin = padding;
  let x: number, y: number;
  switch (config.position) {
    case 'bottom-left':
      x = margin;
      y = h - boxHeight - margin;
      break;
    case 'bottom-right':
      x = w - boxWidth - margin;
      y = h - boxHeight - margin;
      break;
    case 'top-left':
      x = margin;
      y = margin;
      break;
    case 'top-right':
      x = w - boxWidth - margin;
      y = margin;
      break;
  }

  ctx.fillStyle = config.bgColor;
  ctx.globalAlpha = config.bgOpacity;
  ctx.beginPath();
  ctx.roundRect(x, y, boxWidth, boxHeight, actualFontSize * 0.3);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  ctx.fillStyle = config.textColor;
  ctx.textBaseline = 'top';
  lines.forEach((line, i) => {
    ctx.fillText(line, x + padding, y + padding + i * lineHeight);
  });
}

export function renderAnnotatedImage(
  sourceImage: HTMLImageElement,
  config: AnnotationConfig
): HTMLCanvasElement {
  const canvas = prepareAnnotationCanvas(sourceImage);
  drawAnnotationOverlay(canvas.getContext('2d')!, canvas.width, canvas.height, config);
  return canvas;
}

/**
 * フラッドフィル方式で画像の外側の背景を削除する。
 * 画像の四隅から背景色を推定し、外枠の外側のみを透明にする。
 * イラスト内部の色はそのまま保持される。
 */
export function removeBackgroundByFloodFill(
  sourceImage: HTMLImageElement,
  tolerance: number = 30
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const w = sourceImage.naturalWidth;
  const h = sourceImage.naturalHeight;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(sourceImage, 0, 0);

  const imageData = ctx.getImageData(0, 0, w, h);
  const { data } = imageData;

  // 四隅のピクセルから背景色を推定
  const bg = sampleCornerColor(data, w, h);

  const visited = new Uint8Array(w * h);
  const queue: number[] = [];
  let head = 0;

  const enqueue = (x: number, y: number) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const i = y * w + x;
    if (visited[i]) return;
    visited[i] = 1;
    const p = i * 4;
    if (
      Math.abs(data[p] - bg[0]) <= tolerance &&
      Math.abs(data[p + 1] - bg[1]) <= tolerance &&
      Math.abs(data[p + 2] - bg[2]) <= tolerance
    ) {
      data[p + 3] = 0; // 透明にする
      queue.push(i);
    }
  };

  // 画像の全辺のピクセルからフラッドフィルを開始
  for (let x = 0; x < w; x++) {
    enqueue(x, 0);
    enqueue(x, h - 1);
  }
  for (let y = 1; y < h - 1; y++) {
    enqueue(0, y);
    enqueue(w - 1, y);
  }

  // BFS
  while (head < queue.length) {
    const i = queue[head++];
    const x = i % w;
    const y = (i - x) / w;
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function sampleCornerColor(data: Uint8ClampedArray, w: number, h: number): [number, number, number] {
  const corners = [
    0,
    (w - 1) * 4,
    (h - 1) * w * 4,
    ((h - 1) * w + w - 1) * 4,
  ];
  let r = 0, g = 0, b = 0;
  for (const idx of corners) {
    r += data[idx];
    g += data[idx + 1];
    b += data[idx + 2];
  }
  return [Math.round(r / 4), Math.round(g / 4), Math.round(b / 4)];
}

export function convertImageFormat(
  sourceImage: HTMLImageElement,
  format: ImageFormat,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = sourceImage.naturalWidth;
    canvas.height = sourceImage.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(sourceImage, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('変換に失敗しました'));
      },
      format,
      format === 'image/png' ? undefined : quality
    );
  });
}

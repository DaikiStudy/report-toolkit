import { useState, useEffect, useCallback, useMemo } from 'react';
import { useImageUpload } from '../../hooks/useImageUpload';
import { prepareAnnotationCanvas, renderAnnotationsOnCanvas, renderAnnotatedImage } from '../../utils/canvas';
import { downloadBlob } from '../../utils/download';
import { ImageDropZone } from '../common/ImageDropZone';
import { ToolPageWrapper } from '../common/ToolPageWrapper';
import type { AnnotationConfig } from '../../types';
import './ImageAnnotator.css';

const POSITIONS = [
  { value: 'bottom-right' as const, label: '右下' },
  { value: 'bottom-left' as const, label: '左下' },
  { value: 'top-right' as const, label: '右上' },
  { value: 'top-left' as const, label: '左上' },
];

const DISPLAY_MODES = [
  { value: 'title' as const, label: 'タイトルのみ' },
  { value: 'url' as const, label: 'URLのみ' },
  { value: 'both' as const, label: '両方' },
];

/**
 * クリップボードのHTMLから画像の出典情報を抽出する。
 */
function extractSourceFromHtml(html: string): { url: string; title: string } | null {
  const linkMatch = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>[\s\S]*?<img/i);
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  const altMatch = html.match(/<img[^>]+alt=["']([^"']+)["']/i);

  if (!imgMatch && !linkMatch) return null;

  const url = linkMatch?.[1] || imgMatch?.[1] || '';
  let title = altMatch?.[1] || '';

  if (!title && url) {
    try {
      const parsed = new URL(url);
      title = parsed.hostname;
    } catch {
      // invalid URL
    }
  }

  return { url, title };
}

export function ImageAnnotator() {
  const { imageUrl, imageElement, handleFile, reset } = useImageUpload();
  const [config, setConfig] = useState<AnnotationConfig>({
    pageTitle: '',
    url: '',
    position: 'bottom-right',
    displayMode: 'title',
    fontScale: 1.0,
    bgOpacity: 0.4,
    textColor: '#FFFFFF',
    bgColor: '#000000',
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [autoDetected, setAutoDetected] = useState(false);

  // 画像が変わった時だけアップスケール処理を実行（キャッシュ）
  const preparedCanvas = useMemo(() => {
    if (!imageElement) return null;
    return prepareAnnotationCanvas(imageElement);
  }, [imageElement]);

  useEffect(() => {
    if (!preparedCanvas) {
      setPreviewUrl(null);
      return;
    }
    // 表示モードに応じてテキストがあるか判定
    const hasText =
      ((config.displayMode === 'title' || config.displayMode === 'both') && config.pageTitle) ||
      ((config.displayMode === 'url' || config.displayMode === 'both') && config.url);
    if (!hasText) {
      setPreviewUrl(preparedCanvas.toDataURL('image/png'));
      return;
    }
    const timer = setTimeout(() => {
      const canvas = renderAnnotationsOnCanvas(preparedCanvas, config);
      setPreviewUrl(canvas.toDataURL('image/png'));
    }, 100);
    return () => clearTimeout(timer);
  }, [preparedCanvas, config]);

  const handleDownload = useCallback(() => {
    if (!imageElement) return;
    // ダウンロード時は元画像から高品質レンダリング
    const canvas = renderAnnotatedImage(imageElement, config);
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, 'annotated-image.png');
    }, 'image/png');
  }, [imageElement, config]);

  const handleReset = useCallback(() => {
    setPreviewUrl(null);
    setConfig(c => ({ ...c, pageTitle: '', url: '' }));
    setAutoDetected(false);
    reset();
  }, [reset]);

  const updateConfig = useCallback(<K extends keyof AnnotationConfig>(key: K, value: AnnotationConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handlePasteHtml = useCallback((html: string) => {
    const source = extractSourceFromHtml(html);
    if (source) {
      setConfig(prev => ({
        ...prev,
        url: source.url || prev.url,
        pageTitle: source.title || prev.pageTitle,
      }));
      setAutoDetected(true);
    }
  }, []);

  return (
    <ToolPageWrapper title="画像出典ツール" description="画像に出典情報をオーバーレイ。Webから画像をコピペすると出典を自動取得。ファイル選択時は手入力できます。" howToUse={['Webブラウザで画像を右クリック→コピーし、このページでCtrl+Vで貼り付けると出典が自動取得されます', 'ファイルから選択した場合は、ページタイトルやURLを手動で入力してください', '表示内容（タイトルのみ/URLのみ/両方）、文字サイズ、位置、色を自由に調整できます', '設定が反映されたプレビューを確認し、「ダウンロード」でPNG画像を保存します']}>
      {!imageUrl ? (
        <ImageDropZone onImageSelect={handleFile} onPasteHtml={handlePasteHtml} />
      ) : (
        <>
          <div className="annotator-preview">
            {previewUrl && (
              <img src={previewUrl} alt="プレビュー" className="annotator-preview-img" />
            )}
          </div>

          {autoDetected && (
            <div className="annotator-auto-notice">
              出典情報をクリップボードから自動取得しました。必要に応じて編集してください。
            </div>
          )}

          <div className="annotator-controls">
            <div className="annotator-field">
              <label className="annotator-label">ページタイトル</label>
              <input
                type="text"
                className="annotator-input"
                value={config.pageTitle}
                onChange={e => updateConfig('pageTitle', e.target.value)}
                placeholder="例: Wikipedia - 東京タワー"
              />
            </div>

            <div className="annotator-field">
              <label className="annotator-label">URL</label>
              <input
                type="text"
                className="annotator-input"
                value={config.url}
                onChange={e => updateConfig('url', e.target.value)}
                placeholder="例: https://ja.wikipedia.org/..."
              />
              <span className="annotator-hint">長いURLは画像上で自動的に短縮表示されます</span>
            </div>

            <div className="annotator-field">
              <label className="annotator-label">画像に表示する内容</label>
              <div className="annotator-mode-grid">
                {DISPLAY_MODES.map(mode => (
                  <button
                    key={mode.value}
                    className={`annotator-mode-btn ${config.displayMode === mode.value ? 'annotator-mode-btn--active' : ''}`}
                    onClick={() => updateConfig('displayMode', mode.value)}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="annotator-field">
              <label className="annotator-label">
                文字サイズ: {Math.round(config.fontScale * 100)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={config.fontScale}
                onChange={e => updateConfig('fontScale', Number(e.target.value))}
                className="annotator-slider"
              />
            </div>

            <div className="annotator-field">
              <label className="annotator-label">表示位置</label>
              <div className="annotator-position-grid">
                {POSITIONS.map(pos => (
                  <button
                    key={pos.value}
                    className={`annotator-position-btn ${config.position === pos.value ? 'annotator-position-btn--active' : ''}`}
                    onClick={() => updateConfig('position', pos.value)}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="annotator-field">
              <label className="annotator-label">
                背景の透明度: {Math.round(config.bgOpacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.bgOpacity}
                onChange={e => updateConfig('bgOpacity', Number(e.target.value))}
                className="annotator-slider"
              />
            </div>

            <div className="annotator-row">
              <div className="annotator-field annotator-field--half">
                <label className="annotator-label">文字色</label>
                <div className="annotator-color-picker">
                  <input
                    type="color"
                    value={config.textColor}
                    onChange={e => updateConfig('textColor', e.target.value)}
                  />
                  <span>{config.textColor}</span>
                </div>
              </div>

              <div className="annotator-field annotator-field--half">
                <label className="annotator-label">背景色</label>
                <div className="annotator-color-picker">
                  <input
                    type="color"
                    value={config.bgColor}
                    onChange={e => updateConfig('bgColor', e.target.value)}
                  />
                  <span>{config.bgColor}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="annotator-actions">
            <button className="annotator-btn annotator-btn--secondary" onClick={handleReset}>
              画像を変更
            </button>
            <button className="annotator-btn annotator-btn--primary" onClick={handleDownload}>
              ダウンロード
            </button>
          </div>
        </>
      )}
    </ToolPageWrapper>
  );
}

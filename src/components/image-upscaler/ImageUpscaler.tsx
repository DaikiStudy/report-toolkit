import { useState, useCallback } from 'react';
import { useImageUpload } from '../../hooks/useImageUpload';
import { upscaleImage } from '../../utils/canvas';
import { downloadBlob, formatFileSize } from '../../utils/download';
import { ImageDropZone } from '../common/ImageDropZone';
import { ToolPageWrapper } from '../common/ToolPageWrapper';
import './ImageUpscaler.css';

const SCALE_OPTIONS = [
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
  { value: 4, label: '4x' },
];

export function ImageUpscaler() {
  const { imageUrl, imageElement, handleFile, reset } = useImageUpload();
  const [scale, setScale] = useState(2);
  const [sharpen, setSharpen] = useState(true);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<{ w: number; h: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [resultBlobSize, setResultBlobSize] = useState<number | null>(null);

  const handleProcess = useCallback(() => {
    if (!imageElement) return;
    setIsProcessing(true);
    // requestAnimationFrame で UI をブロックしない
    requestAnimationFrame(() => {
      const canvas = upscaleImage(imageElement, scale, sharpen);
      setResultSize({ w: canvas.width, h: canvas.height });
      canvas.toBlob((blob) => {
        if (blob) {
          setResultUrl(URL.createObjectURL(blob));
          setResultBlobSize(blob.size);
        }
        setIsProcessing(false);
      }, 'image/png');
    });
  }, [imageElement, scale, sharpen]);

  const handleFileWithSize = useCallback((file: File) => {
    setOriginalSize(file.size);
    setResultUrl(null);
    setResultSize(null);
    setResultBlobSize(null);
    handleFile(file);
  }, [handleFile]);

  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    fetch(resultUrl)
      .then(r => r.blob())
      .then(blob => downloadBlob(blob, 'upscaled-image.png'));
  }, [resultUrl]);

  const handleReset = useCallback(() => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setResultSize(null);
    setResultBlobSize(null);
    setOriginalSize(null);
    reset();
  }, [reset, resultUrl]);

  return (
    <ToolPageWrapper title="画像高画質化" description="小さい・低画質な画像を拡大し、シャープ化で画質を向上させます。">
      {!imageUrl ? (
        <ImageDropZone onImageSelect={handleFileWithSize} />
      ) : (
        <>
          <div className="upscaler-preview">
            <div className="upscaler-compare">
              <div className="upscaler-compare-panel">
                <div className="upscaler-compare-label">元画像</div>
                <img src={imageUrl} alt="元画像" className="upscaler-compare-img" />
                {imageElement && (
                  <div className="upscaler-info">
                    {imageElement.naturalWidth} x {imageElement.naturalHeight}px
                    {originalSize && <> / {formatFileSize(originalSize)}</>}
                  </div>
                )}
              </div>
              {resultUrl && (
                <div className="upscaler-compare-panel">
                  <div className="upscaler-compare-label">高画質化後</div>
                  <img src={resultUrl} alt="高画質化後" className="upscaler-compare-img" />
                  {resultSize && (
                    <div className="upscaler-info">
                      {resultSize.w} x {resultSize.h}px
                      {resultBlobSize && <> / {formatFileSize(resultBlobSize)}</>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="upscaler-controls">
            <div className="upscaler-field">
              <label className="upscaler-label">拡大倍率</label>
              <div className="upscaler-scale-grid">
                {SCALE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`upscaler-scale-btn ${scale === opt.value ? 'upscaler-scale-btn--active' : ''}`}
                    onClick={() => { setScale(opt.value); setResultUrl(null); }}
                  >
                    {opt.label}
                    {imageElement && (
                      <span className="upscaler-scale-sub">
                        {Math.round(imageElement.naturalWidth * opt.value)} x {Math.round(imageElement.naturalHeight * opt.value)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="upscaler-field">
              <label className="upscaler-checkbox-label">
                <input
                  type="checkbox"
                  checked={sharpen}
                  onChange={e => { setSharpen(e.target.checked); setResultUrl(null); }}
                />
                シャープ化（ぼやけ軽減）
              </label>
            </div>
          </div>

          <div className="upscaler-actions">
            <button className="upscaler-btn upscaler-btn--secondary" onClick={handleReset}>
              画像を変更
            </button>
            <button
              className="upscaler-btn upscaler-btn--primary"
              onClick={handleProcess}
              disabled={isProcessing}
            >
              {isProcessing ? '処理中...' : '高画質化する'}
            </button>
            {resultUrl && (
              <button className="upscaler-btn upscaler-btn--success" onClick={handleDownload}>
                ダウンロード
              </button>
            )}
          </div>
        </>
      )}
    </ToolPageWrapper>
  );
}

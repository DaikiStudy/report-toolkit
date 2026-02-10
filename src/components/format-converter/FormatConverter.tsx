import { useState, useCallback } from 'react';
import { useImageUpload } from '../../hooks/useImageUpload';
import { convertImageFormat } from '../../utils/canvas';
import { downloadBlob, formatFileSize } from '../../utils/download';
import { ImageDropZone } from '../common/ImageDropZone';
import { ToolPageWrapper } from '../common/ToolPageWrapper';
import type { ImageFormat } from '../../types';
import './FormatConverter.css';

const FORMATS: { value: ImageFormat; label: string; ext: string }[] = [
  { value: 'image/png', label: 'PNG', ext: 'png' },
  { value: 'image/jpeg', label: 'JPEG', ext: 'jpg' },
  { value: 'image/webp', label: 'WebP', ext: 'webp' },
];

export function FormatConverter() {
  const { file, imageUrl, imageElement, handleFile, reset } = useImageUpload();
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('image/png');
  const [quality, setQuality] = useState(0.85);
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = useCallback(async () => {
    if (!imageElement) return;
    setIsConverting(true);
    setError(null);
    setResult(null);

    try {
      const blob = await convertImageFormat(imageElement, outputFormat, quality);
      const url = URL.createObjectURL(blob);
      setResult({ blob, url });
    } catch {
      setError('変換に失敗しました。別の画像をお試しください。');
    } finally {
      setIsConverting(false);
    }
  }, [imageElement, outputFormat, quality]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const fmt = FORMATS.find(f => f.value === outputFormat);
    const baseName = file?.name.replace(/\.[^.]+$/, '') || 'converted';
    downloadBlob(result.blob, `${baseName}.${fmt?.ext || 'png'}`);
  }, [result, outputFormat, file]);

  const handleReset = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    setError(null);
    reset();
  }, [reset, result]);

  return (
    <ToolPageWrapper title="画像形式変換" description="画像をPNG・JPEG・WebP形式に変換します" howToUse={['画像をドラッグ&ドロップするか、クリックしてファイルを選択します', '変換先の形式（PNG / JPEG / WebP）を選択します', 'JPEG・WebPの場合は品質スライダーで圧縮率を調整できます（低いほどファイルサイズが小さい）', '変換後のファイルサイズが表示されるので、元画像との比較ができます']}>
      {!imageUrl ? (
        <ImageDropZone onImageSelect={handleFile} />
      ) : (
        <>
          <div className="converter-source">
            <ImageDropZone currentImage={imageUrl} onImageSelect={handleFile} onClear={handleReset} />
            {file && (
              <div className="converter-source-info">
                <span>{file.name}</span>
                <span>{formatFileSize(file.size)}</span>
                {imageElement && (
                  <span>{imageElement.naturalWidth} x {imageElement.naturalHeight}px</span>
                )}
              </div>
            )}
          </div>

          <div className="converter-options">
            <div className="converter-format-group">
              <label className="converter-label">出力形式</label>
              <div className="converter-format-buttons">
                {FORMATS.map(fmt => (
                  <button
                    key={fmt.value}
                    className={`converter-format-btn ${outputFormat === fmt.value ? 'converter-format-btn--active' : ''}`}
                    onClick={() => { setOutputFormat(fmt.value); setResult(null); }}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {outputFormat !== 'image/png' && (
              <div className="converter-quality-group">
                <label className="converter-label">
                  品質: {Math.round(quality * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={quality}
                  onChange={e => { setQuality(Number(e.target.value)); setResult(null); }}
                  className="converter-quality-slider"
                />
              </div>
            )}
          </div>

          <div className="converter-actions">
            <button
              className="converter-btn converter-btn--primary"
              onClick={handleConvert}
              disabled={isConverting}
            >
              {isConverting ? '変換中...' : '変換する'}
            </button>
          </div>

          {error && <p className="converter-error">{error}</p>}

          {result && (
            <div className="converter-result">
              <div className="converter-result-info">
                <span>変換後サイズ: {formatFileSize(result.blob.size)}</span>
                {file && (
                  <span className={result.blob.size < file.size ? 'converter-result-smaller' : 'converter-result-larger'}>
                    {result.blob.size < file.size
                      ? `${Math.round((1 - result.blob.size / file.size) * 100)}% 削減`
                      : `${Math.round((result.blob.size / file.size - 1) * 100)}% 増加`
                    }
                  </span>
                )}
              </div>
              <button className="converter-btn converter-btn--success" onClick={handleDownload}>
                ダウンロード
              </button>
            </div>
          )}
        </>
      )}
    </ToolPageWrapper>
  );
}

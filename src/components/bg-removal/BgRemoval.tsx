import { useState, useCallback } from 'react';
import { useImageUpload } from '../../hooks/useImageUpload';
import { removeBackgroundByFloodFill } from '../../utils/canvas';
import { downloadBlob } from '../../utils/download';
import { ImageDropZone } from '../common/ImageDropZone';
import { ToolPageWrapper } from '../common/ToolPageWrapper';
import './BgRemoval.css';

export function BgRemoval() {
  const { file, imageUrl, imageElement, handleFile, reset } = useImageUpload();
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [tolerance, setTolerance] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'side' | 'result'>('side');

  const processImage = useCallback(() => {
    if (!imageElement) return;
    setError(null);
    setResultUrl(null);
    setResultBlob(null);

    try {
      const canvas = removeBackgroundByFloodFill(imageElement, tolerance);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setResultUrl(url);
          setResultBlob(blob);
        } else {
          setError('背景の削除に失敗しました。');
        }
      }, 'image/png');
    } catch {
      setError('背景の削除に失敗しました。別の画像をお試しください。');
    }
  }, [imageElement, tolerance]);

  const handleDownload = useCallback(() => {
    if (!resultBlob) return;
    const baseName = file?.name.replace(/\.[^.]+$/, '') || 'image';
    downloadBlob(resultBlob, `${baseName}-nobg.png`);
  }, [resultBlob, file]);

  const handleReset = useCallback(() => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setResultBlob(null);
    setError(null);
    reset();
  }, [reset, resultUrl]);

  return (
    <ToolPageWrapper title="背景削除" description="画像の外枠の外側の背景色を削除します。イラスト内部の色はそのまま保持されます。" howToUse={['画像をドラッグ&ドロップするか、クリックしてファイルを選択します', '画像の四隅の色を背景色として検出し、外側から透明にします', '許容値スライダーで背景除去の強さを調整できます（値が大きいほど広範囲を除去）', '結果を確認し、「ダウンロード」で透過PNG画像を保存します']}>
      {!imageUrl ? (
        <ImageDropZone onImageSelect={handleFile} />
      ) : (
        <>
          {!resultUrl && (
            <ImageDropZone currentImage={imageUrl} onImageSelect={handleFile} onClear={handleReset} />
          )}

          <div className="bgr-options">
            <div className="bgr-option">
              <label className="bgr-label">
                許容値（色の差）: {tolerance}
              </label>
              <input
                type="range"
                min="5"
                max="80"
                value={tolerance}
                onChange={e => { setTolerance(Number(e.target.value)); setResultUrl(null); setResultBlob(null); }}
                className="bgr-slider"
              />
              <p className="bgr-hint">
                値が大きいほど背景色に近い色もまとめて削除します。小さいほど厳密に一致する色のみ削除します。
              </p>
            </div>
          </div>

          {error && <p className="bgr-error">{error}</p>}

          {resultUrl && (
            <>
              <div className="bgr-view-toggle">
                <button
                  className={`bgr-view-btn ${viewMode === 'side' ? 'bgr-view-btn--active' : ''}`}
                  onClick={() => setViewMode('side')}
                >
                  比較表示
                </button>
                <button
                  className={`bgr-view-btn ${viewMode === 'result' ? 'bgr-view-btn--active' : ''}`}
                  onClick={() => setViewMode('result')}
                >
                  結果のみ
                </button>
              </div>

              <div className={`bgr-compare ${viewMode === 'side' ? 'bgr-compare--side' : ''}`}>
                {viewMode === 'side' && (
                  <div className="bgr-compare-panel">
                    <div className="bgr-compare-label">元画像</div>
                    <img src={imageUrl} alt="元画像" className="bgr-compare-img" />
                  </div>
                )}
                <div className="bgr-compare-panel">
                  {viewMode === 'side' && <div className="bgr-compare-label">背景削除後</div>}
                  <div className="bgr-result-bg">
                    <img src={resultUrl} alt="背景削除後" className="bgr-compare-img" />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="bgr-actions">
            <button className="bgr-btn bgr-btn--secondary" onClick={handleReset}>
              画像を変更
            </button>
            {!resultUrl && (
              <button className="bgr-btn bgr-btn--primary" onClick={processImage} disabled={!imageElement}>
                背景を削除
              </button>
            )}
            {resultUrl && (
              <>
                <button className="bgr-btn bgr-btn--primary" onClick={processImage}>
                  再実行
                </button>
                <button className="bgr-btn bgr-btn--success" onClick={handleDownload}>
                  ダウンロード (PNG)
                </button>
              </>
            )}
          </div>
        </>
      )}
    </ToolPageWrapper>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useClipboard } from '../../hooks/useClipboard';
import { downloadDataUrl } from '../../utils/download';
import { ToolPageWrapper } from '../common/ToolPageWrapper';
import './QrGenerator.css';

export function QrGenerator() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(400);
  const [darkColor, setDarkColor] = useState('#000000');
  const [lightColor, setLightColor] = useState('#FFFFFF');
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { copy, isCopied } = useClipboard();

  useEffect(() => {
    if (!text.trim()) {
      setQrUrl(null);
      setError(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const QRCode = await import('qrcode');
        const url = await QRCode.default.toDataURL(text, {
          width: size,
          margin: 2,
          color: { dark: darkColor, light: lightColor },
          errorCorrectionLevel: 'M',
        });
        setQrUrl(url);
        setError(null);
      } catch {
        setQrUrl(null);
        setError('QRコードの生成に失敗しました');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [text, size, darkColor, lightColor]);

  const handleDownload = useCallback(() => {
    if (!qrUrl) return;
    downloadDataUrl(qrUrl, 'qrcode.png');
  }, [qrUrl]);

  return (
    <ToolPageWrapper title="QRコード生成" description="URLやテキストからQRコードを作成します">
      <div className="qr-input-section">
        <div className="qr-field">
          <label className="qr-label">URL またはテキスト</label>
          <textarea
            className="qr-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="例: https://example.com"
            rows={3}
          />
        </div>

        <div className="qr-options">
          <div className="qr-field">
            <label className="qr-label">サイズ: {size}px</label>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={size}
              onChange={e => setSize(Number(e.target.value))}
              className="qr-slider"
            />
          </div>

          <div className="qr-colors">
            <div className="qr-field qr-field--half">
              <label className="qr-label">前景色</label>
              <div className="qr-color-picker">
                <input
                  type="color"
                  value={darkColor}
                  onChange={e => setDarkColor(e.target.value)}
                />
                <span>{darkColor}</span>
              </div>
            </div>
            <div className="qr-field qr-field--half">
              <label className="qr-label">背景色</label>
              <div className="qr-color-picker">
                <input
                  type="color"
                  value={lightColor}
                  onChange={e => setLightColor(e.target.value)}
                />
                <span>{lightColor}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="qr-error">{error}</p>}

      {qrUrl && (
        <div className="qr-result">
          <div className="qr-preview">
            <img src={qrUrl} alt="QRコード" className="qr-preview-img" />
          </div>
          <div className="qr-actions">
            <button className="qr-btn qr-btn--primary" onClick={handleDownload}>
              ダウンロード (PNG)
            </button>
            <button className="qr-btn qr-btn--secondary" onClick={() => copy(text)}>
              {isCopied ? 'コピーしました!' : 'テキストをコピー'}
            </button>
          </div>
        </div>
      )}
    </ToolPageWrapper>
  );
}

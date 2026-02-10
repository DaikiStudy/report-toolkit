import { useState, useCallback, useEffect } from 'react';
import { useClipboard } from '../../hooks/useClipboard';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { shortenUrl } from '../../services/urlShortener';
import { ToolPageWrapper } from '../common/ToolPageWrapper';
import { downloadDataUrl } from '../../utils/download';
import type { UrlHistoryEntry } from '../../types';
import './UrlShortener.css';

export function UrlShortener() {
  const [inputUrl, setInputUrl] = useState('');
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useLocalStorage<UrlHistoryEntry[]>('report-toolkit-url-history', []);
  const { copy, isCopied } = useClipboard();

  // 短縮URLが変わったらQRコードを自動生成
  useEffect(() => {
    if (!shortUrl) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const QRCode = await import('qrcode');
        const url = await QRCode.toDataURL(shortUrl, {
          width: 400,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        if (!cancelled) setQrDataUrl(null);
      }
    })();
    return () => { cancelled = true; };
  }, [shortUrl]);

  const handleShorten = useCallback(async () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) return;

    try {
      new URL(trimmed);
    } catch {
      setError('有効なURLを入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);
    setShortUrl(null);

    try {
      const result = await shortenUrl(trimmed);
      setShortUrl(result);
      setHistory(prev => [{
        id: `url_${Date.now()}`,
        longUrl: trimmed,
        shortUrl: result,
        createdAt: new Date().toISOString(),
      }, ...prev].slice(0, 50));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [inputUrl, setHistory]);

  const handleDeleteHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(entry => entry.id !== id));
  }, [setHistory]);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  return (
    <ToolPageWrapper title="URL短縮 & QRコード" description="URLを短縮し、QRコードを同時に生成します" howToUse={['短縮したいURLを入力欄に貼り付けます', '「短縮 & QR生成」ボタンを押すと、短縮URLとQRコードが同時に生成されます', '短縮URLの横のコピーボタンでクリップボードにコピーできます', 'QRコードはPNG画像としてダウンロードできます。履歴は自動保存されます']}>
      <div className="url-input-section">
        <div className="url-input-row">
          <input
            type="url"
            className="url-input"
            value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            placeholder="https://example.com/very/long/url..."
            onKeyDown={e => { if (e.key === 'Enter') handleShorten(); }}
          />
          <button
            className="url-btn url-btn--primary"
            onClick={handleShorten}
            disabled={isLoading || !inputUrl.trim()}
          >
            {isLoading ? '処理中...' : '短縮 & QR生成'}
          </button>
        </div>
        {error && <p className="url-error">{error}</p>}
      </div>

      {shortUrl && (
        <div className="url-result">
          <div className="url-result-main">
            <div>
              <div className="url-result-label">短縮URL:</div>
              <div className="url-result-row">
                <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="url-result-link">
                  {shortUrl}
                </a>
                <button className="url-btn url-btn--copy" onClick={() => copy(shortUrl)}>
                  {isCopied ? 'コピー済み!' : 'コピー'}
                </button>
              </div>
            </div>
            {qrDataUrl && (
              <div className="url-result-qr-section">
                <div className="url-result-label">QRコード:</div>
                <img src={qrDataUrl} alt="QRコード" className="url-result-qr-img" />
                <button
                  className="url-btn url-btn--small"
                  onClick={() => downloadDataUrl(qrDataUrl, 'qrcode.png')}
                >
                  QRダウンロード
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="url-history">
          <div className="url-history-header">
            <h3 className="url-history-title">履歴 ({history.length}件)</h3>
            <button className="url-btn url-btn--text" onClick={handleClearHistory}>
              すべて削除
            </button>
          </div>
          <div className="url-history-list">
            {history.map(entry => (
              <div key={entry.id} className="url-history-item">
                <div className="url-history-item-content">
                  <a
                    href={entry.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="url-history-short"
                  >
                    {entry.shortUrl}
                  </a>
                  <span className="url-history-long" title={entry.longUrl}>
                    {entry.longUrl}
                  </span>
                  <span className="url-history-date">
                    {new Date(entry.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <div className="url-history-item-actions">
                  <button
                    className="url-btn url-btn--small"
                    onClick={() => copy(entry.shortUrl)}
                  >
                    コピー
                  </button>
                  <button
                    className="url-btn url-btn--small url-btn--danger"
                    onClick={() => handleDeleteHistory(entry.id)}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolPageWrapper>
  );
}

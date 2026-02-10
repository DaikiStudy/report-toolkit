import { useCallback, useEffect, useRef, type DragEvent } from 'react';
import './ImageDropZone.css';

interface ImageDropZoneProps {
  onImageSelect: (file: File) => void;
  onPasteHtml?: (html: string) => void;
  accept?: string;
  currentImage?: string | null;
  onClear?: () => void;
}

export function ImageDropZone({ onImageSelect, onPasteHtml, accept = 'image/*', currentImage, onClear }: ImageDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // グローバル Ctrl+V リスナー
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      let html: string | undefined;
      if (onPasteHtml) {
        html = e.clipboardData?.getData('text/html') || undefined;
      }

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            onImageSelect(file);
            if (html && onPasteHtml) {
              onPasteHtml(html);
            }
            break;
          }
        }
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, [onImageSelect, onPasteHtml]);

  // 「貼り付け」ボタン: Clipboard API でクリック1つで貼り付け
  const handlePasteButton = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find(t => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], 'clipboard-image.png', { type: imageType });
          onImageSelect(file);

          if (onPasteHtml) {
            try {
              const htmlType = item.types.find(t => t === 'text/html');
              if (htmlType) {
                const htmlBlob = await item.getType(htmlType);
                const html = await htmlBlob.text();
                onPasteHtml(html);
              }
            } catch { /* HTML取得失敗 */ }
          }
          break;
        }
      }
    } catch {
      // Clipboard API 非対応またはアクセス拒否
    }
  }, [onImageSelect, onPasteHtml]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
    }
  }, [onImageSelect]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
    if (inputRef.current) inputRef.current.value = '';
  }, [onImageSelect]);

  if (currentImage) {
    return (
      <div className="dropzone-preview">
        <img src={currentImage} alt="アップロード画像" className="dropzone-preview-img" />
        {onClear && (
          <button className="dropzone-preview-change" onClick={onClear}>
            画像を変更
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="dropzone-container">
      <div
        className="dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="dropzone-input"
        />
        <div className="dropzone-content">
          <span className="dropzone-icon">📁</span>
          <p className="dropzone-text">画像をドラッグ&ドロップ、またはクリックして選択</p>
        </div>
      </div>
      <button className="dropzone-paste-btn" onClick={handlePasteButton} type="button">
        📋 クリップボードから貼り付け
      </button>
      <p className="dropzone-hint">Ctrl+V でも貼り付けできます</p>
    </div>
  );
}

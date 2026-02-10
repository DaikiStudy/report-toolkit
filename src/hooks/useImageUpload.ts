import { useState, useCallback, useEffect } from 'react';

export function useImageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setImageUrl(url);

    const img = new Image();
    img.onload = () => setImageElement(img);
    img.src = url;
  }, []);

  const reset = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setFile(null);
    setImageUrl(null);
    setImageElement(null);
  }, [imageUrl]);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  return { file, imageUrl, imageElement, handleFile, reset };
}

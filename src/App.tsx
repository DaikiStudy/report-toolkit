import { useState, useEffect } from 'react';
import type { ToolId } from './types';
import { Layout } from './components/common/Layout';
import { ImageAnnotator } from './components/image-annotator/ImageAnnotator';
import { BgRemoval } from './components/bg-removal/BgRemoval';
import { FormatConverter } from './components/format-converter/FormatConverter';
import { ImageUpscaler } from './components/image-upscaler/ImageUpscaler';
import { UrlShortener } from './components/url-shortener/UrlShortener';
import './App.css';

const TOOL_TITLES: Record<ToolId, string> = {
  'annotator': '画像出典追加ツール',
  'bg-removal': '背景削除ツール',
  'converter': '画像形式変換ツール',
  'upscaler': '画像高画質化ツール',
  'url-qr': 'URL短縮・QRコード生成ツール',
};

function App() {
  const [activeTool, setActiveTool] = useState<ToolId>('annotator');

  useEffect(() => {
    document.title = `${TOOL_TITLES[activeTool]} | レポートツールキット`;
  }, [activeTool]);

  const renderTool = () => {
    switch (activeTool) {
      case 'annotator':
        return <ImageAnnotator />;
      case 'bg-removal':
        return <BgRemoval />;
      case 'converter':
        return <FormatConverter />;
      case 'upscaler':
        return <ImageUpscaler />;
      case 'url-qr':
        return <UrlShortener />;
    }
  };

  return (
    <Layout activeTool={activeTool} onToolChange={setActiveTool}>
      {renderTool()}
    </Layout>
  );
}

export default App;

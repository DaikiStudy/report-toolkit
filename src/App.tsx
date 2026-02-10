import { useState } from 'react';
import type { ToolId } from './types';
import { Layout } from './components/common/Layout';
import { ImageAnnotator } from './components/image-annotator/ImageAnnotator';
import { BgRemoval } from './components/bg-removal/BgRemoval';
import { FormatConverter } from './components/format-converter/FormatConverter';
import { ImageUpscaler } from './components/image-upscaler/ImageUpscaler';
import { UrlShortener } from './components/url-shortener/UrlShortener';
import './App.css';

function App() {
  const [activeTool, setActiveTool] = useState<ToolId>('annotator');

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

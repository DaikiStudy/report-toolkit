import { useState } from 'react';
import { AdBanner } from './AdBanner';
import './ToolPageWrapper.css';

interface ToolPageWrapperProps {
  title: string;
  description: string;
  howToUse?: string[];
  children: React.ReactNode;
}

export function ToolPageWrapper({ title, description, howToUse, children }: ToolPageWrapperProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="tool-page">
      <div className="tool-page-header">
        <h2 className="tool-page-title">{title}</h2>
        <p className="tool-page-desc">{description}</p>
        {howToUse && howToUse.length > 0 && (
          <button
            className="tool-page-help-toggle"
            onClick={() => setHelpOpen(prev => !prev)}
          >
            {helpOpen ? '使い方を閉じる' : '使い方を見る'}
          </button>
        )}
      </div>
      {helpOpen && howToUse && (
        <div className="tool-page-help">
          <ol className="tool-page-help-list">
            {howToUse.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}
      <AdBanner slot="topBanner" />
      <div className="tool-page-content">
        {children}
      </div>
      <AdBanner slot="bottomBanner" format="rectangle" />
    </div>
  );
}

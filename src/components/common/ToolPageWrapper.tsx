import { AdBanner } from './AdBanner';
import './ToolPageWrapper.css';

interface ToolPageWrapperProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function ToolPageWrapper({ title, description, children }: ToolPageWrapperProps) {
  return (
    <div className="tool-page">
      <div className="tool-page-header">
        <h2 className="tool-page-title">{title}</h2>
        <p className="tool-page-desc">{description}</p>
      </div>
      <AdBanner slot="topBanner" />
      <div className="tool-page-content">
        {children}
      </div>
      <AdBanner slot="bottomBanner" />
    </div>
  );
}

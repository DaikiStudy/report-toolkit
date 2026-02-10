import { useState } from 'react';
import type { ToolId } from '../../types';
import { Sidebar } from './Sidebar';
import { AdBanner } from './AdBanner';
import './Layout.css';

interface LayoutProps {
  activeTool: ToolId;
  onToolChange: (tool: ToolId) => void;
  children: React.ReactNode;
}

export function Layout({ activeTool, onToolChange, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToolChange = (tool: ToolId) => {
    onToolChange(tool);
    setSidebarOpen(false);
  };

  return (
    <div className="layout">
      <Sidebar
        activeTool={activeTool}
        onToolChange={handleToolChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="layout-main">
        <header className="mobile-header">
          <button className="mobile-header-menu" onClick={() => setSidebarOpen(true)}>
            &#9776;
          </button>
          <h1 className="mobile-header-title">レポートツールキット</h1>
        </header>
        <div className="mobile-ad">
          <AdBanner slot="mobileBanner" />
        </div>
        <main className="layout-content">
          {children}
        </main>
      </div>
    </div>
  );
}

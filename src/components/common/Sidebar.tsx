import type { ToolId, ToolInfo } from '../../types';
import { AdBanner } from './AdBanner';
import './Sidebar.css';

const TOOLS: ToolInfo[] = [
  { id: 'annotator', label: '画像出典ツール', icon: '🏷️', description: '画像に出典情報を追加' },
  { id: 'bg-removal', label: '背景削除', icon: '✂️', description: '画像の背景を削除' },
  { id: 'converter', label: '画像形式変換', icon: '🔄', description: 'PNG/JPEG/WebPの変換' },
  { id: 'upscaler', label: '画像高画質化', icon: '🔍', description: '画像を拡大・高画質化' },
  { id: 'url-qr', label: 'URL短縮 & QR', icon: '🔗', description: 'URL短縮+QRコード生成' },
];

interface SidebarProps {
  activeTool: ToolId;
  onToolChange: (tool: ToolId) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ activeTool, onToolChange, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">レポートツールキット</h1>
          <p className="sidebar-subtitle">無料レポート作成ツール集</p>
        </div>
        <nav className="sidebar-nav">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              className={`sidebar-nav-item ${activeTool === tool.id ? 'sidebar-nav-item--active' : ''}`}
              onClick={() => onToolChange(tool.id)}
            >
              <span className="sidebar-nav-icon">{tool.icon}</span>
              <div className="sidebar-nav-text">
                <span className="sidebar-nav-label">{tool.label}</span>
                <span className="sidebar-nav-desc">{tool.description}</span>
              </div>
            </button>
          ))}
        </nav>
        <div className="sidebar-ad">
          <AdBanner slot="sidebar" format="vertical" />
        </div>
        <div className="sidebar-footer">
          <p>&copy; 2026 レポートツールキット</p>
        </div>
      </aside>
    </>
  );
}

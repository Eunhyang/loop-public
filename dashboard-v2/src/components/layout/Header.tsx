import { NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUi } from '@/contexts/UiContext';
interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Header = ({ onToggleSidebar, isSidebarOpen }: HeaderProps) => {
  // Notion-style top tabs: Minimal text with bottom border for active state
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-1 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${isActive
      ? 'border-primary text-text-main'
      : 'border-transparent text-text-muted hover:text-text-main hover:border-zinc-200'
    }`;

  return (
    <header className="h-14 border-b border-border bg-white flex items-center justify-between px-4 shrink-0 z-10 transition-all">
      <div className="flex items-center gap-4 h-full">
        {/* Sidebar Toggle Button */}
        {!isSidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-zinc-500 hover:bg-zinc-100 rounded-md transition-colors"
            title="Open Sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}

        {/* Only show title in header if Sidebar is closed, or always? Notion matches title position. */}
        {/* Let's keep it simple: always show Title + Nav */}
        <div className="flex items-center gap-6 h-full">
          <h2 className="text-base font-semibold text-text-main tracking-tight cursor-default">LOOP Dashboard</h2>
          <nav className="flex items-center gap-6 h-full">
            );
};

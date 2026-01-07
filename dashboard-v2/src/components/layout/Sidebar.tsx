import { Link } from 'react-router-dom';

export const Sidebar = () => {
  return (
    <aside className="w-64 glass-moderate p-4 flex flex-col">
      <h1 className="text-xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
        Dashboard v2
      </h1>
      <nav className="space-y-2 flex-1">
        <Link to="/kanban" className="block px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white">
          Kanban
        </Link>
        <Link to="/pending" className="block px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white">
          Pending Review
        </Link>
        <Link to="/calendar" className="block px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white">
          Calendar
        </Link>
        <Link to="/graph" className="block px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white">
          Graph
        </Link>
        <Link to="/program" className="block px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white">
          Program
        </Link>
      </nav>

      <div className="text-xs text-gray-500 mt-auto pt-4 border-t border-glass-border">
        LOOP Vault System
      </div>
    </aside>
  );
};

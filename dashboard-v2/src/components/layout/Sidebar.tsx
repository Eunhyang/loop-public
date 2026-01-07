import { Link } from 'react-router-dom';

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-gray-900 text-white p-4">
      <h1 className="text-xl font-bold mb-6">Dashboard v2</h1>
      <nav className="space-y-2">
        <Link to="/kanban" className="block p-2 hover:bg-gray-800 rounded">
          Kanban
        </Link>
        <Link to="/pending" className="block p-2 hover:bg-gray-800 rounded">
          Pending Review
        </Link>
        <Link to="/calendar" className="block p-2 hover:bg-gray-800 rounded">
          Calendar
        </Link>
        <Link to="/graph" className="block p-2 hover:bg-gray-800 rounded">
          Graph
        </Link>
        <Link to="/program" className="block p-2 hover:bg-gray-800 rounded">
          Program
        </Link>
      </nav>
    </aside>
  );
};

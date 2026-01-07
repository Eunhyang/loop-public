export const Header = () => {
  return (
    <header className="bg-black/20 border-b border-white/10 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-100">LOOP Dashboard</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">User</span>
        </div>
      </div>
    </header>
  );
};

export const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">LOOP Dashboard</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">User</span>
        </div>
      </div>
    </header>
  );
};

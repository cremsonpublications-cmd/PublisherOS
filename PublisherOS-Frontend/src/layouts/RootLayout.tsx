import { Outlet } from 'react-router-dom';

export function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center">
          <span className="font-semibold text-gray-900 tracking-tight">
            Publisher<span className="text-blue-600">OS</span>
          </span>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

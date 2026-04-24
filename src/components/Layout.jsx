import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Layout() {
  const { logout, userRole } = useAuth();

  const roleName = {
    'admin': '園長',
    'teacher': '教師',
    'parent': '家長'
  }[userRole] || '';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col w-full max-w-md mx-auto shadow-2xl relative">
      {/* Top Navbar */}
      <header className="bg-indigo-600 text-white p-3 sticky top-0 z-10 flex justify-between items-center shadow-md">
        <h1 className="text-lg font-bold tracking-wider">幼兒園聯絡簿</h1>
        <div className="flex items-center gap-2">
          {userRole && <span className="text-sm bg-indigo-800 px-2 py-1 rounded-full">{roleName}</span>}
          <button 
            onClick={logout}
            className="text-sm border border-white px-3 py-1 rounded-lg hover:bg-white hover:text-indigo-600 transition"
          >
            登出
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-3 overflow-y-auto pb-16">
        <Outlet />
      </main>

      {/* Bottom Navigation Drawer (Mobile App Style) */}
      <footer className="bg-white border-t border-gray-200 fixed bottom-0 w-full max-w-md flex justify-around p-3 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col items-center text-indigo-600 cursor-pointer">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs font-medium mt-1">聯絡簿</span>
        </div>
        <div className="flex flex-col items-center text-gray-400 cursor-not-allowed">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs font-medium mt-1">設定</span>
        </div>
      </footer>
    </div>
  );
}

export default Layout;

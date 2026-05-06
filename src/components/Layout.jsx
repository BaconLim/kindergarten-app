import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Layout() {
  const { logout, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const roleName = { 'admin': '園長', 'teacher': '教師', 'parent': '家長' }[userRole] || '';
  const isProfile = location.pathname === '/profile';
  const isTemplate = location.pathname === '/template';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col w-full max-w-md mx-auto shadow-2xl relative pb-16">
      <header className="bg-indigo-600 text-white p-3 sticky top-0 z-10 flex justify-between items-center shadow-md">
        <h1 className="text-lg font-bold">幼兒園聯絡簿</h1>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-indigo-800 px-2 py-1 rounded-full">{roleName}</span>
          <button onClick={logout} className="text-xs border border-white px-2 py-1 rounded hover:bg-white hover:text-indigo-600 transition">登出</button>
        </div>
      </header>

      <main className="flex-1 p-3 overflow-y-auto">
        <Outlet />
      </main>

      <footer className="bg-white border-t fixed bottom-0 w-full max-w-md flex justify-around p-3 shadow-lg z-20">
        <div onClick={() => navigate(`/${userRole}`)} className={`flex flex-col items-center cursor-pointer ${(!isProfile && !isTemplate) ? 'text-indigo-600' : 'text-gray-400'}`}>
          <span className="text-xs font-bold">聯絡簿</span>
        </div>
        {userRole !== 'admin' && (
          <div onClick={() => navigate('/profile')} className={`flex flex-col items-center cursor-pointer ${isProfile ? 'text-indigo-600' : 'text-gray-400'}`}>
            <span className="text-xs font-bold">基本資料</span>
          </div>
        )}
        {userRole === 'admin' && (
          <div onClick={() => navigate('/template')} className={`flex flex-col items-center cursor-pointer ${isTemplate ? 'text-indigo-600' : 'text-gray-400'}`}>
            <span className="text-xs font-bold">公版內容</span>
          </div>
        )}
      </footer>
    </div>
  );
}

export default Layout;

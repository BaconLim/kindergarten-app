import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const success = await login(username, password);
    if (!success) {
      setError('登入失敗，請檢查帳號與密碼');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 w-full max-w-sm mx-auto shadow-2xl">
      <div className="mb-6 text-center">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
        </div>
        <h1 className="text-xl font-bold text-gray-800">幼兒園電子聯絡簿</h1>
        <p className="text-gray-500 text-sm mt-1">守護幼兒的每一天</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col w-full max-w-sm mx-auto">
        <h2 className="text-xl font-bold text-gray-700 mb-6 text-center">帳號登入</h2>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-4 border border-red-100 text-center w-full">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-5 w-full">
          <div className="flex flex-col w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">使用者帳號</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none bg-gray-50 focus:bg-white mb-2"
              placeholder="teacher_01"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="flex flex-col w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">密碼</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none bg-gray-50 focus:bg-white mb-2"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div className="w-full pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm ${loading ? 'opacity-70' : ''}`}
            >
              {loading ? '登入中...' : '登入系統'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;

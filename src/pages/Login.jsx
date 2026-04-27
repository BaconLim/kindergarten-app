import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const success = await login(username, password);
    if (!success) setError('帳號或密碼錯誤');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-indigo-600">歡迎回來</h2>
          <p className="text-gray-500 mt-2">請登入您的幼兒園帳戶</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full p-3 border rounded-xl" placeholder="使用者帳號" value={username} onChange={e => setUsername(e.target.value)} required />
          <input className="w-full p-3 border rounded-xl" type="password" placeholder="密碼" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
          <button disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition">
            {loading ? '登入中...' : '登入'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;

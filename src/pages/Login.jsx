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
    
    try {
      // 嘗試登入
      const result = await login(username, password);
      if (result === true) {
        // 成功會自動跳轉
      } else {
        // 如果回傳 false，顯示預設錯誤
        setError('登入失敗：請檢查帳號密碼，或確認後端 GAS 已部署且權限設為「任何人」。');
      }
    } catch (err) {
      // 如果連線失敗，顯示詳細技術訊息
      setError('連線錯誤：' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-indigo-600">幼兒園聯絡簿</h2>
          <p className="text-gray-500 mt-2">歡迎回來，請登入您的帳號</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full p-3 border rounded-xl" placeholder="使用者帳號" value={username} onChange={e => setUsername(e.target.value)} required />
          <input className="w-full p-3 border rounded-xl" type="password" placeholder="密碼" value={password} onChange={e => setPassword(e.target.value)} required />
          
          {error && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-red-600 text-sm text-center whitespace-pre-wrap">{error}</p>
            </div>
          )}

          <button disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition">
            {loading ? '登入中...' : '登入'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;

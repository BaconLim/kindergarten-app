import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

// Create an Axios instance to attach the token automatically
// 對接 Google Apps Script 必須用 text/plain 避免 CORS 預檢
export const api = axios.create({
  baseURL: import.meta.env.VITE_GAS_URL || '',
  headers: {
    'Content-Type': 'text/plain;charset=utf-8',
  }
});

// 為了讓 GAS 能解析，我們不使用 Header 傳 Token，
// 而是藉由攔截器，確保每個 request body 都有 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  if (config.data) {
    if (typeof config.data === 'string') {
      try {
        const parsedData = JSON.parse(config.data);
        if (token) parsedData.token = token;
        config.data = JSON.stringify(parsedData);
      } catch (e) {
        // Not a JSON string
      }
    } else if (typeof config.data === 'object') {
       if (token) config.data.token = token;
       // GAS 只吃 stringified JSON 夾帶在 e.postData.contents 內
       config.data = JSON.stringify(config.data);
    }
  }
  return config;
});

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('user_role'));
  const navigate = useNavigate();

  const login = async (username, password) => {
    try {
      const payload = {
        action: 'login',
        payload: { username, password }
      };

      const response = await api.post('', payload);
      
      // GAS 回傳的格式通常是 { status: "success", data: { access_token, token_type } }
      if (response.data.status !== "success") {
         throw new Error(response.data.message || "Login Failed");
      }

      const access_token = response.data.data.access_token;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      // 解析我們在 GAS 簽發的簡易 Token (Base64) 並支援 UTF-8 (以防中文班級亂碼)
      let b64Str = access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonStr = decodeURIComponent(escape(atob(b64Str)));
      const jwtPayload = JSON.parse(jsonStr);
      const role = jwtPayload.role || "parent";
      
      localStorage.setItem('user_role', role);
      setUserRole(role);
      navigate(`/${role}`);
      
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    setToken(null);
    setUserRole(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ token, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

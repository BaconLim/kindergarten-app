import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const api = axios.create({
  baseURL: import.meta.env.VITE_GAS_URL || 'https://script.google.com/macros/s/AKfycbzB7tYYmY1VVKPeb8N8GTfjL3gvaak6dBfaYzwPCBgnIuZuWr8TAVcDY-vWjZqcqGgwuA/exec',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (config.data) {
    const parsedData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    if (token) parsedData.token = token;
    config.data = JSON.stringify(parsedData);
  }
  return config;
});

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('user_role'));
  const navigate = useNavigate();

  const login = async (username, password) => {
    try {
      const res = await api.post('', { action: 'login', payload: { username, password } });
      if (res.data.status !== "success") throw new Error(res.data.message);
      const access_token = res.data.data.access_token;
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      const b64Str = access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const jwtPayload = JSON.parse(decodeURIComponent(escape(atob(b64Str))));
      const role = jwtPayload.role || "parent";
      
      localStorage.setItem('user_role', role);
      setUserRole(role);
      navigate(`/${role}`);
      return true;
    } catch (error) { return false; }
  };

  const logout = () => {
    localStorage.clear();
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

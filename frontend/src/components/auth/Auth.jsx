import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Login from './Login';
import Register from './Register';

export default function Auth() {
  const { token } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);

  if (token) {
    return null; // Chat component will be rendered instead
  }

  return isLoginMode ? (
    <Login onSwitchToRegister={() => setIsLoginMode(false)} />
  ) : (
    <Register onSwitchToLogin={() => setIsLoginMode(true)} />
  );
}

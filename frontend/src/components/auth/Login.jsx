import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login({ onSwitchToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, setError } = useAuth();

  // Load saved credentials if available
  useEffect(() => {
    const savedUsername = localStorage.getItem('savedUsername');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    if (savedUsername && savedRememberMe) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    if (!username.trim()) {
      setLocalError('Username is required');
      return false;
    }
    if (!password.trim()) {
      setLocalError('Password is required');
      return false;
    }
    if (username.trim().length < 3) {
      setLocalError('Username must be at least 3 characters');
      return false;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      await login(username.trim(), password, rememberMe);
      
      if (rememberMe) {
        localStorage.setItem('savedUsername', username.trim());
      } else {
        localStorage.removeItem('savedUsername');
      }
    } catch {
      // Error already set by login function
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SyncRoom</h1>
            <p className="text-gray-600">Welcome back! Please log in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setLocalError('');
                  }}
                  placeholder="Enter your username"
                  disabled={isLoading}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pl-10 text-gray-900 placeholder:text-gray-400 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none disabled:opacity-50"
                  aria-label="Username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLocalError('');
                  }}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pl-10 pr-10 text-gray-900 placeholder:text-gray-400 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none disabled:opacity-50"
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Remember me
              </label>
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <div className="flex-shrink-0 text-red-600 mt-0.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-red-700">{displayError}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Logging in...</span>
                </span>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-blue-600 font-semibold hover:text-blue-700 transition"
              >
                Register here
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-4">
          © 2024 SyncRoom. All rights reserved.
        </p>
      </div>
    </div>
  );
}

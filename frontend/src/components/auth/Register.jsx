import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Eye, EyeOff, User, CheckCircle } from 'lucide-react';

export default function Register({ onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { register, error, setError } = useAuth();

  const validateForm = () => {
    if (!username.trim()) {
      setLocalError('Username is required');
      return false;
    }
    if (username.trim().length < 3) {
      setLocalError('Username must be at least 3 characters');
      return false;
    }
    if (!password.trim()) {
      setLocalError('Password is required');
      return false;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return false;
    }
    if (!confirmPassword.trim()) {
      setLocalError('Please confirm your password');
      return false;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setError(null);
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      await register(username.trim(), password, confirmPassword);
      setSuccessMessage('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        onSwitchToLogin();
      }, 1500);
    } catch {
      // Error already set by register function
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || error;
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordsVisible = password && confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Join SyncRoom and start messaging</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setLocalError('');
                  }}
                  placeholder="Choose a username"
                  disabled={isLoading}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pl-10 text-gray-900 placeholder:text-gray-400 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none disabled:opacity-50"
                  aria-label="Username"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">3 characters minimum</p>
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
                  placeholder="Minimum 8 characters"
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
              <p className="text-xs text-gray-500 mt-1">8 characters minimum</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setLocalError('');
                  }}
                  placeholder="Re-enter your password"
                  disabled={isLoading}
                  className={`w-full rounded-lg border px-4 py-3 pl-10 pr-10 text-gray-900 placeholder:text-gray-400 shadow-sm transition outline-none disabled:opacity-50 bg-white focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50 ${
                    passwordsVisible && !passwordsMatch
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                  aria-label="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordsVisible && passwordsMatch && (
                <div className="flex items-center space-x-1 mt-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">Passwords match</span>
                </div>
              )}
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

            {/* Success Message */}
            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
                <div className="flex-shrink-0 text-green-600 mt-0.5">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <p className="text-sm text-green-700">{successMessage}</p>
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
                  <span>Creating account...</span>
                </span>
              ) : (
                'Register'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 font-semibold hover:text-blue-700 transition"
              >
                Login here
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

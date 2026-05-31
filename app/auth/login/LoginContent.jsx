'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import SuccessModal from '../../components/SuccessModal';
import OAuthModal from '../../components/OAuthModal';
import {
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);

  useEffect(() => {
    if (searchParams.get('signup') === 'success') {
      setShowSuccessModal(true);
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use our custom login endpoint instead of NextAuth provider
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
        credentials: 'include', // Ensure cookies are sent
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Invalid email or password');
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      if (!data.success) {
        setError('Login failed');
        setLoading(false);
        return;
      }

      console.log('✅ [FRONTEND] Login successful for:', data.user.email);
      console.log('✅ [FRONTEND] User role:', data.user.role);

      // Store user data locally
      localStorage.setItem('authUser', JSON.stringify(data.user));

      // Determine redirect URL based on role
      const redirectUrl = 
        data.user?.role === 'admin' 
          ? '/admin-dashboard'
          : data.user?.role === 'teacher' 
          ? '/teacher-dashboard'
          : '/dashboard';

      console.log('🔄 [FRONTEND] Redirecting to:', redirectUrl);
      console.log('🔄 [FRONTEND] Session cookie should be set as next-auth.session-token');

      // Use replace instead of push to prevent back button issues
      router.replace(redirectUrl);
      
      // Backup: use window.location as fallback if router doesn't work after 1 second
      setTimeout(() => {
        console.warn('⚠️ [FRONTEND] Router.replace() did not navigate within 1 second, using window.location');
        window.location.href = redirectUrl;
      }, 1000);
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-600 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-slate-400">Sign in to your typing account</p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl p-8 backdrop-blur-sm animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-gray-900 dark:text-slate-200 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-slate-500" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-gray-900 dark:text-slate-200 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-slate-500" />
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-400 text-sm animate-fade-in">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-medium text-slate-900 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/20 mt-6"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800 text-slate-400">Or continue with</span>
            </div>
          </div>

          {/* OAuth Button */}
          <button
            type="button"
            onClick={() => setShowOAuthModal(true)}
            className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-emerald-500/20"
          >
            <SparklesIcon className="w-5 h-5" />
            Social Login
          </button>

          {/* Footer */}
          <p className="text-center text-gray-600 dark:text-slate-400 text-sm mt-8">
            Don't have an account?{' '}
            <Link
              href="/auth/signup"
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Account Created!"
        message="Your account has been successfully created. You can now sign in."
      />

      {/* OAuth Modal */}
      <OAuthModal
        isOpen={showOAuthModal}
        onClose={() => setShowOAuthModal(false)}
      />
    </div>
  );
}

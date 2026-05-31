'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import OAuthModal from '../../components/OAuthModal';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserPlusIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: 'male',
    classId: 'ey-jupiter',
  });
  const [error, setError] = useState('');
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const classes = [
    { id: 'ey-jupiter', name: 'EY Jupiter' },
    { id: 'ey-venus', name: 'EY Venus' },
    { id: 'ey-mercury', name: 'EY Mercury' },
    { id: 'ey-neptune', name: 'EY Neptune' },
  ];
  const [loading, setLoading] = useState(false);

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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          gender: formData.gender,
          classId: formData.classId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Redirect to login after successful signup
      router.push('/auth/login?signup=success');
    } catch (err) {
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
            Get Started
          </h1>
          <p className="text-gray-600 dark:text-slate-400">Create your typing account</p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl p-8 backdrop-blur-sm animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label className="block text-gray-900 dark:text-slate-200 text-sm font-medium mb-2">
                Username
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-slate-500" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-gray-900 dark:text-slate-200 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-slate-500" />
                <input
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
              <label className="block text-gray-900 dark:text-slate-200 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-slate-500" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">At least 8 characters</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-gray-900 dark:text-slate-200 text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-slate-500" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Gender Field */}
            <div>
              <label className="block text-gray-900 dark:text-slate-200 text-sm font-medium mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Class Selection Field */}
            <div>
              <label className="block text-gray-900 dark:text-slate-200 text-sm font-medium mb-2">
                Select Your Class
              </label>
              <select
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
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
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlusIcon className="w-5 h-5" />
                  Create Account
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
              <span className="px-2 bg-slate-800 text-slate-400">Or sign up with</span>
            </div>
          </div>

          {/* OAuth Button */}
          <button
            type="button"
            onClick={() => setShowOAuthModal(true)}
            className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-emerald-500/20 mt-4"
          >
            <SparklesIcon className="w-5 h-5" />
            Sign up with Social
          </button>

          {/* Footer */}
          <p className="text-center text-gray-600 dark:text-slate-400 text-sm mt-8">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

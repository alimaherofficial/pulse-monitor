'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Activity, Github } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle GitHub OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    
    if (code && !isProcessing) {
      setIsProcessing(true);
      login(code).catch((err) => {
        setError('Authentication failed. Please try again.');
        setIsProcessing(false);
      });
    }
  }, [searchParams, login, isProcessing]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleGitHubLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = typeof window !== 'undefined' 
      ? `${window.location.origin}/login`
      : '';
    
    if (!clientId) {
      setError('GitHub OAuth is not configured. Please contact support.');
      return;
    }

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
    window.location.href = githubAuthUrl;
  };

  if (isLoading || isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <Activity className="h-12 w-12 text-blue-600 animate-pulse mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Activity className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Pulse Monitor
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Monitor your websites and services with ease
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <Button
              onClick={handleGitHubLogin}
              variant="secondary"
              size="lg"
              className="w-full flex items-center justify-center"
            >
              <Github className="h-5 w-5 mr-2" />
              Continue with GitHub
            </Button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Secure authentication
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

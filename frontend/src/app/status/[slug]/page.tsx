'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Activity, CheckCircle, XCircle, Clock, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { statusPagesApi } from '@/lib/api';
import { StatusPage, Monitor } from '@/types';
import { formatDate, formatRelativeTime, getStatusColor, getStatusText } from '@/lib/utils';

export default function PublicStatusPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [statusPage, setStatusPage] = useState<StatusPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchStatusPage();
    }
  }, [slug]);

  const fetchStatusPage = async (pagePassword?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await statusPagesApi.getBySlug(slug);
      setStatusPage(response.data);
      setRequiresPassword(false);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setRequiresPassword(true);
      } else if (error.response?.status === 404) {
        setError('Status page not found');
      } else {
        setError('Failed to load status page');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, you would send the password to the backend
    // For now, we'll just show an error
    setError('Password protection not fully implemented in this demo');
  };

  const overallStatus = statusPage?.monitors?.reduce((status, monitor) => {
    if (monitor.status === 'DOWN') return 'DOWN';
    if (monitor.status === 'PAUSED' && status !== 'DOWN') return 'PAUSED';
    return status;
  }, 'UP' as string);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Activity className="h-8 w-8 text-blue-600 animate-pulse" />
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center mb-6">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Password Protected</h2>
            <p className="text-sm text-gray-500 mt-1">
              This status page is private. Please enter the password to view it.
            </p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
            <Button type="submit" className="w-full">
              Access Status Page
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  if (error || !statusPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">{error || 'Status page not found'}</h2>
          <p className="text-sm text-gray-500 mt-2">
            The status page you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">{statusPage.title}</h1>
            </div>
            <div className="flex items-center">
              <span className={`h-3 w-3 rounded-full ${getStatusColor(overallStatus || 'UP')} mr-2`} />
              <span className="font-medium">
                {overallStatus === 'UP' ? 'All Systems Operational' : 
                 overallStatus === 'DOWN' ? 'System Issues Detected' : 
                 'Some Systems Paused'}
              </span>
            </div>
          </div>
          {statusPage.description && (
            <p className="mt-2 text-gray-600">{statusPage.description}</p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {statusPage.monitors?.filter(m => m.status === 'UP').length || 0}
            </p>
            <p className="text-sm text-gray-500">Operational</p>
          </Card>
          <Card className="text-center">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {statusPage.monitors?.filter(m => m.status === 'DOWN').length || 0}
            </p>
            <p className="text-sm text-gray-500">Down</p>
          </Card>
          <Card className="text-center">
            <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {statusPage.monitors?.filter(m => m.status === 'PAUSED').length || 0}
            </p>
            <p className="text-sm text-gray-500">Paused</p>
          </Card>
        </div>

        {/* Monitors List */}
        <Card title="Service Status">
          {statusPage.monitors?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No monitors configured</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {statusPage.monitors?.map((monitor) => (
                <div key={monitor.id} className="py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{monitor.name}</h3>
                    <p className="text-sm text-gray-500">
                      Last checked: {monitor.lastCheckedAt ? formatRelativeTime(monitor.lastCheckedAt) : 'Never'}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className={`h-3 w-3 rounded-full ${getStatusColor(monitor.status)} mr-2`} />
                    <Badge 
                      variant={monitor.status === 'UP' ? 'success' : monitor.status === 'DOWN' ? 'error' : 'warning'}
                    >
                      {getStatusText(monitor.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>Powered by Pulse Monitor</p>
          <p className="mt-1">
            Last updated: {formatDate(new Date().toISOString())}
          </p>
        </footer>
      </main>
    </div>
  );
}

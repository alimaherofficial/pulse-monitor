'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, CheckCircle, XCircle, PauseCircle, AlertCircle, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { dashboardApi, monitorsApi } from '@/lib/api';
import { DashboardStats, Monitor } from '@/types';
import { formatRelativeTime, getStatusColor, getStatusText } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, monitorsRes] = await Promise.all([
          dashboardApi.getStats(),
          monitorsApi.getAll({ limit: 5 }),
        ]);
        setStats(statsRes.data);
        setMonitors(monitorsRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your monitors and system status
          </p>
        </div>
        <Link href="/dashboard/monitors/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Monitor
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Monitors</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalMonitors || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Up</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.upMonitors || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Down</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.downMonitors || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <PauseCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Paused</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pausedMonitors || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Monitors */}
      <Card 
        title="Recent Monitors" 
        description="Status of your most recent monitors"
        action={
          <Link href="/dashboard/monitors">
            <Button variant="ghost">View all</Button>
          </Link>
        }
      >
        {monitors.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No monitors yet</h3>
            <p className="text-gray-500 mb-4">Create your first monitor to start tracking</p>
            <Link href="/dashboard/monitors/new">
              <Button>Create Monitor</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Checked
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {monitors.map((monitor) => (
                  <tr key={monitor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link 
                        href={`/dashboard/monitors/detail?id=${monitor.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {monitor.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <span className={`h-2.5 w-2.5 rounded-full ${getStatusColor(monitor.status)} mr-2`} />
                        <Badge 
                          variant={monitor.status === 'UP' ? 'success' : monitor.status === 'DOWN' ? 'error' : 'warning'}
                        >
                          {getStatusText(monitor.status)}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {monitor.lastCheckedAt ? formatRelativeTime(monitor.lastCheckedAt) : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="info">{monitor.type}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

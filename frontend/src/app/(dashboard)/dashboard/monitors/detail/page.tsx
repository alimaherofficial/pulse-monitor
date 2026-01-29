'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pause, Play, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ResponseTimeChart } from '@/components/monitors/ResponseTimeChart';
import { monitorsApi } from '@/lib/api';
import { Monitor, CheckResult, Incident } from '@/types';
import { formatDate, formatRelativeTime, getStatusColor, getStatusText } from '@/lib/utils';

export default function MonitorDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const monitorId = searchParams.get('id');

  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'checks' | 'incidents'>('overview');

  useEffect(() => {
    if (!monitorId) {
      router.push('/dashboard/monitors');
      return;
    }
    fetchMonitorData();
  }, [monitorId]);

  const fetchMonitorData = async () => {
    if (!monitorId) return;
    
    setIsLoading(true);
    try {
      const [monitorRes, checksRes, incidentsRes] = await Promise.all([
        monitorsApi.getById(monitorId),
        monitorsApi.getChecks(monitorId, { limit: 100 }),
        monitorsApi.getIncidents(monitorId, { limit: 20 }),
      ]);
      
      setMonitor(monitorRes.data);
      setChecks(checksRes.data.data || []);
      setIncidents(incidentsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch monitor data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseResume = async () => {
    if (!monitor) return;
    
    setIsActionLoading(true);
    try {
      if (monitor.isActive) {
        await monitorsApi.pause(monitor.id);
      } else {
        await monitorsApi.resume(monitor.id);
      }
      await fetchMonitorData();
    } catch (error) {
      console.error('Failed to pause/resume monitor:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!monitor) return;
    
    setIsActionLoading(true);
    try {
      await monitorsApi.delete(monitor.id);
      router.push('/dashboard/monitors');
    } catch (error) {
      console.error('Failed to delete monitor:', error);
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!monitor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Monitor not found</p>
        <Link href="/dashboard/monitors">
          <Button className="mt-4">Back to Monitors</Button>
        </Link>
      </div>
    );
  }

  const upChecks = checks.filter(c => c.status === 'UP').length;
  const uptimePercentage = checks.length > 0 ? ((upChecks / checks.length) * 100).toFixed(2) : '100.00';
  const avgResponseTime = checks
    .filter(c => c.responseTime)
    .reduce((acc, c) => acc + (c.responseTime || 0), 0) / (checks.filter(c => c.responseTime).length || 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/monitors">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">{monitor.name}</h1>
              <Badge 
                variant={monitor.status === 'UP' ? 'success' : monitor.status === 'DOWN' ? 'error' : 'warning'}
              >
                {getStatusText(monitor.status)}
              </Badge>
            </div>
            {monitor.url && (
              <a 
                href={monitor.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {monitor.url}
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={monitor.isActive ? 'secondary' : 'primary'}
            size="sm"
            onClick={handlePauseResume}
            isLoading={isActionLoading}
          >
            {monitor.isActive ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            )}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Status</p>
            <div className="flex items-center mt-1">
              <span className={`h-3 w-3 rounded-full ${getStatusColor(monitor.status)} mr-2`} />
              <span className="text-lg font-semibold">{getStatusText(monitor.status)}</span>
            </div>
          </div>
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Uptime</p>
            <p className="text-2xl font-bold text-gray-900">{uptimePercentage}%</p>
          </div>
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Avg Response</p>
            <p className="text-2xl font-bold text-gray-900">
              {avgResponseTime ? `${Math.round(avgResponseTime)}ms` : 'N/A'}
            </p>
          </div>
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Last Checked</p>
            <p className="text-lg font-semibold text-gray-900">
              {monitor.lastCheckedAt ? formatRelativeTime(monitor.lastCheckedAt) : 'Never'}
            </p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['overview', 'checks', 'incidents'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card title="Response Time (Last 24h)">
            <ResponseTimeChart checks={checks} />
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Recent Checks">
              {checks.slice(0, 5).length === 0 ? (
                <p className="text-gray-500 text-center py-4">No checks yet</p>
              ) : (
                <div className="space-y-3">
                  {checks.slice(0, 5).map((check) => (
                    <div key={check.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center">
                        {check.status === 'UP' ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <span className="text-sm text-gray-600">
                          {formatRelativeTime(check.checkedAt)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {check.responseTime ? `${check.responseTime}ms` : 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Recent Incidents">
              {incidents.slice(0, 5).length === 0 ? (
                <p className="text-gray-500 text-center py-4">No incidents</p>
              ) : (
                <div className="space-y-3">
                  {incidents.slice(0, 5).map((incident) => (
                    <div key={incident.id} className="py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center justify-between">
                        <Badge variant={incident.resolvedAt ? 'success' : 'error'}>
                          {incident.resolvedAt ? 'Resolved' : 'Active'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(incident.startedAt)}
                        </span>
                      </div>
                      {incident.reason && (
                        <p className="text-sm text-gray-600 mt-1">{incident.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'checks' && (
        <Card title="All Checks">
          {checks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No checks recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Response Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {checks.map((check) => (
                    <tr key={check.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Badge variant={check.status === 'UP' ? 'success' : 'error'}>
                          {check.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(check.checkedAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {check.responseTime ? `${check.responseTime}ms` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {check.statusCode || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'incidents' && (
        <Card title="All Incidents">
          {incidents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No incidents recorded</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resolved</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {incidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Badge variant={incident.resolvedAt ? 'success' : 'error'}>
                          {incident.resolvedAt ? 'Resolved' : 'Active'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(incident.startedAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {incident.resolvedAt ? formatDate(incident.resolvedAt) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {incident.reason || 'Unknown'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Monitor"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Are you sure you want to delete <strong>{monitor.name}</strong>? 
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isActionLoading}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

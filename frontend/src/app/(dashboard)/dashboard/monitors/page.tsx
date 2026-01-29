'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Search, Pause, Play, Trash2, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { monitorsApi } from '@/lib/api';
import { Monitor } from '@/types';
import { formatRelativeTime, getStatusColor, getStatusText } from '@/lib/utils';

export default function MonitorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchMonitors = async () => {
    try {
      const response = await monitorsApi.getAll();
      setMonitors(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch monitors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitors();
  }, []);

  const handlePauseResume = async (monitor: Monitor) => {
    setIsActionLoading(true);
    try {
      if (monitor.isActive) {
        await monitorsApi.pause(monitor.id);
      } else {
        await monitorsApi.resume(monitor.id);
      }
      await fetchMonitors();
    } catch (error) {
      console.error('Failed to pause/resume monitor:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMonitor) return;
    
    setIsActionLoading(true);
    try {
      await monitorsApi.delete(selectedMonitor.id);
      setDeleteModalOpen(false);
      setSelectedMonitor(null);
      await fetchMonitors();
    } catch (error) {
      console.error('Failed to delete monitor:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const openDeleteModal = (monitor: Monitor) => {
    setSelectedMonitor(monitor);
    setDeleteModalOpen(true);
  };

  const filteredMonitors = monitors.filter((monitor) =>
    monitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    monitor.url?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitors</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and monitor your websites and services
          </p>
        </div>
        <Link href="/dashboard/monitors/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Monitor
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search monitors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <Button variant="ghost" onClick={fetchMonitors}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Monitors List */}
      <Card>
        {filteredMonitors.length === 0 ? (
          <div className="text-center py-12">
            {searchQuery ? (
              <>
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No monitors found</h3>
                <p className="text-gray-500">Try adjusting your search query</p>
              </>
            ) : (
              <>
                <Plus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No monitors yet</h3>
                <p className="text-gray-500 mb-4">Create your first monitor to start tracking</p>
                <Link href="/dashboard/monitors/new">
                  <Button>Create Monitor</Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monitor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Checked
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interval
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMonitors.map((monitor) => (
                  <tr key={monitor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <Link 
                          href={`/dashboard/monitors/detail?id=${monitor.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {monitor.name}
                        </Link>
                        {monitor.url && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                            {monitor.url}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`h-2.5 w-2.5 rounded-full ${getStatusColor(monitor.status)} mr-2`} />
                        <Badge 
                          variant={monitor.status === 'UP' ? 'success' : monitor.status === 'DOWN' ? 'error' : 'warning'}
                        >
                          {getStatusText(monitor.status)}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {monitor.lastCheckedAt ? formatRelativeTime(monitor.lastCheckedAt) : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{monitor.interval} min</span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handlePauseResume(monitor)}
                        disabled={isActionLoading}
                        className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        title={monitor.isActive ? 'Pause' : 'Resume'}
                      >
                        {monitor.isActive ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => openDeleteModal(monitor)}
                        disabled={isActionLoading}
                        className="inline-flex items-center p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Monitor"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Are you sure you want to delete <strong>{selectedMonitor?.name}</strong>? 
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

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ExternalLink, Trash2, Edit, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { statusPagesApi } from '@/lib/api';
import { StatusPage } from '@/types';

export default function StatusPagesPage() {
  const [statusPages, setStatusPages] = useState<StatusPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<StatusPage | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchStatusPages = async () => {
    try {
      const response = await statusPagesApi.getAll();
      setStatusPages(response.data || []);
    } catch (error) {
      console.error('Failed to fetch status pages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusPages();
  }, []);

  const handleDelete = async () => {
    if (!selectedPage) return;
    
    setIsActionLoading(true);
    try {
      await statusPagesApi.delete(selectedPage.id);
      setDeleteModalOpen(false);
      setSelectedPage(null);
      await fetchStatusPages();
    } catch (error) {
      console.error('Failed to delete status page:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const openDeleteModal = (page: StatusPage) => {
    setSelectedPage(page);
    setDeleteModalOpen(true);
  };

  const getPublicUrl = (slug: string) => {
    const baseUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}`
      : '';
    return `${baseUrl}/status/${slug}`;
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Status Pages</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage public status pages for your services
          </p>
        </div>
        <Link href="/dashboard/status-pages/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Status Page
          </Button>
        </Link>
      </div>

      {/* Status Pages List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statusPages.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <div className="text-center py-12">
              <Plus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No status pages yet</h3>
              <p className="text-gray-500 mb-4">Create your first status page to share with your users</p>
              <Link href="/dashboard/status-pages/new">
                <Button>Create Status Page</Button>
              </Link>
            </div>
          </Card>
        ) : (
          statusPages.map((page) => (
            <Card key={page.id} className="flex flex-col">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{page.title}</h3>
                  {page.isPublic ? (
                    <Badge variant="success"><Eye className="h-3 w-3 mr-1" /> Public</Badge>
                  ) : (
                    <Badge variant="warning"><EyeOff className="h-3 w-3 mr-1" /> Private</Badge>
                  )}
                </div>
                
                {page.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{page.description}</p>
                )}

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <span className="font-medium">Slug:</span>
                  <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {page.slug}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Monitors:</p>
                  <p className="text-sm font-medium text-gray-900">
                    {page.monitors?.length || 0} monitors
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-2">
                <a
                  href={getPublicUrl(page.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Public Page
                </a>
                
                <div className="flex space-x-2">
                  <Link 
                    href={`/dashboard/status-pages/edit?id=${page.id}`}
                    className="flex-1"
                  >
                    <Button variant="secondary" size="sm" className="w-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteModal(page)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Status Page"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Are you sure you want to delete <strong>{selectedPage?.title}</strong>? 
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

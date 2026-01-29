'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { statusPagesApi, monitorsApi } from '@/lib/api';
import { Monitor } from '@/types';

export default function CreateStatusPagePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    selectedMonitors: [] as string[],
    isPublic: true,
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMonitors();
  }, []);

  const fetchMonitors = async () => {
    try {
      const response = await monitorsApi.getAll();
      setMonitors(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch monitors:', error);
    }
  };

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMonitorToggle = (monitorId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedMonitors: prev.selectedMonitors.includes(monitorId)
        ? prev.selectedMonitors.filter(id => id !== monitorId)
        : [...prev.selectedMonitors, monitorId],
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.isPublic && !formData.password) {
      newErrors.password = 'Password is required for private status pages';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await statusPagesApi.create({
        slug: formData.slug,
        title: formData.title,
        description: formData.description || null,
        monitorIds: formData.selectedMonitors,
        isPublic: formData.isPublic,
        password: formData.password || null,
      });
      
      router.push('/dashboard/status-pages');
    } catch (error: any) {
      console.error('Failed to create status page:', error);
      setErrors({
        submit: error.response?.data?.message || 'Failed to create status page',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/status-pages">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Status Page</h1>
          <p className="text-sm text-gray-500">Create a public status page for your services</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <Input
            label="Page URL Slug"
            value={formData.slug}
            onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            error={errors.slug}
            placeholder="my-company-status"
            helperText="This will be used in the public URL: /status/your-slug"
            required
          />

          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            error={errors.title}
            placeholder="My Company Status"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe your status page..."
              rows={3}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Monitor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Monitors to Display
            </label>
            {monitors.length === 0 ? (
              <p className="text-sm text-gray-500">
                No monitors available. <Link href="/dashboard/monitors/new" className="text-blue-600 hover:text-blue-800">Create one first</Link>.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                {monitors.map((monitor) => (
                  <label key={monitor.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.selectedMonitors.includes(monitor.id)}
                      onChange={() => handleMonitorToggle(monitor.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{monitor.name}</p>
                      <p className="text-xs text-gray-500">{monitor.type}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Visibility */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => handleChange('isPublic', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Make this page public</span>
            </label>
          </div>

          {/* Password Protection */}
          {!formData.isPublic && (
            <Input
              label="Password Protection"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              error={errors.password}
              placeholder="Enter password"
              helperText="Visitors will need this password to view the status page"
              required={!formData.isPublic}
            />
          )}

          {/* Actions */}
          <div className="flex items-center space-x-4 pt-4">
            <Button
              type="submit"
              isLoading={isSubmitting}
            >
              Create Status Page
            </Button>
            <Link href="/dashboard/status-pages">
              <Button variant="ghost" type="button">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

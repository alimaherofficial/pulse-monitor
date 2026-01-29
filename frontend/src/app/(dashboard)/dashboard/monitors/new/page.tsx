'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TestTube } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { monitorsApi } from '@/lib/api';

const monitorTypes = [
  { value: 'HTTP', label: 'HTTP/HTTPS Monitor' },
  { value: 'CRON', label: 'Cron Job Monitor' },
  { value: 'SSL', label: 'SSL Certificate Monitor' },
];

const intervals = [
  { value: '1', label: 'Every 1 minute' },
  { value: '5', label: 'Every 5 minutes' },
  { value: '15', label: 'Every 15 minutes' },
  { value: '30', label: 'Every 30 minutes' },
  { value: '60', label: 'Every 1 hour' },
];

const statusCodes = [
  { value: '200', label: '200 OK' },
  { value: '201', label: '201 Created' },
  { value: '204', label: '204 No Content' },
  { value: '301', label: '301 Moved Permanently' },
  { value: '302', label: '302 Found' },
];

export default function CreateMonitorPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'HTTP',
    url: '',
    interval: '5',
    gracePeriod: '',
    expectedStatusCode: '200',
    keyword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.type !== 'CRON' && !formData.url.trim()) {
      newErrors.url = 'URL is required';
    }
    
    if (formData.type === 'CRON' && !formData.gracePeriod) {
      newErrors.gracePeriod = 'Grace period is required for Cron monitors';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTest = async () => {
    if (!validateForm()) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await monitorsApi.test({
        url: formData.url,
        type: formData.type,
        expectedStatusCode: parseInt(formData.expectedStatusCode),
        keyword: formData.keyword || undefined,
      });
      
      setTestResult({
        success: response.data.success,
        message: response.data.success 
          ? `Test successful! Response time: ${response.data.responseTime}ms`
          : `Test failed: ${response.data.error || 'Unknown error'}`,
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Test failed: ${error.response?.data?.message || error.message}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await monitorsApi.create({
        name: formData.name,
        type: formData.type,
        url: formData.url || null,
        interval: parseInt(formData.interval),
        gracePeriod: formData.gracePeriod ? parseInt(formData.gracePeriod) : null,
        expectedStatusCode: parseInt(formData.expectedStatusCode),
        keyword: formData.keyword || null,
      });
      
      router.push('/dashboard/monitors');
    } catch (error: any) {
      console.error('Failed to create monitor:', error);
      setErrors({
        submit: error.response?.data?.message || 'Failed to create monitor',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const showUrlField = formData.type !== 'CRON';
  const showGracePeriod = formData.type === 'CRON';
  const showStatusCode = formData.type === 'HTTP';
  const showKeyword = formData.type === 'HTTP';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/monitors">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Monitor</h1>
          <p className="text-sm text-gray-500">Set up a new monitor for your service</p>
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
            label="Monitor Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            placeholder="e.g., My Website API"
            required
          />

          <Select
            label="Monitor Type"
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            options={monitorTypes}
            required
          />

          {showUrlField && (
            <Input
              label="URL"
              type="url"
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              error={errors.url}
              placeholder="https://example.com"
              required
            />
          )}

          <Select
            label="Check Interval"
            value={formData.interval}
            onChange={(e) => handleChange('interval', e.target.value)}
            options={intervals}
            required
          />

          {showGracePeriod && (
            <Input
              label="Grace Period (minutes)"
              type="number"
              min="1"
              max="60"
              value={formData.gracePeriod}
              onChange={(e) => handleChange('gracePeriod', e.target.value)}
              error={errors.gracePeriod}
              helperText="Time to wait before alerting if no ping is received"
              required
            />
          )}

          {showStatusCode && (
            <Select
              label="Expected Status Code"
              value={formData.expectedStatusCode}
              onChange={(e) => handleChange('expectedStatusCode', e.target.value)}
              options={statusCodes}
              required
            />
          )}

          {showKeyword && (
            <Input
              label="Keyword to Match (Optional)"
              value={formData.keyword}
              onChange={(e) => handleChange('keyword', e.target.value)}
              placeholder="e.g., success"
              helperText="If provided, the response body must contain this keyword"
            />
          )}

          {/* Test Result */}
          {testResult && (
            <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {testResult.message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-4 pt-4">
            {showUrlField && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleTest}
                isLoading={isTesting}
                disabled={!formData.url}
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test URL
              </Button>
            )}
            <Button
              type="submit"
              isLoading={isSubmitting}
            >
              Create Monitor
            </Button>
            <Link href="/dashboard/monitors">
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

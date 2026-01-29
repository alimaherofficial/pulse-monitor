import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return formatDate(date);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'UP':
      return 'bg-green-500';
    case 'DOWN':
      return 'bg-red-500';
    case 'PAUSED':
      return 'bg-yellow-500';
    case 'PENDING':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'UP':
      return 'Operational';
    case 'DOWN':
      return 'Down';
    case 'PAUSED':
      return 'Paused';
    case 'PENDING':
      return 'Pending';
    default:
      return 'Unknown';
  }
}

export function calculateUptime(checks: { status: string }[]): number {
  if (!checks.length) return 100;
  const upChecks = checks.filter(c => c.status === 'UP').length;
  return Math.round((upChecks / checks.length) * 100 * 100) / 100;
}

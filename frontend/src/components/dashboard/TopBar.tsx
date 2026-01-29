'use client';

import { useAuth } from '@/contexts/AuthContext';
import { User } from 'lucide-react';

export function TopBar() {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8">
      <div className="flex-1" />
      
      <div className="flex items-center space-x-4">
        {/* User Profile */}
        <div className="flex items-center space-x-3">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name || user.email}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
              <User className="h-5 w-5 text-gray-600" />
            </div>
          )}
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900">
              {user?.name || user?.email}
            </p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

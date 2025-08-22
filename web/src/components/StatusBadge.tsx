import React from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  ClockIcon 
} from '@heroicons/react/24/solid';

interface StatusBadgeProps {
  statusCode: number;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ statusCode }) => {
  const getStatusConfig = (code: number) => {
    if (code >= 200 && code < 300) {
      return {
        bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
        text: 'text-white',
        icon: CheckCircleIcon,
        label: 'Success',
        pulse: false,
      };
    } else if (code >= 400 && code < 500) {
      return {
        bg: 'bg-gradient-to-r from-amber-500 to-orange-600',
        text: 'text-white',
        icon: ExclamationTriangleIcon,
        label: 'Client Error',
        pulse: false,
      };
    } else if (code >= 500) {
      return {
        bg: 'bg-gradient-to-r from-red-500 to-rose-600',
        text: 'text-white',
        icon: XCircleIcon,
        label: 'Server Error',
        pulse: true,
      };
    } else {
      return {
        bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
        text: 'text-white',
        icon: ClockIcon,
        label: 'Pending',
        pulse: true,
      };
    }
  };

  const config = getStatusConfig(statusCode);
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full shadow-sm ${config.bg} ${config.text} ${config.pulse ? 'animate-pulse' : ''}`}>
      <Icon className="h-4 w-4" />
      <span className="text-xs font-semibold">{statusCode || 'Pending'}</span>
      <span className="text-xs opacity-90">•</span>
      <span className="text-xs font-medium opacity-90">{config.label}</span>
    </div>
  );
};

export default StatusBadge;
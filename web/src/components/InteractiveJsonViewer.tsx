import React, { useState } from 'react';
import { 
  ChevronRightIcon,
  ChevronDownIcon,
  ClipboardIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface InteractiveJsonViewerProps {
  data: any;
  onCopy?: (text: string) => void;
  copiedPath?: string | null;
}

const InteractiveJsonViewer: React.FC<InteractiveJsonViewerProps> = ({
  data,
  onCopy,
  copiedPath
}) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['root']));

  const toggleExpansion = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const copyValue = (value: any) => {
    if (onCopy) {
      const jsonString = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
      onCopy(jsonString);
    }
  };

  const getValueType = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const getValuePreview = (value: any): string => {
    if (value === null) return 'null';
    if (typeof value === 'string') return `"${value.length > 50 ? value.substring(0, 50) + '...' : value}"`;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') return `Object(${Object.keys(value).length})`;
    return String(value);
  };

  const renderStringValue = (value: string, path: string) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isLongText = value.length > 100;
    const shouldShowExpander = isLongText;

    if (!shouldShowExpander) {
      return (
        <span className="text-green-600 dark:text-green-400 font-mono break-all">
          "{value}"
        </span>
      );
    }

    return (
      <div className="flex-1 min-w-0 group">
        <div className="flex items-start space-x-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center w-4 h-4 mt-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-3 h-3 text-gray-500" />
            ) : (
              <ChevronRightIcon className="w-3 h-3 text-gray-500" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            {isExpanded ? (
              <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-600 relative group">
                <pre className="text-green-600 dark:text-green-400 font-mono text-sm whitespace-pre-wrap break-words">
                  "{value}"
                </pre>
                <button
                  onClick={() => copyValue(value)}
                  className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center justify-center w-6 h-6 rounded transition-all ${
                    copiedPath === path
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'
                      : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 shadow-sm'
                  }`}
                >
                  {copiedPath === path ? (
                    <CheckIcon className="w-3 h-3" />
                  ) : (
                    <ClipboardIcon className="w-3 h-3" />
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-green-600 dark:text-green-400 font-mono">
                  "{value.substring(0, 100)}..." ({value.length} chars)
                </span>
                <button
                  onClick={() => copyValue(value)}
                  className={`opacity-0 group-hover:opacity-100 flex items-center justify-center w-5 h-5 rounded transition-all flex-shrink-0 ${
                    copiedPath === path
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {copiedPath === path ? (
                    <CheckIcon className="w-3 h-3" />
                  ) : (
                    <ClipboardIcon className="w-3 h-3" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderValue = (value: any, key: string, path: string, level: number = 0): React.ReactNode => {
    const indent = level * 16;
    const isExpanded = expandedPaths.has(path);
    const valueType = getValueType(value);
    const isExpandable = valueType === 'object' || valueType === 'array';
    const hasChildren = isExpandable && (Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0);

    return (
      <div key={path} className="text-sm">
        <div 
          className="flex items-center space-x-1 py-0.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded group"
          style={{ paddingLeft: `${indent}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={() => toggleExpansion(path)}
              className="flex items-center justify-center w-4 h-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronRightIcon className="w-3 h-3 text-gray-500" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}

          {/* Key */}
          {key && (
            <>
              <span className="text-blue-600 dark:text-blue-400 font-medium">"{key}"</span>
              <span className="text-gray-500">:</span>
            </>
          )}

          {/* Value or Preview */}
          <div className="flex items-start space-x-2 flex-1 min-w-0">
            {!isExpandable ? (
              valueType === 'string' ? (
                renderStringValue(value, path)
              ) : (
                <span className={`font-mono ${
                  valueType === 'number' ? 'text-purple-600 dark:text-purple-400' :
                  valueType === 'boolean' ? 'text-orange-600 dark:text-orange-400' :
                  valueType === 'null' ? 'text-gray-500 dark:text-gray-400' :
                  'text-gray-700 dark:text-gray-300'
                }`}>
                  {getValuePreview(value)}
                </span>
              )
            ) : (
              <>
                <span className="text-gray-500 font-mono">
                  {valueType === 'array' ? '[' : '{'}
                </span>
                {!isExpanded && (
                  <span className="text-gray-400 text-xs truncate">
                    {getValuePreview(value)}
                  </span>
                )}
                {!isExpanded && (
                  <span className="text-gray-500 font-mono">
                    {valueType === 'array' ? ']' : '}'}
                  </span>
                )}
              </>
            )}

            {/* Copy Button - only show if not a string with its own expander */}
            {!(valueType === 'string' && value.length > 100) && (
              <button
                onClick={() => copyValue(value)}
                className={`opacity-0 group-hover:opacity-100 flex items-center justify-center w-5 h-5 rounded transition-all flex-shrink-0 ${
                  copiedPath === path
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600'
                }`}
              >
                {copiedPath === path ? (
                  <CheckIcon className="w-3 h-3" />
                ) : (
                  <ClipboardIcon className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Expanded Children */}
        {isExpandable && isExpanded && hasChildren && (
          <div>
            {Array.isArray(value) ? (
              value.map((item, index) => 
                renderValue(item, String(index), `${path}[${index}]`, level + 1)
              )
            ) : (
              Object.entries(value).map(([childKey, childValue]) =>
                renderValue(childValue, childKey, `${path}.${childKey}`, level + 1)
              )
            )}
            <div 
              className="text-gray-500 font-mono text-sm"
              style={{ paddingLeft: `${indent + 16}px` }}
            >
              {valueType === 'array' ? ']' : '}'}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!data) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm p-4 text-center">
        No data to display
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Interactive JSON Viewer
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setExpandedPaths(new Set(['root']))}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Collapse All
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button
              onClick={() => {
                const allPaths = new Set(['root']);
                const collectPaths = (obj: any, currentPath: string) => {
                  if (Array.isArray(obj)) {
                    allPaths.add(currentPath);
                    obj.forEach((item, index) => {
                      if (typeof item === 'object' && item !== null) {
                        collectPaths(item, `${currentPath}[${index}]`);
                      }
                    });
                  } else if (typeof obj === 'object' && obj !== null) {
                    allPaths.add(currentPath);
                    Object.entries(obj).forEach(([key, value]) => {
                      if (typeof value === 'object' && value !== null) {
                        collectPaths(value, `${currentPath}.${key}`);
                      }
                    });
                  }
                };
                collectPaths(data, 'root');
                setExpandedPaths(allPaths);
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Expand All
            </button>
          </div>
        </div>
      </div>

      {/* JSON Content */}
      <div className="p-4">
        {renderValue(data, '', 'root')}
      </div>
    </div>
  );
};

export default InteractiveJsonViewer;
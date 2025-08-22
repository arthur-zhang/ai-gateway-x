import React from 'react';
import ReactJson from '@microlink/react-json-view';
import { 
  ClipboardIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface ExpandableRawJsonViewerProps {
  data: any;
  onCopy?: (text: string) => void;
  copiedPath?: string | null;
}

const ExpandableRawJsonViewer: React.FC<ExpandableRawJsonViewerProps> = ({
  data,
  onCopy,
  copiedPath
}) => {


  const copyValue = (text: string) => {
    if (onCopy) {
      onCopy(text);
    }
  };

  const copyFullJson = () => {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    copyValue(jsonString);
  };

  // Handle pending response
  if (data?.message === 'Response pending...') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-200 border-t-amber-600"></div>
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">
            Response pending...
          </div>
        </div>
      </div>
    );
  }

  // Handle string data
  if (typeof data === 'string') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Raw Text Response
            </span>
            <button
              onClick={copyFullJson}
              className={`flex items-center space-x-2 px-3 py-1 rounded text-xs font-medium transition-colors ${
                copiedPath === 'full-json'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-800/50'
              }`}
            >
              {copiedPath === 'full-json' ? (
                <>
                  <CheckIcon className="w-3 h-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <ClipboardIcon className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="p-4">
          <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
            {data}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Interactive JSON Viewer
          </span>
          <button
            onClick={copyFullJson}
            className={`flex items-center space-x-2 px-3 py-1 rounded text-xs font-medium transition-colors ${
              copiedPath === 'full-json'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-800/50'
            }`}
          >
            {copiedPath === 'full-json' ? (
              <>
                <CheckIcon className="w-3 h-3" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <ClipboardIcon className="w-3 h-3" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* JSON Content */}
      <div className="p-4">
        <ReactJson 
          src={data}
          theme="twilight"
        />
      </div>
    </div>
  );
};

export default ExpandableRawJsonViewer;
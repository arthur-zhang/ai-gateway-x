import React, { useState, useEffect } from 'react';
import { 
  ComputerDesktopIcon,
  ClipboardIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  ChatBubbleLeftIcon,
  BeakerIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import ExpandableRawJsonViewer from './ExpandableRawJsonViewer';

interface ResponseViewerProps {
  data: any;
  title: string;
  fieldName: string;
  onCopy?: (text: string, fieldName: string) => void;
  copiedField?: string | null;
}

type ViewMode = 'structured' | 'raw';

const ResponseViewer: React.FC<ResponseViewerProps> = ({ 
  data, 
  title, 
  fieldName, 
  onCopy,
  copiedField 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('structured');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['content', 'metadata']));
  const [expandedContent, setExpandedContent] = useState<Set<string>>(new Set());
  const [copiedJsonPath, setCopiedJsonPath] = useState<string | null>(null);
  
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleContent = (contentId: string) => {
    const newExpanded = new Set(expandedContent);
    if (newExpanded.has(contentId)) {
      newExpanded.delete(contentId);
    } else {
      newExpanded.add(contentId);
    }
    setExpandedContent(newExpanded);
  };

  // Initialize all content as expanded when data changes
  useEffect(() => {
    if (data?.content) {
      const contentIds = data.content.map((_: any, index: number) => `content-${index}`);
      setExpandedContent(new Set(contentIds));
    }
  }, [data]);

  const copyToClipboard = (text: string, field: string) => {
    if (onCopy) {
      onCopy(text, field);
    }
  };

  const handleJsonCopy = (text: string) => {
    if (onCopy) {
      onCopy(text, `${fieldName}-json-part`);
      setCopiedJsonPath(`${fieldName}-json-part`);
      setTimeout(() => setCopiedJsonPath(null), 2000);
    }
  };

  const renderContentBlock = (content: any, index: number, contentNumber?: number) => {
    if (content.type === 'text') {
      return (
        <div key={index} className="rounded-xl p-4 border border-slate-300 dark:border-slate-600 shadow-sm bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex items-start space-x-3 mb-3">
            <div className="h-6 w-6 bg-slate-100 dark:bg-slate-900/40 rounded-full flex items-center justify-center flex-shrink-0">
              <ChatBubbleLeftIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
            </div>
            <div className="flex items-center space-x-2 flex-1">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-['Inter',sans-serif]">
                Text Response {contentNumber !== undefined ? `#${contentNumber + 1}` : ''}
              </span>
            </div>
          </div>
          <div className="whitespace-pre-wrap text-sm font-['Inter',sans-serif] text-slate-900 dark:text-slate-100 leading-relaxed pl-9">
            {content.text}
          </div>
        </div>
      );
    }

    if (content.type === 'thinking') {
      return (
        <div key={index} className="rounded-xl p-4 border border-violet-300 dark:border-violet-600 shadow-sm bg-violet-50/50 dark:bg-violet-900/20">
          <div className="flex items-start space-x-3 mb-3">
            <div className="h-6 w-6 bg-violet-100 dark:bg-violet-900/40 rounded-full flex items-center justify-center flex-shrink-0">
              <LightBulbIcon className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex items-center space-x-2 flex-1">
              <span className="text-sm font-semibold text-violet-700 dark:text-violet-300 font-['Inter',sans-serif]">
                Thinking Process {contentNumber !== undefined ? `#${contentNumber + 1}` : ''}
              </span>
            </div>
          </div>
          <div className="whitespace-pre-wrap text-sm font-['Inter',sans-serif] text-slate-900 dark:text-slate-100 leading-relaxed pl-9 bg-violet-50/30 dark:bg-violet-900/10 p-3 rounded-lg border border-violet-200/50 dark:border-violet-700/50">
            {content.thinking}
          </div>
        </div>
      );
    }

    if (content.type === 'tool_use') {
      return (
        <div key={index} className="rounded-xl p-4 border border-amber-300 dark:border-amber-600 shadow-sm bg-amber-50/50 dark:bg-amber-900/20">
          <div className="flex items-start space-x-3 mb-3">
            <div className="h-6 w-6 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center flex-shrink-0">
              <BeakerIcon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300 font-['Inter',sans-serif]">Tool Use</span>
                <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
                  {content.name}
                </span>
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400 mb-2 font-mono">
                ID: {content.id}
              </div>
            </div>
          </div>
          <div className="bg-slate-900 text-slate-100 dark:bg-slate-950 dark:text-slate-200 p-3 rounded-lg text-xs overflow-x-auto ml-9">
            <pre className="font-['JetBrains_Mono',monospace]">{JSON.stringify(content.input, null, 2)}</pre>
          </div>
        </div>
      );
    }

    return (
      <div key={index} className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-300 dark:border-amber-600 shadow-sm">
        <div className="text-sm text-amber-700 dark:text-amber-300 mb-3 font-['Inter',sans-serif] font-semibold">
          Unknown content type: {content.type}
        </div>
        <div className="bg-slate-900 text-slate-100 dark:bg-slate-950 dark:text-slate-200 p-3 rounded-lg text-xs overflow-x-auto">
          <pre className="font-['JetBrains_Mono',monospace]">{JSON.stringify(content, null, 2)}</pre>
        </div>
      </div>
    );
  };

  const renderResponseContent = () => {
    if (!data.content || !Array.isArray(data.content)) return null;

    return (
      <div className="rounded-xl border border-emerald-200/50 dark:border-emerald-700/50 bg-emerald-50/30 dark:bg-emerald-900/10">
        <div 
          className="px-4 py-3 cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20 transition-colors rounded-t-xl"
          onClick={() => toggleSection('content')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-emerald-200 dark:bg-emerald-800 rounded-lg flex items-center justify-center">
                <ComputerDesktopIcon className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Response Content</h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {data.content.length} item{data.content.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(JSON.stringify(data.content, null, 2), `${fieldName}-content`);
                }}
                className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  copiedField === `${fieldName}-content`
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60'
                }`}
              >
                {copiedField === `${fieldName}-content` ? (
                  <CheckIcon className="h-3 w-3" />
                ) : (
                  <ClipboardIcon className="h-3 w-3" />
                )}
              </button>
              {expandedSections.has('content') ? (
                <ChevronDownIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
          </div>
        </div>
        
        {expandedSections.has('content') && (
          <div className="px-4 pb-4 space-y-3">
            {data.content.map((content: any, index: number) => {
              const contentId = `content-${index}`;
              const isContentExpanded = expandedContent.has(contentId);
              
              return (
                <div key={index} className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50">
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors rounded-t-lg"
                    onClick={() => toggleContent(contentId)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                        <DocumentTextIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 px-2 py-1 rounded-full">
                          Content #{index + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Type: <span className="text-slate-600 dark:text-slate-400">{content.type}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(JSON.stringify(content, null, 2), `${fieldName}-content-${index}`);
                        }}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                          copiedField === `${fieldName}-content-${index}`
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                        }`}
                      >
                        {copiedField === `${fieldName}-content-${index}` ? (
                          <CheckIcon className="h-3 w-3" />
                        ) : (
                          <ClipboardIcon className="h-3 w-3" />
                        )}
                      </button>
                      {isContentExpanded ? (
                        <ChevronDownIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      )}
                    </div>
                  </div>
                  
                  {isContentExpanded && (
                    <div className="px-3 pb-3 space-y-3 border-t border-slate-200 dark:border-slate-700">
                      {(() => {
                        let textContentCount = 0;
                        const isTextContent = content.type === 'text';
                        const currentTextIndex = isTextContent ? textContentCount++ : undefined;
                        return renderContentBlock(content, index, currentTextIndex);
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderMetadata = () => {
    const metadata = {
      id: data.id,
      model: data.model,
      role: data.role,
      stop_reason: data.stop_reason,
      ...(data.usage && { usage: data.usage })
    };

    // Remove undefined values
    const cleanMetadata = Object.fromEntries(
      Object.entries(metadata).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(cleanMetadata).length === 0) return null;

    return (
      <div className="rounded-xl border border-violet-200/50 dark:border-violet-700/50 bg-violet-50/30 dark:bg-violet-900/10">
        <div 
          className="px-4 py-3 cursor-pointer hover:bg-violet-100/50 dark:hover:bg-violet-900/20 transition-colors rounded-t-xl"
          onClick={() => toggleSection('metadata')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-violet-200 dark:bg-violet-800 rounded-lg flex items-center justify-center">
                <InformationCircleIcon className="h-4 w-4 text-violet-700 dark:text-violet-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-violet-900 dark:text-violet-100">Response Metadata</h3>
                <p className="text-xs text-violet-600 dark:text-violet-400">
                  Model info, usage stats, and response details
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(JSON.stringify(cleanMetadata, null, 2), `${fieldName}-metadata`);
                }}
                className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  copiedField === `${fieldName}-metadata`
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:hover:bg-violet-900/60'
                }`}
              >
                {copiedField === `${fieldName}-metadata` ? (
                  <CheckIcon className="h-3 w-3" />
                ) : (
                  <ClipboardIcon className="h-3 w-3" />
                )}
              </button>
              {expandedSections.has('metadata') ? (
                <ChevronDownIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              )}
            </div>
          </div>
        </div>
        
        {expandedSections.has('metadata') && (
          <div className="px-4 pb-4">
            <div className="rounded-lg p-4 border border-violet-200/50 dark:border-violet-700/50 bg-white/50 dark:bg-slate-800/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(cleanMetadata).map(([key, value]) => (
                  <div key={key} className="flex flex-col">
                    <span className="text-xs font-medium text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                      {key.replace('_', ' ')}
                    </span>
                    <span className="text-violet-900 dark:text-violet-100 font-['Inter',sans-serif] text-sm mt-1">
                      {key === 'usage' ? (
                        <div className="space-y-1 text-xs">
                          {Object.entries(value as any).map(([usageKey, usageValue]) => (
                            <div key={usageKey} className="flex justify-between">
                              <span className="text-violet-600 dark:text-violet-400">{usageKey.replace('_', ' ')}:</span>
                              <span className="font-mono">{String(usageValue)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className={key === 'id' ? 'font-mono text-xs' : ''}>
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!data || data === 'No response data') {
    return (
      <div className="bg-white/80 dark:bg-slate-800/80  rounded-2xl shadow-sm border border-white/50 dark:border-slate-700/50 p-8">
        <div className="text-center text-slate-500 dark:text-slate-400">
          No response data available
        </div>
      </div>
    );
  }

  // Handle pending response
  if (data.message === 'Response pending...') {
    return (
      <div className="bg-white/80 dark:bg-slate-800/80  rounded-2xl shadow-sm border border-white/50 dark:border-slate-700/50 p-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-200 border-t-amber-600"></div>
          </div>
          <div className="text-slate-600 dark:text-slate-400 font-medium">
            Response pending...
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            The request is still being processed
          </div>
        </div>
      </div>
    );
  }

  // Handle string data that is not JSON
  if (typeof data === 'string' && data !== 'No response data') {
    return (
      <div className="bg-white/80 dark:bg-slate-800/80  rounded-2xl shadow-sm border border-white/50 dark:border-slate-700/50 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <ComputerDesktopIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Raw response text
                </p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(data, fieldName)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                copiedField === fieldName
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-900/60'
              }`}
            >
              {copiedField === fieldName ? (
                <>
                  <CheckIcon className="h-4 w-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <ClipboardIcon className="h-4 w-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
            <pre className="text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
              {data}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-slate-800/80  rounded-2xl shadow-sm border border-white/50 dark:border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <ComputerDesktopIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Structured response visualization
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* View Mode Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('structured')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'structured'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Structured
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'raw'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Raw JSON
              </button>
            </div>
            <button
              onClick={() => copyToClipboard(jsonString, fieldName)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                copiedField === fieldName
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-900/60'
              }`}
            >
              {copiedField === fieldName ? (
                <>
                  <CheckIcon className="h-4 w-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <ClipboardIcon className="h-4 w-4" />
                  <span>Copy All</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {viewMode === 'structured' && (
          <div className="space-y-4">
            {renderResponseContent()}
            {renderMetadata()}
          </div>
        )}
        
        {viewMode === 'raw' && (
          <ExpandableRawJsonViewer 
            data={data}
            onCopy={handleJsonCopy}
            copiedPath={copiedJsonPath}
          />
        )}
      </div>
    </div>
  );
};

export default ResponseViewer;
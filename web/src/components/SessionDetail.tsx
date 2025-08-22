import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  ClipboardIcon, 
  CheckIcon,
  InformationCircleIcon,
  ClockIcon,
  CpuChipIcon,
  SignalIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  StopIcon,
  WrenchScrewdriverIcon,
  CodeBracketIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import type { SessionRecord, ParsedSession, ToolUse } from '../types';
import RequestRoleViewer from './RequestRoleViewer';
import ResponseViewer from './ResponseViewer';

const SessionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<ParsedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [requestActiveTab, setRequestActiveTab] = useState<'payload' | 'headers'>('payload');
  const [responseActiveTab, setResponseActiveTab] = useState<'payload' | 'headers'>('payload');

  // Parse session record into display format
  const parseSession = (record: SessionRecord): ParsedSession => {
    const created = new Date(record.created_at);
    const completed = record.completed_at ? new Date(record.completed_at) : undefined;
    const duration_ms = completed ? completed.getTime() - created.getTime() : undefined;

    let request: any = {};
    try {
      request = JSON.parse(record.request_json);
    } catch (e) {
      console.warn('Failed to parse request JSON:', e);
    }

    let response: any = undefined;
    if (record.response) {
      try {
        response = JSON.parse(record.response);
      } catch (e) {
        console.warn('Failed to parse response:', e);
        response = record.response; // Keep as raw string if parsing fails
      }
    }

    let tool_use: ToolUse | undefined = undefined;
    if (record.tool_use_json) {
      try {
        tool_use = JSON.parse(record.tool_use_json);
      } catch (e) {
        console.warn('Failed to parse tool_use JSON:', e);
      }
    }

    let http_req_headers: any = undefined;
    if (record.http_req_headers) {
      try {
        http_req_headers = JSON.parse(record.http_req_headers);
      } catch (e) {
        console.warn('Failed to parse http_req_headers JSON:', e);
      }
    }

    let http_resp_headers: any = undefined;
    if (record.http_resp_headers) {
      try {
        http_resp_headers = JSON.parse(record.http_resp_headers);
      } catch (e) {
        console.warn('Failed to parse http_resp_headers JSON:', e);
      }
    }

    return {
      id: record.id,
      request_id: record.request_id,
      model: record.model,
      is_streaming: record.is_streaming,
      token_usage_input: record.token_usage_input,
      token_usage_output: record.token_usage_output,
      stop_reason: record.stop_reason,
      request,
      response,
      tool_use,
      http_req_headers,
      http_resp_headers,
      created_at: created,
      completed_at: completed,
      status: record.status,
      duration_ms,
    };
  };

  useEffect(() => {
    const fetchSession = async () => {
      if (!id) return;
      
      try {
        const response = await fetch(`/api/sessions/${id}`);
        if (!response.ok) {
          throw new Error('Session not found');
        }
        const data: SessionRecord = await response.json();
        setSession(parseSession(data));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id]);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString();
  };

  const formatDuration = (durationMs?: number, status?: string) => {
    if (status === 'pending' || status === 'error' || !durationMs) return '-';
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(1)}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };


  const ToolUseViewer: React.FC<{ toolUse: ToolUse }> = ({ toolUse }) => {
    const inputString = JSON.stringify(toolUse.input, null, 2);
    
    return (
      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-6 border border-orange-200/30 dark:border-orange-800/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
              <WrenchScrewdriverIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tool Call</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Function: <span className="font-mono text-orange-600 dark:text-orange-400">{toolUse.name}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => copyToClipboard(inputString, `tool-${toolUse.id}`)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${
                copiedField === `tool-${toolUse.id}`
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:hover:bg-orange-900/60'
              }`}
            >
              {copiedField === `tool-${toolUse.id}` ? (
                <>
                  <CheckIcon className="h-3 w-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <ClipboardIcon className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <span className={`px-2 py-1 text-xs font-medium rounded-md ${
              toolUse.is_input_complete
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
            }`}>
              {toolUse.is_input_complete ? 'Complete' : 'Incomplete'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tool ID & Name */}
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-white/50 dark:border-gray-700/50">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tool ID</div>
            <div className="font-mono text-sm text-gray-900 dark:text-white break-all">{toolUse.id}</div>
          </div>
          
          {/* Raw Input Size */}
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-white/50 dark:border-gray-700/50">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Input Size</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {toolUse.raw_input.length} chars
            </div>
          </div>
        </div>

        {/* Tool Input */}
        <div className="mt-4">
          <div className="flex items-center space-x-2 mb-3">
            <CodeBracketIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Parsed Input</span>
          </div>
          <div className="relative">
            <pre className="text-sm leading-relaxed p-4 rounded-xl overflow-x-auto whitespace-pre-wrap bg-gray-900 text-gray-100 dark:bg-gray-950 dark:text-gray-200">
              {inputString}
            </pre>
          </div>
        </div>

        {/* Raw Input (collapsed by default) */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
            Show Raw Input ({toolUse.raw_input.length} chars)
          </summary>
          <div className="mt-2">
            <pre className="text-xs leading-relaxed p-3 rounded-lg overflow-x-auto whitespace-pre-wrap bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200 border border-orange-200 dark:border-orange-800">
              {toolUse.raw_input}
            </pre>
          </div>
        </details>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full px-6 py-12">
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="w-full px-6 py-12 space-y-8">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to Sessions</span>
        </Link>
        
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
              <InformationCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">Session Not Found</h3>
              <p className="mt-1 text-red-700 dark:text-red-300">{error || 'The requested session could not be found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-8 space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 rounded-xl shadow-md transition-all duration-200 font-medium border border-white/50 dark:border-gray-700/50"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to Sessions</span>
        </Link>
        
        <div className="flex items-center space-x-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md border border-white/50 dark:border-gray-700/50">
          <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Session Detail</span>
        </div>
      </div>


      {/* Request & Response */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Column */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Request</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(session.status)}`}>
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <CpuChipIcon className="h-3 w-3 text-slate-500" />
                    <span className="text-slate-600 dark:text-slate-400">Model:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{session.model}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {session.is_streaming ? (
                      <SignalIcon className="h-3 w-3 text-slate-500" />
                    ) : (
                      <DocumentTextIcon className="h-3 w-3 text-slate-500" />
                    )}
                    <span className="text-slate-600 dark:text-slate-400">Type:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {session.is_streaming ? 'Stream' : 'Standard'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CpuChipIcon className="h-3 w-3 text-slate-500" />
                    <span className="text-slate-600 dark:text-slate-400">Input:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {session.token_usage_input.toLocaleString()} tokens
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Session: {session.request_id || session.id.slice(0, 8) + '...'} • {formatTimestamp(session.created_at)}
              </div>
            </div>
            
            {/* Request Tab Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setRequestActiveTab('payload')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  requestActiveTab === 'payload'
                    ? 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-slate-100'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/50'
                }`}
              >
                Payload
              </button>
              {session.http_req_headers && (
                <button
                  onClick={() => setRequestActiveTab('headers')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    requestActiveTab === 'headers'
                      ? 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-slate-100'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/50'
                  }`}
                >
                  Headers
                </button>
              )}
            </div>
          </div>
          
          {/* Request Tab Content */}
          <div className="p-6">
            {requestActiveTab === 'payload' && (
              <RequestRoleViewer
                data={session.request} 
                title="Request Payload" 
                fieldName="request"
                onCopy={copyToClipboard}
                copiedField={copiedField}
              />
            )}
            
            {requestActiveTab === 'headers' && session.http_req_headers && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GlobeAltIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Request Headers</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {Object.keys(session.http_req_headers).length} header{Object.keys(session.http_req_headers).length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(session.http_req_headers, null, 2), 'req-headers')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded text-xs transition-all duration-200 ${
                      copiedField === 'req-headers'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {copiedField === 'req-headers' ? (
                      <>
                        <CheckIcon className="h-3 w-3" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <ClipboardIcon className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-3">
                  {Object.entries(session.http_req_headers).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        {key}
                      </span>
                      <span className="text-slate-900 dark:text-slate-100 font-mono text-xs mt-1 break-all">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Response Column */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Response</h3>
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <CpuChipIcon className="h-3 w-3 text-slate-500" />
                    <span className="text-slate-600 dark:text-slate-400">Output:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {session.token_usage_output.toLocaleString()} tokens
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <StopIcon className="h-3 w-3 text-slate-500" />
                    <span className="text-slate-600 dark:text-slate-400">Stop:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{session.stop_reason}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-3 w-3 text-slate-500" />
                    <span className="text-slate-600 dark:text-slate-400">Duration:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{formatDuration(session.duration_ms, session.status)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Completed: { session.status === 'completed' && session.completed_at ? formatTimestamp(session.completed_at) : '-'}
              </div>
            </div>
            
            {/* Response Tab Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setResponseActiveTab('payload')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  responseActiveTab === 'payload'
                    ? 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-slate-100'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/50'
                }`}
              >
                Payload
              </button>
              {session.http_resp_headers && (
                <button
                  onClick={() => setResponseActiveTab('headers')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    responseActiveTab === 'headers'
                      ? 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-slate-100'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/50'
                  }`}
                  >
                    Headers
                  </button>
              )}
            </div>
          </div>
          
          {/* Response Tab Content */}
          <div className="p-6">
            {responseActiveTab === 'payload' && (
              <ResponseViewer 
                data={session.response || (session.status === 'pending' ? { message: 'Response pending...' } : 'No response data')} 
                title="Response Data" 
                fieldName="response"
                onCopy={copyToClipboard}
                copiedField={copiedField}
              />
            )}
            
            {responseActiveTab === 'headers' && session.http_resp_headers && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GlobeAltIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Response Headers</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {Object.keys(session.http_resp_headers).length} header{Object.keys(session.http_resp_headers).length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(session.http_resp_headers, null, 2), 'resp-headers')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded text-xs transition-all duration-200 ${
                      copiedField === 'resp-headers'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {copiedField === 'resp-headers' ? (
                      <>
                        <CheckIcon className="h-3 w-3" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <ClipboardIcon className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-3">
                  {Object.entries(session.http_resp_headers).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        {key}
                      </span>
                      <span className="text-slate-900 dark:text-slate-100 font-mono text-xs mt-1 break-all">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tool Use */}
      {session.tool_use && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tool Usage</h2>
            <p className="text-gray-600 dark:text-gray-400">Function called during this session</p>
          </div>
          <ToolUseViewer toolUse={session.tool_use} />
        </div>
      )}
    </div>
  );
};

export default SessionDetail;
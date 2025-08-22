import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  SignalIcon,
  DocumentTextIcon,
  BoltIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import type { SessionRecord, ParsedSession, SessionsResponse } from '../types';

const SessionList: React.FC = () => {
  const [sessions, setSessions] = useState<ParsedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;

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

    return {
      id: record.id,
      model: record.model,
      is_streaming: record.is_streaming,
      token_usage_input: record.token_usage_input,
      token_usage_output: record.token_usage_output,
      stop_reason: record.stop_reason,
      request,
      response,
      http_status_code: record.http_status_code,
      created_at: created,
      completed_at: completed,
      status: record.status,
      duration_ms,
    };
  };

  const fetchSessions = async (page: number = currentPage, isAutoRefresh: boolean = false) => {
    try {
      // Only show loading state for initial load or manual page changes, not auto-refresh
      if (!isAutoRefresh) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      const response = await fetch(`/api/sessions?page=${page}&limit=${itemsPerPage}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      const data: SessionsResponse = await response.json();
      const parsedSessions = data.sessions.map(parseSession);
      setSessions(parsedSessions);
      setTotalPages(data.total_pages);
      setTotalSessions(data.total);
      setCurrentPage(data.page);
      // Clear any previous errors on successful fetch
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      if (!isAutoRefresh) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchSessions(currentPage);
    
    // Refresh every 5 seconds for session monitoring
    const interval = setInterval(() => fetchSessions(currentPage, true), 5000);
    return () => clearInterval(interval);
  }, [currentPage]);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // 如果是今天，只显示时间
    const isToday = date.toDateString() === now.toDateString();
    
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    
    if (isToday) {
      // 今天只显示时间，24小时格式
      return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    } else {
      // 不是今天显示日期+时间
      return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const formatDuration = (durationMs?: number, status?: string) => {
    if (status === 'pending' || status === 'error' || !durationMs) return '-';
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(1)}s`;
  };

  const getMessageCounts = (session: ParsedSession) => {
    const messages = session.request?.messages || [];
    const counts = {
      user: 0,
      assistant: 0,
      tool_use: 0,
      tool_result: 0,
      system: 0,
      tools: 0,
    };

    // Count system messages - can be string or array
    if (session.request?.system) {
      if (typeof session.request.system === 'string') {
        counts.system = 1;
      } else if (Array.isArray(session.request.system)) {
        counts.system = session.request.system.length;
      }
    }

    // Count available tools
    if (session.request?.tools && Array.isArray(session.request.tools)) {
      counts.tools = session.request.tools.length;
    }

    messages.forEach((message: any) => {
      if (message.role === 'user') {
        counts.user++;
        // Count tool_result in user messages
        if (message.content && Array.isArray(message.content)) {
          message.content.forEach((content: any) => {
            if (content.type === 'tool_result') {
              counts.tool_result++;
            }
          });
        }
      } else if (message.role === 'assistant') {
        counts.assistant++;
        // Count tool_use in assistant messages
        if (message.content && Array.isArray(message.content)) {
          message.content.forEach((content: any) => {
            if (content.type === 'tool_use') {
              counts.tool_use++;
            }
          });
        }
      }
    });

    return counts;
  };

  const getLastUserMessage = (session: ParsedSession): string => {
    const messages = session.request?.messages || [];
    
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === 'user') {
        // Handle different content formats
        if (typeof message.content === 'string') {
          return message.content;
        } else if (Array.isArray(message.content)) {
          // Find text content in array
          const textContent = message.content.find((content: any) => content.type === 'text');
          if (textContent && textContent.text) {
            return textContent.text;
          }
          // Fallback to first content item with text
          for (const content of message.content) {
            if (content.text) return content.text;
            if (typeof content === 'string') return content;
          }
        }
      }
    }
    
    return 'No user message found';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300';
      case 'pending': return 'text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300';
      case 'error': return 'text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-300';
      default: return 'text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getHttpStatusColor = (statusCode?: number) => {
    if (!statusCode) return 'text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-300';
    
    if (statusCode >= 200 && statusCode < 300) {
      return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300';
    } else if (statusCode >= 300 && statusCode < 400) {
      return 'text-blue-700 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-300';
    } else if (statusCode >= 400 && statusCode < 500) {
      return 'text-orange-700 bg-orange-50 dark:bg-orange-950/50 dark:text-orange-300';
    } else if (statusCode >= 500) {
      return 'text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-300';
    }
    return 'text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-300';
  };


  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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

  if (error) {
    return (
      <div className="w-full px-6 py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                <BoltIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">Connection Failed</h3>
              <p className="mt-1 text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-8 space-y-8">
      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
          <div className={`h-2 w-2 rounded-full ${isRefreshing ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></div>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {isRefreshing ? 'Refreshing...' : 'Live • Updates every 5s'}
          </span>
        </div>
      </div>

      {/* Session Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {sessions.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <div className="h-16 w-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No sessions yet</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Start a conversation with the AI gateway to see session monitoring data here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-[calc(100vh-250px)]">
            {/* Fixed Header */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
              <table className="w-full table-fixed min-w-[1140px]">
                <thead>
                  <tr>
                    <th className="w-32 px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="w-48 px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="w-32 px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Status / HTTP
                    </th>
                    <th className="w-24 px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Tokens
                    </th>
                    <th className="w-40 px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Messages
                    </th>
                    <th className="w-64 px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Last User Message
                    </th>
                    <th className="w-32 px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Type / Stop Reason
                    </th>
                    <th className="w-20 px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="w-20 px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
              </table>
            </div>
            
            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto overflow-x-auto">
              <table className="w-full table-fixed min-w-[1140px]">
                <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                {sessions.map((session) => (
                  <tr 
                    key={session.id} 
                    className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-200"
                  >
                    <td className="w-32 px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-blue-400 rounded-full opacity-60"></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                          {formatTimestamp(session.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="w-48 px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">AI</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {session.model}
                        </span>
                      </div>
                    </td>
                    <td className="w-32 px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        </span>
                        <div>
                          {session.http_status_code ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHttpStatusColor(session.http_status_code)}`}>
                              HTTP {session.http_status_code}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500">No HTTP</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="w-24 px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center space-x-1">
                          <span className="text-green-600 dark:text-green-400">↑{session.token_usage_input}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-blue-600 dark:text-blue-400">↓{session.token_usage_output}</span>
                        </div>
                      </div>
                    </td>
                    <td className="w-40 px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-900 dark:text-white space-y-1">
                        {(() => {
                          const counts = getMessageCounts(session);
                          return (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-3">
                                <span className="text-blue-600 dark:text-blue-400 font-medium">
                                  User: {counts.user}
                                </span>
                                <span className="text-purple-600 dark:text-purple-400 font-medium">
                                  Tool Result: {counts.tool_result}
                                </span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  Assistant: {counts.assistant}
                                </span>
                                <span className="text-orange-600 dark:text-orange-400 font-medium">
                                  Tool Use: {counts.tool_use}
                                </span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">
                                  System: {counts.system}
                                </span>
                                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                                  Tools: {counts.tools}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="w-64 px-6 py-4">
                      <div className="relative">
                        {(() => {
                          const lastMessage = getLastUserMessage(session);
                          const isLong = lastMessage.length > 60;
                          const displayMessage = isLong ? lastMessage.slice(0, 60) + '...' : lastMessage;
                          
                          return (
                            <div className="relative group">
                              <div className="text-sm text-gray-900 dark:text-white cursor-pointer leading-relaxed truncate">
                                {displayMessage}
                              </div>
                              {/* 悬浮提示 - 只在悬浮此列时显示 */}
                              <div className="absolute left-0 top-full mt-2 w-96 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                                <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap max-h-40 overflow-y-auto">
                                  {lastMessage}
                                </div>
                                <div className="absolute -top-1 left-4 w-2 h-2 bg-white dark:bg-slate-800 border-l border-t border-slate-200 dark:border-slate-700 transform rotate-45"></div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="w-32 px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          {session.is_streaming ? (
                            <SignalIcon className="h-4 w-4 text-purple-500" />
                          ) : (
                            <DocumentTextIcon className="h-4 w-4 text-blue-500" />
                          )}
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            session.is_streaming
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                          }`}>
                            {session.is_streaming ? 'Stream' : 'Standard'}
                          </span>
                        </div>
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            session.stop_reason === 'end_turn' ? 'text-green-800 bg-green-100 dark:bg-green-900/40 dark:text-green-300' :
                            session.stop_reason === 'max_tokens' ? 'text-orange-800 bg-orange-100 dark:bg-orange-900/40 dark:text-orange-300' :
                            session.stop_reason === 'tool_use' ? 'text-purple-800 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300' :
                            'text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {session.stop_reason || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="w-20 px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {formatDuration(session.duration_ms, session.status)}
                      </span>
                    </td>
                    <td className="w-20 px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        to={`/session/${session.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all duration-200 text-sm font-medium hover:scale-105"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {sessions.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                显示第 {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalSessions)} 条，共 {totalSessions} 条记录
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Previous button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPage <= 1
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                      : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  <span>上一页</span>
                </button>

                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                    const end = Math.min(totalPages, start + maxVisible - 1);
                    
                    // Adjust start if end is at the boundary
                    if (end - start + 1 < maxVisible) {
                      start = Math.max(1, end - maxVisible + 1);
                    }

                    // First page and ellipsis
                    if (start > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => handlePageChange(1)}
                          className="px-3 py-2 rounded-lg text-sm font-medium bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 transition-all duration-200"
                        >
                          1
                        </button>
                      );
                      if (start > 2) {
                        pages.push(<span key="ellipsis1" className="px-2 text-slate-400">...</span>);
                      }
                    }

                    // Visible page range
                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            i === currentPage
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }

                    // Last page and ellipsis
                    if (end < totalPages) {
                      if (end < totalPages - 1) {
                        pages.push(<span key="ellipsis2" className="px-2 text-slate-400">...</span>);
                      }
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => handlePageChange(totalPages)}
                          className="px-3 py-2 rounded-lg text-sm font-medium bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 transition-all duration-200"
                        >
                          {totalPages}
                        </button>
                      );
                    }

                    return pages;
                  })()}
                </div>

                {/* Next button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPage >= totalPages
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                      : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <span>下一页</span>
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionList;
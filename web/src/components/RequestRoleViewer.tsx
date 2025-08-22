import React, { useState, useEffect } from 'react';
import { 
  UserIcon,
  WrenchScrewdriverIcon,
  CogIcon,
  ClipboardIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CodeBracketIcon,
  ShieldCheckIcon,
  ChatBubbleLeftIcon,
  BeakerIcon,
  CheckCircleIcon,
  ComputerDesktopIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import ExpandableRawJsonViewer from './ExpandableRawJsonViewer';
import ImageViewer from './ImageViewer';

interface RequestRoleViewerProps {
  data: any;
  title: string;
  fieldName: string;
  onCopy?: (text: string, fieldName: string) => void;
  copiedField?: string | null;
}

type ViewMode = 'structured' | 'raw';

const RequestRoleViewer: React.FC<RequestRoleViewerProps> = ({ 
  data, 
  title, 
  fieldName, 
  onCopy,
  copiedField 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('structured');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['user', 'system']));
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
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

  const toggleMessage = (messageId: string) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedMessages(newExpanded);
  };

  // Initialize all messages as expanded when data changes
  useEffect(() => {
    if (data?.messages) {
      const messageIds = data.messages.map((_: any, index: number) => `user-message-${index}`);
      setExpandedMessages(new Set(messageIds));
    }
  }, [data]);

  // Get role-specific styling and icon
  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'user':
        return {
          icon: UserIcon,
          bgColor: 'bg-slate-50 dark:bg-slate-900/20',
          borderColor: 'border-slate-200/50 dark:border-slate-800/50',
          badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-200',
          hoverColor: 'hover:bg-slate-100 dark:hover:bg-slate-900/30',
          iconBg: 'bg-slate-200 dark:bg-slate-800',
          iconColor: 'text-slate-700 dark:text-slate-300',
          roleColor: 'text-slate-700 dark:text-slate-300'
        };
      case 'assistant':
        return {
          icon: ComputerDesktopIcon,
          bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
          borderColor: 'border-emerald-200/50 dark:border-emerald-800/50',
          badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
          hoverColor: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30',
          iconBg: 'bg-emerald-200 dark:bg-emerald-800',
          iconColor: 'text-emerald-700 dark:text-emerald-300',
          roleColor: 'text-emerald-700 dark:text-emerald-300'
        };
      case 'system':
        return {
          icon: CpuChipIcon,
          bgColor: 'bg-violet-50 dark:bg-violet-900/20',
          borderColor: 'border-violet-200/50 dark:border-violet-800/50',
          badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
          hoverColor: 'hover:bg-violet-100 dark:hover:bg-violet-900/30',
          iconBg: 'bg-violet-200 dark:bg-violet-800',
          iconColor: 'text-violet-700 dark:text-violet-300',
          roleColor: 'text-violet-700 dark:text-violet-300'
        };
      case 'tool':
        return {
          icon: WrenchScrewdriverIcon,
          bgColor: 'bg-amber-50 dark:bg-amber-900/20',
          borderColor: 'border-amber-200/50 dark:border-amber-800/50',
          badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
          hoverColor: 'hover:bg-amber-100 dark:hover:bg-amber-900/30',
          iconBg: 'bg-amber-200 dark:bg-amber-800',
          iconColor: 'text-amber-700 dark:text-amber-300',
          roleColor: 'text-amber-700 dark:text-amber-300'
        };
      default:
        return {
          icon: ExclamationTriangleIcon,
          bgColor: 'bg-slate-50 dark:bg-slate-800/50',
          borderColor: 'border-slate-200/50 dark:border-slate-700/50',
          badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
          hoverColor: 'hover:bg-slate-100 dark:hover:bg-slate-800/70',
          iconBg: 'bg-slate-200 dark:bg-slate-700',
          iconColor: 'text-slate-700 dark:text-slate-300',
          roleColor: 'text-slate-700 dark:text-slate-300'
        };
    }
  };

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
    if (typeof content === 'string') {
      return (
        <div key={index} className="rounded-xl p-4 border border-slate-300 dark:border-slate-600 shadow-sm">
          <div className="whitespace-pre-wrap text-sm font-['Inter',sans-serif] text-slate-900 dark:text-slate-100 leading-relaxed">
            {content}
          </div>
        </div>
      );
    }

    if (content.type === 'text') {
      return (
        <div key={index} className="rounded-xl p-4 border border-slate-300 dark:border-slate-600 shadow-sm bg-white/50 dark:bg-slate-800/30">
          <div className="flex items-start space-x-3 mb-3">
            <div className="h-6 w-6 bg-slate-100 dark:bg-slate-900/40 rounded-full flex items-center justify-center flex-shrink-0">
              <ChatBubbleLeftIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
            </div>
            <div className="flex items-center space-x-2 flex-1">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-['Inter',sans-serif]">
                Text Content {contentNumber !== undefined ? `#${contentNumber + 1}` : ''}
              </span>
              {content.cache_control && (
                <span className="text-xs bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
                  {content.cache_control.type}
                </span>
              )}
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
        <div key={index} className="rounded-xl p-4 border border-violet-200 dark:border-violet-600 shadow-sm bg-violet-50 dark:bg-violet-900/20">
          <div className="flex items-start space-x-3 mb-3">
            <div className="h-6 w-6 bg-violet-100 dark:bg-violet-800 rounded-full flex items-center justify-center flex-shrink-0">
              <LightBulbIcon className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex items-center space-x-2 flex-1">
              <span className="text-sm font-semibold text-violet-700 dark:text-violet-300 font-['Inter',sans-serif]">
                Thinking Process {contentNumber !== undefined ? `#${contentNumber + 1}` : ''}
              </span>
              {content.signature && (
                <span className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 px-2 py-0.5 rounded-full font-medium">
                  Signed
                </span>
              )}
              {content.cache_control && (
                <span className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 px-2 py-0.5 rounded-full font-medium">
                  {content.cache_control.type}
                </span>
              )}
            </div>
          </div>
          <div className="whitespace-pre-wrap text-sm font-['Inter',sans-serif] text-slate-900 dark:text-slate-100 leading-relaxed pl-9 bg-violet-50/50 dark:bg-violet-900/20 p-3 rounded-lg border border-violet-200 dark:border-violet-700">
            {content.thinking}
          </div>
          {content.signature && (
            <div className="mt-3 pl-9">
              <details className="text-xs">
                <summary className="cursor-pointer font-medium text-violet-700 dark:text-violet-300 hover:text-violet-900 dark:hover:text-violet-100">
                  Cryptographic Signature
                </summary>
                <div className="mt-2 bg-slate-900 text-slate-100 dark:bg-slate-950 dark:text-slate-200 p-2 rounded overflow-x-auto font-mono text-xs break-all">
                  {content.signature}
                </div>
              </details>
            </div>
          )}
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

    if (content.type === 'tool_result') {
      return (
        <div key={index} className="rounded-xl p-4 border border-emerald-300 dark:border-emerald-600 shadow-sm bg-emerald-50/50 dark:bg-emerald-900/20">
          <div className="flex items-start space-x-3 mb-3">
            <div className="h-6 w-6 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 font-['Inter',sans-serif]">Tool Result</span>
                {content.tool_use_id && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                    → {content.tool_use_id}
                  </span>
                )}
              </div>
              {content.is_error && (
                <div className="text-xs text-red-600 dark:text-red-400 mb-1 font-medium">
                  Error occurred during tool execution
                </div>
              )}
            </div>
          </div>
          <div className="whitespace-pre-wrap text-sm font-['Inter',sans-serif] text-slate-900 dark:text-slate-100 leading-relaxed rounded-lg p-3 border border-slate-200/50 dark:border-slate-700/50 ml-9">
            {typeof content.content === 'string' ? content.content : JSON.stringify(content.content, null, 2)}
          </div>
        </div>
      );
    }

    if (content.type === 'image') {
      return (
        <ImageViewer
          key={index}
          content={content}
          index={index}
          contentNumber={contentNumber}
          onCopy={copyToClipboard}
          copiedField={copiedField}
        />
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

  const renderUserMessages = () => {
    if (!data.messages || !Array.isArray(data.messages)) return null;

    return (
      <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50">
        <div 
          className="px-4 py-3 cursor-pointer"
          onClick={() => toggleSection('user')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">User Messages</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {data.messages.length} message{data.messages.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(JSON.stringify(data.messages, null, 2), `${fieldName}-user-messages`);
                }}
                className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  copiedField === `${fieldName}-user-messages`
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {copiedField === `${fieldName}-user-messages` ? (
                  <CheckIcon className="h-3 w-3" />
                ) : (
                  <ClipboardIcon className="h-3 w-3" />
                )}
              </button>
              {expandedSections.has('user') ? (
                <ChevronDownIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              )}
            </div>
          </div>
        </div>
        
        {expandedSections.has('user') && (
          <div className="px-4 pb-4 space-y-3">
            {data.messages.map((message: any, index: number) => {
              const messageId = `user-message-${index}`;
              const isMessageExpanded = expandedMessages.has(messageId);
              const roleConfig = getRoleConfig(message.role);
              const RoleIcon = roleConfig.icon;
              
              return (
                <div key={index} className={`rounded-lg border ${roleConfig.borderColor} ${roleConfig.bgColor}`}>
                  <div 
                    className={`flex items-center justify-between p-3 cursor-pointer ${roleConfig.hoverColor} transition-colors rounded-t-lg`}
                    onClick={() => toggleMessage(messageId)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${roleConfig.iconBg}`}>
                        <RoleIcon className={`h-4 w-4 ${roleConfig.iconColor}`} />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${roleConfig.badgeColor}`}>
                          Message #{index + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Role: <span className={`font-bold ${roleConfig.roleColor}`}>{message.role}</span>
                        </span>
                        {Array.isArray(message.content) && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            ({message.content.length} content{message.content.length !== 1 ? 's' : ''})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(JSON.stringify(message, null, 2), `${fieldName}-message-${index}`);
                        }}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                          copiedField === `${fieldName}-message-${index}`
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                        }`}
                      >
                        {copiedField === `${fieldName}-message-${index}` ? (
                          <CheckIcon className="h-3 w-3" />
                        ) : (
                          <ClipboardIcon className="h-3 w-3" />
                        )}
                      </button>
                      {isMessageExpanded ? (
                        <ChevronDownIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      )}
                    </div>
                  </div>
                  
                  {isMessageExpanded && (
                    <div className={`px-3 pb-3 space-y-3 border-t ${roleConfig.borderColor}`}>
                      {Array.isArray(message.content) 
                        ? (() => {
                            let textContentCount = 0;
                            return message.content.map((content: any, contentIndex: number) => {
                              const isTextContent = content.type === 'text' || typeof content === 'string';
                              const currentTextIndex = isTextContent ? textContentCount++ : undefined;
                              return renderContentBlock(content, contentIndex, currentTextIndex);
                            });
                          })()
                        : renderContentBlock(message.content, 0, typeof message.content === 'string' || message.content?.type === 'text' ? 0 : undefined)
                      }
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

  const renderSystemMessages = () => {
    if (!data.system || !Array.isArray(data.system)) return null;

    return (
      <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50">
        <div 
          className="px-4 py-3 cursor-pointer"
          onClick={() => toggleSection('system')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">System Messages</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {data.system.length} instruction{data.system.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(JSON.stringify(data.system, null, 2), `${fieldName}-system-messages`);
                }}
                className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  copiedField === `${fieldName}-system-messages`
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {copiedField === `${fieldName}-system-messages` ? (
                  <CheckIcon className="h-3 w-3" />
                ) : (
                  <ClipboardIcon className="h-3 w-3" />
                )}
              </button>
              {expandedSections.has('system') ? (
                <ChevronDownIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              )}
            </div>
          </div>
        </div>
        
        {expandedSections.has('system') && (
          <div className="px-4 pb-4 space-y-2">
            {data.system.map((systemMsg: any, index: number) => (
              <div key={index} className="rounded-lg p-3 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Type: {systemMsg.type || 'text'}
                  </span>
                  {systemMsg.cache_control && (
                    <span className="text-xs bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
                      {systemMsg.cache_control.type}
                    </span>
                  )}
                </div>
                <div className="whitespace-pre-wrap text-sm text-slate-900 dark:text-slate-100 leading-relaxed rounded p-2 border border-slate-200/30 dark:border-slate-700/30">
                  {systemMsg.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTools = () => {
    if (!data.tools || !Array.isArray(data.tools)) return null;

    return (
      <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50">
        <div 
          className="px-4 py-3 cursor-pointer"
          onClick={() => toggleSection('tools')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                <WrenchScrewdriverIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Available Tools</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {data.tools.length} tool{data.tools.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(JSON.stringify(data.tools, null, 2), `${fieldName}-tools`);
                }}
                className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  copiedField === `${fieldName}-tools`
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {copiedField === `${fieldName}-tools` ? (
                  <CheckIcon className="h-3 w-3" />
                ) : (
                  <ClipboardIcon className="h-3 w-3" />
                )}
              </button>
              {expandedSections.has('tools') ? (
                <ChevronDownIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              )}
            </div>
          </div>
        </div>
        
        {expandedSections.has('tools') && (
          <div className="px-4 pb-4 space-y-3">
            {data.tools.map((tool: any, index: number) => (
              <div key={index} className="rounded-lg p-3 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {tool.name}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(tool, null, 2), `${fieldName}-tool-${index}`)}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      copiedField === `${fieldName}-tool-${index}`
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300'
                    }`}
                  >
                    {copiedField === `${fieldName}-tool-${index}` ? (
                      <CheckIcon className="h-3 w-3" />
                    ) : (
                      <ClipboardIcon className="h-3 w-3" />
                    )}
                  </button>
                </div>
                
                {tool.description && (
                  <p className="text-xs text-slate-800 dark:text-slate-200 mb-3 leading-relaxed rounded p-2 border border-slate-200/30 dark:border-slate-700/30">
                    {tool.description}
                  </p>
                )}
                
                {tool.input_schema && (
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100">
                      Schema ({Object.keys(tool.input_schema.properties || {}).length} properties)
                    </summary>
                    <div className="mt-2 bg-slate-900 text-slate-100 dark:bg-slate-950 dark:text-slate-200 p-2 rounded overflow-x-auto">
                      <pre>{JSON.stringify(tool.input_schema, null, 2)}</pre>
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderConfiguration = () => {
    const config = {
      model: data.model,
      temperature: data.temperature,
      max_tokens: data.max_tokens,
      stream: data.stream,
      ...(data.metadata && { metadata: data.metadata })
    };

    // Remove undefined values
    const cleanConfig = Object.fromEntries(
      Object.entries(config).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(cleanConfig).length === 0) return null;

    return (
      <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50">
        <div 
          className="px-4 py-3 cursor-pointer"
          onClick={() => toggleSection('config')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                <CogIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Configuration</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Request parameters and settings
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(JSON.stringify(cleanConfig, null, 2), `${fieldName}-config`);
                }}
                className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  copiedField === `${fieldName}-config`
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {copiedField === `${fieldName}-config` ? (
                  <CheckIcon className="h-3 w-3" />
                ) : (
                  <ClipboardIcon className="h-3 w-3" />
                )}
              </button>
              {expandedSections.has('config') ? (
                <ChevronDownIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              )}
            </div>
          </div>
        </div>
        
        {expandedSections.has('config') && (
          <div className="px-4 pb-4">
            <div className="rounded-lg p-3 border border-slate-200/50 dark:border-slate-700/50">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(cleanConfig).map(([key, value]) => (
                  <div key={key} className="flex flex-col">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {key}
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 font-mono text-xs mt-0.5">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
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

  if (!data) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
        <div className="text-center text-slate-500 dark:text-slate-400">
          No request data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
              <CodeBracketIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Role-based visualization
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
            {renderUserMessages()}
            {renderSystemMessages()}
            {renderTools()}
            {renderConfiguration()}
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

export default RequestRoleViewer;
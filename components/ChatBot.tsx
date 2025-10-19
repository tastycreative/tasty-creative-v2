"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  Send,
  X,
  Minimize2,
  Maximize2,
  Bot,
  User,
  Loader2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSession } from "next-auth/react";

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const ChatBot: React.FC = () => {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const userRole = (session?.user as any)?.role;
  const isGuest = typeof userRole === 'string' && userRole.toUpperCase() === 'GUEST';
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Load conversation on mount
  useEffect(() => {
    if (isOpen && !sessionId) {
      loadOrCreateConversation();
    }
  }, [isOpen]);

  const loadOrCreateConversation = async () => {
    setIsInitialLoading(true);
    try {
      // Try to load the most recent conversation from localStorage
      const savedSessionId = localStorage.getItem('chatbot-session-id');
      
      if (savedSessionId) {
        const response = await fetch(`/api/chatbot?action=load&sessionId=${savedSessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.sessionId && data.messages) {
            setSessionId(data.sessionId);
            setMessages(data.messages.map((msg: any, index: number) => ({
              id: (index + 1).toString(),
              type: msg.role === 'user' ? 'user' : 'bot',
              content: msg.content,
              timestamp: new Date(msg.timestamp || Date.now())
            })));
            return;
          }
        }
      }
      
      // If no existing session found, start new conversation
      await startNewConversation();
    } catch (error) {
      console.error('Error loading conversation:', error);
      await startNewConversation();
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const startNewConversation = async () => {
    try {
      const response = await fetch('/api/chatbot?action=new');
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        localStorage.setItem('chatbot-session-id', data.sessionId);
        setMessages(data.messages.map((msg: any, index: number) => ({
          id: (index + 1).toString(),
          type: msg.role === 'user' ? 'user' : 'bot',
          content: msg.content,
          timestamp: new Date(msg.timestamp || Date.now())
        })));
      }
    } catch (error) {
      console.error('Error starting new conversation:', error);
      // Fallback to default message
      setMessages([{
        id: '1',
        type: 'bot',
        content: 'Hello! I\'m your Tasty Creative assistant. I can help you with information about client models, content details, and more. What would you like to know?',
        timestamp: new Date()
      }]);
    }
  };

  const endConversation = async () => {
    if (!sessionId) return;
    
    try {
      console.log('🗑️ Starting new conversation - deleting current session:', sessionId);
      
      const response = await fetch('/api/chatbot', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
      
      const result = await response.json();
      console.log('✅ Conversation deletion response:', result);
      
      // Reset state
      setSessionId(null);
      setMessages([]);
      setInputValue('');
      localStorage.removeItem('chatbot-session-id');
      
      // Start fresh conversation
      await startNewConversation();
    } catch (error) {
      console.error('Error ending conversation:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: sessionId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.response || 'Sorry, I couldn\'t process your request.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Sorry, I\'m having trouble responding right now. Please try again later.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Loading skeleton component
  const MessageSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      {/* Bot message skeleton */}
      <div className="flex justify-start">
        <div className="w-[85%] p-4 rounded-2xl bg-gray-200 dark:bg-gray-700 rounded-bl-md">
          <div className="flex items-start space-x-2">
            <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0 mt-0.5"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* User message skeleton */}
      <div className="flex justify-end">
        <div className="w-[85%] p-4 rounded-2xl bg-gray-200 dark:bg-gray-700 rounded-br-md">
          <div className="flex items-start space-x-2">
            <div className="flex-1">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/5 mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
            <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0 mt-0.5"></div>
          </div>
        </div>
      </div>
      
      {/* Another bot message skeleton */}
      <div className="flex justify-start">
        <div className="w-[85%] p-4 rounded-2xl bg-gray-200 dark:bg-gray-700 rounded-bl-md">
          <div className="flex items-start space-x-2">
            <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0 mt-0.5"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6 mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/5"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated || isGuest) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-16 w-16 rounded-full shadow-2xl bg-pink-600 hover:bg-pink-700 text-white border-0 hover:scale-110 transition-all duration-300 shadow-pink-500/30"
        >
          <MessageCircle className="h-7 w-7" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
  <Card className={`transition-all gap-2 duration-300 py-0 pb-0 shadow-2xl overflow-hidden isolate backdrop-blur-none ${
        isMinimized 
          ? 'w-80 h-16' 
          : 'w-[420px] h-[600px]'
  } !bg-[oklch(1_0_0)] dark:!bg-[oklch(0.205_0_0)] border border-pink-200 dark:border-pink-900`}>
        
        {/* Header */}
        <CardHeader className={`flex flex-row items-center justify-between bg-pink-600 text-white rounded-t-lg ${
          isMinimized ? 'p-2 px-3' : 'px-4 py-3'
        }`}>
          <CardTitle className={`font-bold flex items-center ${
            isMinimized ? 'text-base' : 'text-xl'
          }`}>
            <div className="relative mr-3">
              <Bot className={`${isMinimized ? 'h-5 w-5' : 'h-6 w-6'} text-pink-200`} />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-white">
              Tasty Assistant
            </span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={endConversation}
              title="Start New Conversation"
              className="text-pink-100 hover:bg-white/20 hover:text-white h-9 w-9 p-0 rounded-full transition-all duration-200 hover:scale-110"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-pink-100 hover:bg-white/20 hover:text-white h-9 w-9 p-0 rounded-full transition-all duration-200 hover:scale-110"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-pink-100 hover:bg-white/20 hover:text-white h-9 w-9 p-0 rounded-full transition-all duration-200 hover:scale-110"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Chat Content - only show when not minimized */}
        {!isMinimized && (
          <>

            {/* Messages */}
            <CardContent className="p-0 flex-1 flex flex-col h-[560px] bg-[oklch(1_0_0)] dark:bg-[oklch(0.205_0_0)]">
              <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 bg-[oklch(1_0_0)] dark:bg-[oklch(0.205_0_0)]">
                <div className="space-y-4">
                  {isInitialLoading ? (
                    <MessageSkeleton />
                  ) : (
                    <>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] p-4 rounded-2xl shadow-lg ${
                              message.type === 'user'
                                ? 'bg-pink-600 text-white rounded-br-md'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md border border-pink-100 dark:border-pink-900'
                            }`}
                          >
                            <div className="flex items-start space-x-2">
                              {message.type === 'bot' && (
                                <Bot className="h-4 w-4 mt-0.5 flex-shrink-0 text-pink-500 dark:text-pink-400" />
                              )}
                              {message.type === 'user' && (
                                <User className="h-4 w-4 mt-0.5 flex-shrink-0 text-pink-100" />
                              )}
                              <div className="flex-1">
                                <div className="text-sm prose prose-sm max-w-none">
                                  <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                                      ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                      ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                      li: ({children}) => <li className="text-sm">{children}</li>,
                                      strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                                      em: ({children}) => <em className="italic">{children}</em>,
                                      code: ({children}) => <code className="bg-pink-100 dark:bg-pink-900/30 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                                      pre: ({children}) => <pre className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded text-xs font-mono overflow-x-auto mb-2">{children}</pre>,
                                      h1: ({children}) => <h1 className="text-base font-bold mb-2">{children}</h1>,
                                      h2: ({children}) => <h2 className="text-sm font-semibold mb-2">{children}</h2>,
                                      h3: ({children}) => <h3 className="text-sm font-medium mb-1">{children}</h3>,
                                    }}
                                  >
                                    {message.content}
                                  </ReactMarkdown>
                                </div>
                                <span className={`text-xs mt-1 block ${
                                  message.type === 'user' 
                                    ? 'text-pink-100' 
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {formatTime(message.timestamp)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="max-w-[85%] p-4 rounded-2xl bg-white dark:bg-gray-800 rounded-bl-md border border-pink-100 dark:border-pink-900">
                            <div className="flex items-center space-x-2">
                              <Bot className="h-4 w-4 text-pink-500 dark:text-pink-400" />
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* New Conversation Button - appears above input when conversation has messages */}
              {messages.length > 1 && (
                <div className="px-4 py-3 border-t border-pink-200 dark:border-pink-900 bg-pink-50 dark:bg-gray-800">
                  <div className="flex justify-center">
                    <Button
                      onClick={endConversation}
                      size="sm"
                      variant="outline"
                      className="text-xs px-4 py-2 h-8 border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/20 rounded-full transition-all duration-200 hover:scale-105 font-medium"
                    >
                      <RotateCcw className="h-3 w-3 mr-2" />
                      Start New Conversation
                    </Button>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-pink-200 dark:border-pink-900 bg-white dark:bg-gray-900">
                <div className="flex space-x-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me about clients, content details, birthdays, or anything else..."
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="bg-pink-600 hover:bg-pink-700 text-white transition-all duration-200 rounded-lg"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default ChatBot;
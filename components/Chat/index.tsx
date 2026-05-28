import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Hash, Users, Shield, Award, Search, Sparkles, ChevronLeft } from 'lucide-react';
import { ALL_MEMBERS, getMemberByUsername } from '../../data/members';
import { TeamChatMessage } from '../../types';

interface TeamChatProps {
  currentUser: string;
}

export const TeamChat: React.FC<TeamChatProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<TeamChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'group' | 'dm'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string>('team');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Mobile responsive view toggle: 'contacts' list or active 'chat' thread
  const [mobileView, setMobileView] = useState<'contacts' | 'chat'>('contacts');

  // Unread messages state, stored in LocalStorage by currentUser
  const [lastRead, setLastRead] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(`bazmanager_chat_last_read_${currentUser}`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to format conversation ID for a DM (alphabetical sorting to match both directions)
  const getDmConversationId = (userA: string, userB: string) => {
    const sorted = [userA, userB].sort();
    return `dm_${sorted[0]}_${sorted[1]}`;
  };

  // Fetch messages from Redis
  const fetchMessages = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch('/api/crud?type=chat');
      const data = await res.json();
      if (data.success && data.chat) {
        setMessages(data.chat);
      }
    } catch (err) {
      console.error('Erro ao buscar mensagens do chat:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // Poll for messages every 6 seconds
  useEffect(() => {
    fetchMessages(true);

    pollingRef.current = setInterval(() => {
      fetchMessages(false);
    }, 6000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedConversationId, mobileView]);

  // Mark active conversation as read
  const markAsRead = (convId: string, timestamp?: string) => {
    const time = timestamp || new Date().toISOString();
    setLastRead(prev => {
      const updated = { ...prev, [convId]: time };
      localStorage.setItem(`bazmanager_chat_last_read_${currentUser}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Check unread count for a conversation
  const getUnreadCount = (convId: string) => {
    const lastReadTime = lastRead[convId];
    const incomingMessages = messages.filter(m => m.conversationId === convId && m.sender !== currentUser);
    if (!lastReadTime) return incomingMessages.length; 
    
    return incomingMessages.filter(m => new Date(m.timestamp) > new Date(lastReadTime)).length;
  };

  // Watch for messages and selection changes to automatically clear unread messages
  useEffect(() => {
    if (selectedConversationId && messages.length > 0) {
      const lastMsg = [...messages]
        .reverse()
        .find(m => m.conversationId === selectedConversationId);
      if (lastMsg) {
        markAsRead(selectedConversationId, lastMsg.timestamp);
      } else {
        markAsRead(selectedConversationId);
      }
    }
  }, [messages, selectedConversationId]);

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    const newMessage: TeamChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender: currentUser,
      text: inputText.trim(),
      timestamp: new Date().toISOString(),
      conversationId: selectedConversationId,
    };

    const updatedMessages = [...messages, newMessage];

    try {
      setMessages(updatedMessages);
      setInputText('');

      const res = await fetch('/api/crud?type=chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat: updatedMessages }),
      });
      
      if (!res.ok) {
        throw new Error('Falha ao enviar mensagem');
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      fetchMessages(false);
    } finally {
      setIsSending(false);
    }
  };

  // Get recipient profile for a DM conversation
  const getDmRecipient = (convId: string) => {
    if (!convId.startsWith('dm_')) return null;
    const parts = convId.replace('dm_', '').split('_');
    const recipientUsername = parts.find(u => u !== currentUser);
    return recipientUsername ? getMemberByUsername(recipientUsername) : null;
  };

  // Format date/time
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const formatDateLabel = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return 'Hoje';
      }
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Ontem';
      }
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Helper to parse and render text with clickable links
  const renderMessageContent = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, idx) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={idx}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline font-bold transition-all duration-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.2)] break-all hover:text-white"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Filter members list based on search and selected tab
  const filteredMembers = ALL_MEMBERS.filter(m => {
    if (m.username === currentUser) return false;
    
    const searchMatch = m.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (m.fullName && m.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!searchMatch) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'group') return false; 
    if (activeTab === 'dm') return true;
    
    if (activeTab === 'unread') {
      const convId = getDmConversationId(currentUser, m.username);
      return getUnreadCount(convId) > 0;
    }
    
    return true;
  });

  const isGroupChat = selectedConversationId === 'team';
  const recipient = isGroupChat ? null : getDmRecipient(selectedConversationId);
  const activeMessages = messages.filter(m => m.conversationId === selectedConversationId);

  // Helper to switch conversations and toggle mobile view
  const handleSelectConversation = (convId: string) => {
    setSelectedConversationId(convId);
    setMobileView('chat');
  };

  return (
    <div className="flex h-[calc(100vh-14rem)] sm:h-[calc(100vh-12rem)] min-h-[480px] w-full rounded-2xl border border-white/5 bg-primary/20 backdrop-blur-3xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
      
      {/* 1. Left Contact Panel */}
      <div 
        className={`${
          mobileView === 'contacts' ? 'flex w-full' : 'hidden'
        } sm:flex sm:w-80 border-r border-white/5 flex-col bg-primary/45 shrink-0`}
      >
        
        {/* Search & Tabs */}
        <div className="p-4 space-y-3 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white/[0.03] border border-white/5 text-white placeholder-text-muted focus:outline-none focus:border-accent-primary transition-all duration-300"
            />
          </div>
          
          {/* Quick Filters */}
          <div className="flex bg-white/[0.02] p-1 rounded-lg border border-white/5 gap-0.5">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 text-[9px] uppercase tracking-wider font-black rounded-md transition-all duration-300 ${
                activeTab === 'all' ? 'bg-accent-primary/25 text-white shadow-glow-primary border border-accent-primary/30' : 'text-text-muted hover:text-white'
              }`}
            >
              Tudo
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`flex-1 py-1.5 text-[9px] uppercase tracking-wider font-black rounded-md transition-all duration-300 flex items-center justify-center gap-1 ${
                activeTab === 'unread' ? 'bg-accent-primary/25 text-white shadow-glow-primary border border-accent-primary/30' : 'text-text-muted hover:text-white'
              }`}
            >
              Não Lidas
            </button>
            <button
              onClick={() => setActiveTab('group')}
              className={`flex-1 py-1.5 text-[9px] uppercase tracking-wider font-black rounded-md transition-all duration-300 ${
                activeTab === 'group' ? 'bg-accent-primary/25 text-white shadow-glow-primary border border-accent-primary/30' : 'text-text-muted hover:text-white'
              }`}
            >
              Grupo
            </button>
            <button
              onClick={() => setActiveTab('dm')}
              className={`flex-1 py-1.5 text-[9px] uppercase tracking-wider font-black rounded-md transition-all duration-300 ${
                activeTab === 'dm' ? 'bg-accent-primary/25 text-white shadow-glow-primary border border-accent-primary/30' : 'text-text-muted hover:text-white'
              }`}
            >
              DMs
            </button>
          </div>
        </div>

        {/* Contacts & Channels List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          
          {/* # Geral (Group) Channel */}
          {(activeTab !== 'dm' && (activeTab !== 'unread' || getUnreadCount('team') > 0)) && (
            <button
              onClick={() => handleSelectConversation('team')}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-500 border group text-left ${
                selectedConversationId === 'team'
                  ? 'bg-white/[0.04] border-accent-primary/30 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                  : 'bg-transparent border-transparent text-text-secondary hover:bg-white/[0.01] hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 ${
                  selectedConversationId === 'team'
                    ? 'bg-gradient-to-br from-accent-primary/20 to-accent-tertiary/20 border-accent-primary/30 shadow-glow-primary'
                    : 'bg-white/[0.02] border-white/5'
                }`}>
                  <Hash className={`w-5 h-5 ${selectedConversationId === 'team' ? 'text-accent-primary' : 'text-text-muted group-hover:text-white'}`} />
                </div>
                <div>
                  <div className="font-bold text-sm text-text-primary"># Geral (Equipe Toda)</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider font-black flex items-center gap-1">
                    <Users className="w-3 h-3" /> canal de equipe
                  </div>
                </div>
              </div>
              
              {getUnreadCount('team') > 0 && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent-primary/20 text-accent-primary border border-accent-primary/30 font-black animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                  {getUnreadCount('team')}
                </span>
              )}
            </button>
          )}

          {/* DM Separator */}
          {activeTab !== 'group' && (
            <>
              {filteredMembers.length > 0 && (
                <div className="px-3 pt-4 pb-2 text-[9px] uppercase tracking-widest font-black text-text-muted flex items-center gap-2">
                  <span>Mensagens Diretas</span>
                  <div className="h-[1px] bg-white/5 flex-1"></div>
                </div>
              )}

              {filteredMembers.map(member => {
                const convId = getDmConversationId(currentUser, member.username);
                const isSelected = selectedConversationId === convId;
                const unreadCount = getUnreadCount(convId);
                const isTechnician = member.role === 'technician';

                const initials = member.displayName.substring(0, 2).toUpperCase();

                return (
                  <button
                    key={member.username}
                    onClick={() => handleSelectConversation(convId)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-500 border group text-left ${
                      isSelected
                        ? 'bg-white/[0.04] border-accent-primary/30 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                        : 'bg-transparent border-transparent text-text-secondary hover:bg-white/[0.01] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border transition-all duration-500 ${
                          isSelected
                            ? 'bg-gradient-to-br from-accent-primary/20 to-accent-tertiary/20 border-accent-primary/30 text-white shadow-glow-primary'
                            : 'bg-white/[0.02] border-white/5 text-text-secondary group-hover:text-white group-hover:border-white/10'
                        }`}>
                          {initials}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#09090b] shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-text-primary truncate flex items-center gap-1.5">
                          {member.displayName}
                          {isTechnician && (
                            <span className="text-[8px] px-1.5 py-0.25 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 font-black uppercase">Téc</span>
                          )}
                        </div>
                        <div className="text-[10px] text-text-muted truncate flex items-center gap-1">
                          {member.awardFocus ? (
                            <>
                              <Award className="w-3 h-3 text-accent-primary" /> {member.awardFocus}
                            </>
                          ) : (
                            <>
                              <Shield className="w-3 h-3 text-orange-400" /> Mentor
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {unreadCount > 0 && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent-primary/20 text-accent-primary border border-accent-primary/30 font-black shrink-0 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}

          {activeTab === 'unread' && filteredMembers.length === 0 && getUnreadCount('team') === 0 && (
            <div className="p-8 text-center text-text-muted text-xs space-y-2">
              <p className="font-bold">Nenhuma mensagem não lida!</p>
              <p className="text-[10px] opacity-60">Excelente trabalho mantendo suas comunicações atualizadas.</p>
            </div>
          )}

        </div>
      </div>

      {/* 2. Main Chat Thread Panel */}
      <div 
        className={`${
          mobileView === 'chat' ? 'flex flex-1' : 'hidden'
        } sm:flex flex-col bg-transparent`}
      >
        
        {/* Header bar */}
        <div className="h-16 border-b border-white/5 px-4 sm:px-6 flex items-center bg-primary/20 select-none">
          
          {/* Back button on mobile view */}
          <button
            onClick={() => setMobileView('contacts')}
            className="sm:hidden mr-3 p-2 rounded-xl border border-white/5 bg-white/[0.02] text-text-secondary hover:text-white flex items-center justify-center active:scale-95 transition-all duration-300"
            title="Voltar para contatos"
          >
            <ChevronLeft className="w-5 h-5 text-accent-primary" />
          </button>

          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {isGroupChat ? (
              <>
                <div className="w-9 h-9 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shrink-0">
                  <Hash className="w-5 h-5 text-accent-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-sm text-white tracking-wide truncate"># GERAL (EQUIPE TODA)</h3>
                  <p className="text-[10px] text-text-muted truncate">Avisos e coordenação do time</p>
                </div>
              </>
            ) : recipient ? (
              <>
                <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center font-black text-sm text-accent-primary shrink-0">
                  {recipient.displayName.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-sm text-white tracking-wide uppercase truncate">{recipient.fullName || recipient.displayName}</h3>
                  <p className="text-[10px] text-text-muted truncate flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-accent-primary" />
                    Foco: <span className="text-text-primary truncate max-w-[100px] sm:max-w-none">{recipient.awardFocus || 'Mentoria Geral'}</span>
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-text-muted">Selecione uma conversa</p>
            )}
          </div>
        </div>

        {/* Message Thread Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-black/10">
          {isLoading ? (
            <div className="h-full w-full flex flex-col items-center justify-center space-y-2">
              <div className="w-8 h-8 rounded-lg border-2 border-accent-primary border-t-transparent animate-spin"></div>
              <p className="text-xs text-text-muted">Sincronizando comunicações...</p>
            </div>
          ) : activeMessages.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <MessageSquare className="w-12 h-12 text-text-muted opacity-20" />
              <div>
                <p className="font-black text-sm text-text-secondary uppercase tracking-wider">Inicie a transmissão</p>
                <p className="text-xs text-text-muted max-w-xs mt-1">Este canal está seguro para comunicações internas.</p>
              </div>
            </div>
          ) : (
            activeMessages.map((msg, index) => {
              const isOwnMessage = msg.sender === currentUser;
              const senderObj = getMemberByUsername(msg.sender);
              const showSenderName = !isOwnMessage && (index === 0 || activeMessages[index - 1].sender !== msg.sender);
              
              const showDateSeparator = index === 0 || 
                formatDateLabel(activeMessages[index - 1].timestamp) !== formatDateLabel(msg.timestamp);

              return (
                <div key={msg.id} className="space-y-1">
                  
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-4">
                      <div className="h-[1px] bg-white/5 flex-grow max-w-[60px] sm:max-w-[100px]"></div>
                      <span className="text-[9px] uppercase tracking-widest font-black text-text-muted px-3 sm:px-4">
                        {formatDateLabel(msg.timestamp)}
                      </span>
                      <div className="h-[1px] bg-white/5 flex-grow max-w-[60px] sm:max-w-[100px]"></div>
                    </div>
                  )}

                  <div className={`flex w-full ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-end space-x-2 max-w-[85%] sm:max-w-[70%] ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                      
                      <div className="space-y-0.5 max-w-full">
                        
                        {showSenderName && (
                          <div className="text-[10px] font-bold text-accent-primary pl-2 uppercase tracking-wide">
                            {senderObj?.displayName || msg.sender}
                          </div>
                        )}

                        <div
                          className={`px-3 sm:px-4 py-2 border transition-all duration-300 text-sm shadow-md ${
                            isOwnMessage
                              ? 'bg-accent-primary/10 border-accent-primary/30 text-white rounded-2xl rounded-tr-none shadow-[0_0_16px_rgba(59,130,246,0.05)]'
                              : 'bg-white/[0.02] border-white/5 text-text-primary rounded-2xl rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{renderMessageContent(msg.text)}</p>
                          
                          <div className="text-[8px] text-text-muted mt-1.5 text-right font-black tracking-wider uppercase">
                            {formatTime(msg.timestamp)}
                          </div>
                        </div>

                      </div>

                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-white/5 bg-primary/20 flex gap-2 sm:gap-3">
          <input
            type="text"
            placeholder={isGroupChat ? "Mensagem geral..." : "Mensagem privada..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs sm:text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all duration-300"
          />
          
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border transition-all duration-500 shrink-0 ${
              inputText.trim() && !isSending
                ? 'bg-gradient-to-br from-accent-primary to-accent-tertiary border-accent-primary/30 text-white shadow-glow-primary hover:scale-[1.03] active:scale-[0.98]'
                : 'bg-white/[0.02] border-white/5 text-text-muted cursor-not-allowed'
            }`}
          >
            {isSending ? (
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
            ) : (
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

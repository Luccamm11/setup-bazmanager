import React, { useState, useEffect } from 'react';
import { AppNotification, TeamMission } from '../types';
import { motion } from 'framer-motion';
import {
  MessageSquare, Download, Bell, BrainCircuit, Users,
  ClipboardList, BookOpen, LayoutGrid, ChevronRight,
  CheckCircle2, Clock, AlertCircle, Loader2, ArrowRight,
  BookText, ShieldAlert, Inbox
} from 'lucide-react';
import { getMemberByUsername } from '../data/members';

type NavigableView = 'chat' | 'team_missions' | '5w2h' | 'kanban' | 'learning_trails';

interface HomeProps {
  currentUser: string;
  notifications: AppNotification[];
  teamMissions: TeamMission[];
  onNavigate: (view: NavigableView) => void;
  onMarkNotificationRead: (id: string) => void;
  onNotificationClick: (notification: AppNotification) => void;
}

// ─── Notification Icon Helpers ───────────────────────────────────────────────

const notifIcon = (type: AppNotification['type']) => {
  switch (type) {
    case 'new_mission': return <Users className="w-4 h-4 text-blue-400" />;
    case 'mission_completed': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    case '5w2h_submitted': return <BookText className="w-4 h-4 text-amber-400" />;
    case '5w2h_reviewed': return <ClipboardList className="w-4 h-4 text-emerald-400" />;
    default: return <Bell className="w-4 h-4 text-text-muted" />;
  }
};

const notifColors: Record<string, string> = {
  new_mission: 'border-blue-500/20 bg-blue-500/5',
  mission_completed: 'border-green-500/20 bg-green-500/5',
  '5w2h_submitted': 'border-amber-500/20 bg-amber-500/5',
  '5w2h_reviewed': 'border-emerald-500/20 bg-emerald-500/5',
};

const formatTimeAgo = (isoString: string) => {
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
};

// ─── Section Title ────────────────────────────────────────────────────────────
const SectionTitle: React.FC<{ icon: React.ReactNode; label: string; count?: number }> = ({ icon, label, count }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div className="p-1.5 bg-white/5 rounded-lg border border-white/5">{icon}</div>
    <h2 className="font-black text-sm uppercase tracking-widest text-white">{label}</h2>
    {count !== undefined && count > 0 && (
      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-accent-primary/20 text-accent-primary border border-accent-primary/30 font-black">
        {count}
      </span>
    )}
  </div>
);

// ─── WorkItem Card ─────────────────────────────────────────────────────────────
interface WorkItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  status: string;
  statusColor: string;
  onClick: () => void;
}

const WorkItemCard: React.FC<WorkItemProps> = ({ icon, title, subtitle, status, statusColor, onClick }) => (
  <button
    onClick={onClick}
    className="w-full group flex items-center gap-3 p-3 rounded-xl bg-white/[0.025] border border-white/5 hover:border-accent-primary/30 hover:bg-white/[0.04] transition-all duration-300 text-left"
  >
    <div className="shrink-0 p-2 rounded-lg bg-white/[0.03] border border-white/5 group-hover:border-white/10 transition-colors">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-white truncate">{title}</p>
      <p className="text-xs text-text-muted truncate mt-0.5">{subtitle}</p>
    </div>
    <div className="shrink-0 flex items-center gap-2">
      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor}`}>
        {status}
      </span>
      <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent-primary transition-colors" />
    </div>
  </button>
);

// ─── Work module header card ───────────────────────────────────────────────────
const ModuleHeaderCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  count: number;
  accentClass: string;
  onClick: () => void;
}> = ({ icon, label, count, accentClass, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 text-left group ${accentClass}`}
  >
    {icon}
    <span className="text-xs font-black text-white">{label}</span>
    {count > 0 && (
      <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full bg-white/10 text-white border border-white/10">{count}</span>
    )}
    <ArrowRight className="w-3 h-3 text-text-muted group-hover:text-white transition-colors" />
  </button>
);

// ─── Main Home Component ───────────────────────────────────────────────────────
const Home: React.FC<HomeProps> = ({
  currentUser,
  notifications,
  teamMissions,
  onNavigate,
  onMarkNotificationRead,
  onNotificationClick,
}) => {
  const [chatMessages, setChatMessages] = useState<{ convId: string; name: string; unread: number; lastMsg: string }[]>([]);
  const [kanbanTasks, setKanbanTasks] = useState<{ id: string; title: string; status: string; missionId?: string }[]>([]);
  const [fiveW2hPlans, setFiveW2hPlans] = useState<{ id: string; title: string; status: string }[]>([]);
  const [learningProgress, setLearningProgress] = useState<{ trailId: string; trailTitle: string; pending: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load last-read chat state from localStorage
  const getLastRead = () => {
    try {
      const saved = localStorage.getItem(`bazmanager_chat_last_read_${currentUser}`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [chatRes, kanbanRes, w2hRes, trailsRes] = await Promise.allSettled([
          fetch('/api/crud?type=chat').then(r => r.json()),
          fetch('/api/crud?type=kanban').then(r => r.json()),
          fetch('/api/crud?type=5w2h').then(r => r.json()),
          fetch('/api/crud?type=learning-trails').then(r => r.json()),
        ]);

        // --- Chat ---
        if (chatRes.status === 'fulfilled' && chatRes.value.success) {
          const allMessages: any[] = chatRes.value.chat || [];
          const lastRead = getLastRead();
          const grouped: Record<string, any[]> = {};
          allMessages.forEach((m: any) => {
            if (!grouped[m.conversationId]) grouped[m.conversationId] = [];
            grouped[m.conversationId].push(m);
          });

          const unreadConvs = Object.entries(grouped)
            .map(([convId, msgs]) => {
              const incomingMsgs = msgs.filter((m: any) => m.sender !== currentUser);
              const lastReadTime = lastRead[convId];
              const unread = lastReadTime
                ? incomingMsgs.filter((m: any) => new Date(m.timestamp) > new Date(lastReadTime)).length
                : incomingMsgs.length;

              if (unread === 0) return null;

              const lastMsg = msgs[msgs.length - 1];
              let name = convId === 'team' ? '# Geral' : '';
              if (convId.startsWith('dm_')) {
                const parts = convId.replace('dm_', '').split('_');
                const otherUser = parts.find((u: string) => u !== currentUser) || currentUser;
                const member = getMemberByUsername(otherUser);
                name = member?.displayName || otherUser;
              }

              return { convId, name, unread, lastMsg: lastMsg?.text?.slice(0, 60) || '' };
            })
            .filter(Boolean) as { convId: string; name: string; unread: number; lastMsg: string }[];

          setChatMessages(unreadConvs);
        }

        // --- Kanban ---
        if (kanbanRes.status === 'fulfilled' && kanbanRes.value.success) {
          const all: any[] = kanbanRes.value.kanban || [];
          const myPending = all
            .filter((t: any) => t.assignee === currentUser && (t.status === 'todo' || t.status === 'in_progress'))
            .map((t: any) => ({ id: t.id, title: t.title, status: t.status, missionId: t.missionId }));
          setKanbanTasks(myPending);
        }

        // --- 5W2H ---
        if (w2hRes.status === 'fulfilled' && w2hRes.value.success) {
          const all: any[] = w2hRes.value['5w2h'] || w2hRes.value.plans || [];
          const myPlans = all
            .filter((p: any) =>
              (p.createdBy === currentUser || (p.assignedTo || []).includes(currentUser)) &&
              p.status !== 'done'
            )
            .map((p: any) => ({ id: p.id, title: p.title, status: p.status }));
          setFiveW2hPlans(myPlans);
        }

        // --- Learning Trails ---
        if (trailsRes.status === 'fulfilled' && trailsRes.value.success) {
          const data = trailsRes.value['learning-trails'] || trailsRes.value.data || {};
          const definitions: any[] = data.definitions || [];
          const progressList: any[] = data.progress || [];

          const myProgress = progressList.filter((p: any) => p.username === currentUser && !p.isArchived);
          const trailSummaries = myProgress.map((mp: any) => {
            const trail = definitions.find((d: any) => d.id === mp.trailId);
            if (!trail) return null;
            const allComps = trail.stages.flatMap((s: any) => s.competencies || []);
            const pending = allComps.filter((c: any) => {
              const prog = mp.progress?.[c.id];
              return !prog || prog.status === 'pending' || prog.status === 'in_progress';
            }).length;
            return { trailId: mp.trailId, trailTitle: trail.title, pending };
          }).filter(Boolean) as { trailId: string; trailTitle: string; pending: number }[];

          setLearningProgress(trailSummaries);
        }
      } catch (e) {
        console.error('Home: failed to load data', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const statusLabel = (s: string) => {
    if (s === 'todo') return 'A Fazer';
    if (s === 'in_progress') return 'Em Andamento';
    if (s === 'pending_review') return 'Em Revisão';
    if (s === 'approved') return 'Aprovado';
    if (s === 'in_progress') return 'Em Andamento';
    return s;
  };

  const statusColor = (s: string) => {
    if (s === 'todo') return 'border-blue-500/40 text-blue-400 bg-blue-500/10';
    if (s === 'in_progress') return 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10';
    if (s === 'pending_review') return 'border-amber-500/40 text-amber-400 bg-amber-500/10';
    if (s === 'approved') return 'border-green-500/40 text-green-400 bg-green-500/10';
    return 'border-white/20 text-text-muted bg-white/5';
  };

  const myMissions = teamMissions.filter(
    m => !m.completedBy.includes(currentUser) &&
      (m.assignedTo.length === 0 || m.assignedTo.includes(currentUser))
  );

  const totalWork = kanbanTasks.length + fiveW2hPlans.length + myMissions.length + learningProgress.reduce((acc, t) => acc + t.pending, 0);
  const unreadNotifs = notifications.filter(n => !n.read);

  const colVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut', delay: i * 0.1 } }),
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-black text-white tracking-tight">
          Olá, <span className="text-accent-primary">{currentUser}</span> 👋
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Aqui está o seu resumo de hoje — {totalWork > 0 ? `${totalWork} item(s) pendente(s)` : 'tudo em dia! ✅'}
        </p>
      </motion.div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-6">

        {/* ── LEFT: Chat + Tutorial ────────────────────────────────────────────── */}
        <motion.div custom={0} variants={colVariants} initial="hidden" animate="visible" className="space-y-4">
          
          {/* Unread Chat */}
          <div className="bg-primary/40 backdrop-blur-2xl rounded-2xl border border-white/5 p-5 shadow-glass">
            <SectionTitle
              icon={<MessageSquare className="w-4 h-4 text-blue-400" />}
              label="Mensagens"
              count={chatMessages.length}
            />

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-accent-primary animate-spin" />
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-text-muted opacity-30 mx-auto mb-2" />
                <p className="text-xs text-text-muted">Sem mensagens não lidas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chatMessages.map(conv => (
                  <button
                    key={conv.convId}
                    onClick={() => onNavigate('chat')}
                    className="w-full group flex items-start gap-3 p-3 rounded-xl bg-white/[0.025] border border-blue-500/15 hover:border-blue-500/40 hover:bg-white/[0.04] transition-all duration-300 text-left"
                  >
                    <div className="shrink-0 w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-white truncate">{conv.name}</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-black shrink-0 ml-2">
                          {conv.unread}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted truncate mt-0.5">{conv.lastMsg}</p>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => onNavigate('chat')}
                  className="w-full flex items-center justify-center gap-1.5 text-[10px] text-accent-primary font-black uppercase tracking-wider py-2 rounded-xl border border-dashed border-accent-primary/20 hover:bg-accent-primary/5 transition-colors"
                >
                  Abrir Chat <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Tutorial Download */}
          <div className="bg-primary/40 backdrop-blur-2xl rounded-2xl border border-white/5 p-5 shadow-glass">
            <SectionTitle icon={<BookOpen className="w-4 h-4 text-emerald-400" />} label="Tutorial" />
            <p className="text-xs text-text-muted mb-4 leading-relaxed">
              Guia completo de uso do BazManager com todas as funcionalidades e módulos.
            </p>
            <a
              href="/Guia_de_Uso_BazManager.pdf"
              download
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 group"
            >
              <Download className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              Baixar Guia
            </a>
          </div>
        </motion.div>

        {/* ── CENTER: Work items ───────────────────────────────────────────────── */}
        <motion.div custom={1} variants={colVariants} initial="hidden" animate="visible" className="space-y-4">
          
          {/* Module quick links */}
          <div className="grid grid-cols-2 gap-2">
            <ModuleHeaderCard
              icon={<LayoutGrid className="w-3.5 h-3.5 text-yellow-400" />}
              label="Kanban"
              count={kanbanTasks.length}
              accentClass="border-yellow-500/20 bg-yellow-500/5 hover:border-yellow-500/40 hover:bg-yellow-500/10"
              onClick={() => onNavigate('kanban')}
            />
            <ModuleHeaderCard
              icon={<Users className="w-3.5 h-3.5 text-blue-400" />}
              label="Missões da Equipe"
              count={myMissions.length}
              accentClass="border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40 hover:bg-blue-500/10"
              onClick={() => onNavigate('team_missions')}
            />
            <ModuleHeaderCard
              icon={<BookText className="w-3.5 h-3.5 text-amber-400" />}
              label="5W2H"
              count={fiveW2hPlans.length}
              accentClass="border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 hover:bg-amber-500/10"
              onClick={() => onNavigate('5w2h')}
            />
            <ModuleHeaderCard
              icon={<BrainCircuit className="w-3.5 h-3.5 text-violet-400" />}
              label="Trilhas"
              count={learningProgress.reduce((a, t) => a + t.pending, 0)}
              accentClass="border-violet-500/20 bg-violet-500/5 hover:border-violet-500/40 hover:bg-violet-500/10"
              onClick={() => onNavigate('learning_trails')}
            />
          </div>

          {/* Work items panel */}
          <div className="bg-primary/40 backdrop-blur-2xl rounded-2xl border border-white/5 p-5 shadow-glass">
            <SectionTitle
              icon={<ClipboardList className="w-4 h-4 text-accent-primary" />}
              label="Em Andamento / Pendentes"
              count={totalWork}
            />

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-accent-primary animate-spin" />
              </div>
            ) : totalWork === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-10 h-10 text-green-400/40 mx-auto mb-3" />
                <p className="text-sm font-bold text-text-secondary">Tudo em dia!</p>
                <p className="text-xs text-text-muted mt-1">Nenhuma pendência no momento.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Kanban tasks */}
                {kanbanTasks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <LayoutGrid className="w-3 h-3 text-yellow-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Kanban</span>
                    </div>
                    <div className="space-y-1.5">
                      {kanbanTasks.slice(0, 4).map(t => (
                        <WorkItemCard
                          key={t.id}
                          icon={<LayoutGrid className="w-4 h-4 text-yellow-400" />}
                          title={t.title}
                          subtitle={t.missionId ? 'Vinculado a uma missão' : 'Tarefa pessoal'}
                          status={statusLabel(t.status)}
                          statusColor={statusColor(t.status)}
                          onClick={() => onNavigate('kanban')}
                        />
                      ))}
                      {kanbanTasks.length > 4 && (
                        <button onClick={() => onNavigate('kanban')} className="text-[10px] text-text-muted hover:text-accent-primary transition-colors w-full text-center py-1">
                          +{kanbanTasks.length - 4} mais no Kanban →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Team missions */}
                {myMissions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users className="w-3 h-3 text-blue-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Missões da Equipe</span>
                    </div>
                    <div className="space-y-1.5">
                      {myMissions.slice(0, 3).map(m => (
                        <WorkItemCard
                          key={m.id}
                          icon={<Users className="w-4 h-4 text-blue-400" />}
                          title={m.title}
                          subtitle={`Criada por ${m.createdBy} · Prazo: ${new Date(m.deadline).toLocaleDateString('pt-BR')}`}
                          status="Pendente"
                          statusColor="border-blue-500/40 text-blue-400 bg-blue-500/10"
                          onClick={() => onNavigate('team_missions')}
                        />
                      ))}
                      {myMissions.length > 3 && (
                        <button onClick={() => onNavigate('team_missions')} className="text-[10px] text-text-muted hover:text-accent-primary transition-colors w-full text-center py-1">
                          +{myMissions.length - 3} mais em Missões →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 5W2H */}
                {fiveW2hPlans.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <BookText className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">5W2H</span>
                    </div>
                    <div className="space-y-1.5">
                      {fiveW2hPlans.slice(0, 3).map(p => (
                        <WorkItemCard
                          key={p.id}
                          icon={<BookText className="w-4 h-4 text-amber-400" />}
                          title={p.title}
                          subtitle="Plano de ação"
                          status={statusLabel(p.status)}
                          statusColor={statusColor(p.status)}
                          onClick={() => onNavigate('5w2h')}
                        />
                      ))}
                      {fiveW2hPlans.length > 3 && (
                        <button onClick={() => onNavigate('5w2h')} className="text-[10px] text-text-muted hover:text-accent-primary transition-colors w-full text-center py-1">
                          +{fiveW2hPlans.length - 3} mais em 5W2H →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Learning trails */}
                {learningProgress.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <BrainCircuit className="w-3 h-3 text-violet-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">Trilhas de Aprendizagem</span>
                    </div>
                    <div className="space-y-1.5">
                      {learningProgress.map(t => (
                        <WorkItemCard
                          key={t.trailId}
                          icon={<BrainCircuit className="w-4 h-4 text-violet-400" />}
                          title={t.trailTitle}
                          subtitle={`${t.pending} competência(s) pendente(s)`}
                          status="Em progresso"
                          statusColor="border-violet-500/40 text-violet-400 bg-violet-500/10"
                          onClick={() => onNavigate('learning_trails')}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── RIGHT: Notifications ─────────────────────────────────────────────── */}
        <motion.div custom={2} variants={colVariants} initial="hidden" animate="visible">
          <div className="bg-primary/40 backdrop-blur-2xl rounded-2xl border border-white/5 p-5 shadow-glass">
            <SectionTitle
              icon={<Bell className="w-4 h-4 text-accent-primary" />}
              label="Notificações"
              count={unreadNotifs.length}
            />

            {notifications.length === 0 ? (
              <div className="text-center py-10">
                <Inbox className="w-8 h-8 text-text-muted opacity-30 mx-auto mb-2" />
                <p className="text-xs text-text-muted">Sem notificações</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                {notifications.slice(0, 20).map(n => (
                  <button
                    key={n.id}
                    onClick={() => {
                      onMarkNotificationRead(n.id);
                      onNotificationClick(n);
                    }}
                    className={`w-full group flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 text-left ${
                      n.read
                        ? 'bg-white/[0.015] border-white/5 opacity-60 hover:opacity-80'
                        : `${notifColors[n.type] || 'border-white/10 bg-white/[0.025]'} hover:border-white/20`
                    }`}
                  >
                    <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border ${
                      n.read ? 'bg-white/[0.02] border-white/5' : 'bg-white/[0.03] border-white/10'
                    }`}>
                      {notifIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-xs font-bold text-white truncate">{n.title}</p>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0 animate-pulse" />
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-2.5 h-2.5 text-text-muted/50" />
                        <span className="text-[9px] text-text-muted/60">{formatTimeAgo(n.createdAt)}</span>
                      </div>
                    </div>
                  </button>
                ))}
                {notifications.length > 20 && (
                  <p className="text-center text-[10px] text-text-muted py-2">
                    Mostrando as 20 mais recentes
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Home;
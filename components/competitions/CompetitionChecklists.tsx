import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlaneTakeoff, PlaneLanding, Hotel, ShieldCheck, Wrench, Plus,
  CheckCircle2, Circle, Trash2, Edit3, AlertTriangle, Battery,
  BatteryCharging, RefreshCw, Radio, Check, X, Search, Flag,
  ChevronRight, Calendar, Info, Award, User, Clock, ArrowRight,
  Flame, Sparkles, Filter, BarChart2, History, ListPlus
} from 'lucide-react';
import {
  CompetitionEvent, TravelDepartureItem, TravelReturnItem,
  HotelDepartureItem, MatchRecord, UserRole, ChecklistAuditLog,
  CustomChecklistItem
} from '../../types';
import MatchesAnalyticsChart from './MatchesAnalyticsChart';
import ChecklistHistoryTimeline from './ChecklistHistoryTimeline';

interface CompetitionChecklistsProps {
  event: CompetitionEvent;
  currentUser: string;
  userRole: UserRole;
  onUpdateEvent: (updatedEvent: CompetitionEvent) => Promise<void>;
}

type ChecklistSubTab =
  | 'travel_departure'
  | 'travel_return'
  | 'hotel_departure'
  | 'matches'
  | 'analytics'
  | 'history';

export const CompetitionChecklists: React.FC<CompetitionChecklistsProps> = ({
  event,
  currentUser,
  userRole,
  onUpdateEvent,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ChecklistSubTab>('travel_departure');

  // Filtros da Ida
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchDeparture, setSearchDeparture] = useState('');

  // Modais de Criação
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Robô & Mecânica');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemNotes, setNewItemNotes] = useState('');
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Modais de Edição
  const [editingDepartureItem, setEditingDepartureItem] = useState<TravelDepartureItem | null>(null);
  const [editingReturnItem, setEditingReturnItem] = useState<TravelReturnItem | null>(null);
  const [editingHotelItem, setEditingHotelItem] = useState<HotelDepartureItem | null>(null);
  const [editingMatchDetails, setEditingMatchDetails] = useState<MatchRecord | null>(null);

  // Modal Item Volta
  const [isAddReturnItemModalOpen, setIsAddReturnItemModalOpen] = useState(false);
  const [newReturnName, setNewReturnName] = useState('');
  const [newReturnCategory, setNewReturnCategory] = useState('Prêmios & Conquistas');
  const [newReturnQuantity, setNewReturnQuantity] = useState(1);
  const [newReturnNotes, setNewReturnNotes] = useState('');

  // Modal Item Saída Hotel
  const [isAddHotelItemModalOpen, setIsAddHotelItemModalOpen] = useState(false);
  const [newHotelTask, setNewHotelTask] = useState('');
  const [newHotelCategory, setNewHotelCategory] = useState('Transporte Arena');

  // Estado das Partidas
  const [activeMatchId, setActiveMatchId] = useState<string | null>(
    event.matchesChecklist.matches.length > 0 ? event.matchesChecklist.matches[0].id : null
  );
  const [isNewMatchModalOpen, setIsNewMatchModalOpen] = useState(false);
  const [newMatchNumber, setNewMatchNumber] = useState('');
  const [newMatchRoundType, setNewMatchRoundType] = useState<'practice' | 'qualification' | 'playoff'>('qualification');
  const [newMatchAlliance, setNewMatchAlliance] = useState<'red' | 'blue'>('blue');
  const [newMatchTime, setNewMatchTime] = useState('');

  // Inputs para itens customizados de inspeção no Match
  const [customPreLabel, setCustomPreLabel] = useState('');
  const [customPostLabel, setCustomPostLabel] = useState('');

  // ─── Helpers de Atualização e Auditoria ──────────────────────────────────────
  const travel = event.travelChecklist;
  const matchesData = event.matchesChecklist;
  const historyLogs = event.historyLogs || [];

  const createLog = (
    checklistType: ChecklistAuditLog['checklistType'],
    action: ChecklistAuditLog['action'],
    itemName: string,
    details?: string
  ): ChecklistAuditLog => ({
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    checklistType,
    action,
    itemName,
    username: currentUser,
    timestamp: new Date().toISOString(),
    details,
  });

  const currentMatch = useMemo(() => {
    if (!activeMatchId) return matchesData.matches[0] || null;
    return matchesData.matches.find(m => m.id === activeMatchId) || matchesData.matches[0] || null;
  }, [matchesData.matches, activeMatchId]);

  // Contagens e Métricas
  const departureStats = useMemo(() => {
    const total = travel.departureItems.length;
    const packed = travel.departureItems.filter(i => i.packed).length;
    const percent = total > 0 ? Math.round((packed / total) * 100) : 0;
    return { total, packed, percent };
  }, [travel.departureItems]);

  const returnStats = useMemo(() => {
    const total = travel.returnItems.length;
    const packed = travel.returnItems.filter(i => i.packed).length;
    const percent = total > 0 ? Math.round((packed / total) * 100) : 0;
    return { total, packed, percent };
  }, [travel.returnItems]);

  const hotelStats = useMemo(() => {
    const total = matchesData.hotelDepartureChecklist.length;
    const completed = matchesData.hotelDepartureChecklist.filter(i => i.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [matchesData.hotelDepartureChecklist]);

  // ─── Handlers Viagem Ida ──────────────────────────────────────────────────────
  const handleToggleDeparture = async (itemId: string) => {
    let targetItemName = '';
    let targetPacked = false;

    const updatedItems = travel.departureItems.map(item => {
      if (item.id === itemId) {
        const nextPacked = !item.packed;
        targetItemName = item.name;
        targetPacked = nextPacked;
        return {
          ...item,
          packed: nextPacked,
          packedBy: nextPacked ? currentUser : undefined,
          packedAt: nextPacked ? new Date().toISOString() : undefined,
        };
      }
      return item;
    });

    const newLog = createLog(
      'travel_departure',
      targetPacked ? 'checked' : 'unchecked',
      targetItemName,
      targetPacked ? 'Marcou item como conferido para a ida' : 'Desmarcou item'
    );

    await onUpdateEvent({
      ...event,
      travelChecklist: {
        ...travel,
        departureItems: updatedItems,
      },
      historyLogs: [newLog, ...historyLogs],
    });
  };

  const handleAddDepartureItem = async () => {
    if (!newItemName.trim()) return;
    const category = customCategoryInput.trim() ? customCategoryInput.trim() : newItemCategory;

    const newItem: TravelDepartureItem = {
      id: `dep-${Date.now()}`,
      name: newItemName.trim(),
      category,
      quantity: Number(newItemQuantity) || 1,
      packed: false,
      notes: newItemNotes.trim() || undefined,
    };

    const nextCategories = travel.departureCategories.includes(category)
      ? travel.departureCategories
      : [...travel.departureCategories, category];

    const newLog = createLog(
      'travel_departure',
      'created',
      newItem.name,
      `Adicionou item (${newItem.quantity}x na categoria ${newItem.category})`
    );

    await onUpdateEvent({
      ...event,
      travelChecklist: {
        ...travel,
        departureCategories: nextCategories,
        departureItems: [...travel.departureItems, newItem],
      },
      historyLogs: [newLog, ...historyLogs],
    });

    setNewItemName('');
    setNewItemNotes('');
    setCustomCategoryInput('');
    setIsAddItemModalOpen(false);
  };

  const handleSaveEditDepartureItem = async () => {
    if (!editingDepartureItem || !editingDepartureItem.name.trim()) return;

    const updatedItems = travel.departureItems.map(item =>
      item.id === editingDepartureItem.id ? editingDepartureItem : item
    );

    const nextCategories = travel.departureCategories.includes(editingDepartureItem.category)
      ? travel.departureCategories
      : [...travel.departureCategories, editingDepartureItem.category];

    const newLog = createLog(
      'travel_departure',
      'updated',
      editingDepartureItem.name,
      `Editou detalhes do item de ida`
    );

    await onUpdateEvent({
      ...event,
      travelChecklist: {
        ...travel,
        departureCategories: nextCategories,
        departureItems: updatedItems,
      },
      historyLogs: [newLog, ...historyLogs],
    });

    setEditingDepartureItem(null);
  };

  const handleDeleteDepartureItem = async (itemId: string) => {
    const itemToDelete = travel.departureItems.find(i => i.id === itemId);
    const newLog = createLog(
      'travel_departure',
      'deleted',
      itemToDelete ? itemToDelete.name : 'Item',
      'Removeu item do checklist de ida'
    );

    await onUpdateEvent({
      ...event,
      travelChecklist: {
        ...travel,
        departureItems: travel.departureItems.filter(i => i.id !== itemId),
      },
      historyLogs: [newLog, ...historyLogs],
    });
  };

  // ─── Handlers Viagem Volta ────────────────────────────────────────────────────
  const handleSyncReturnFromDeparture = async () => {
    const existingAcquired = travel.returnItems.filter(i => i.origin === 'acquired_at_event');
    const mapped = travel.departureItems.map(dep => {
      const existing = travel.returnItems.find(r => r.name.toLowerCase() === dep.name.toLowerCase());
      return {
        id: existing ? existing.id : `ret-${dep.id}`,
        name: dep.name,
        category: dep.category,
        quantity: dep.quantity,
        origin: 'departure' as const,
        packed: existing ? existing.packed : false,
        packedBy: existing ? existing.packedBy : undefined,
        packedAt: existing ? existing.packedAt : undefined,
        notes: dep.notes,
      };
    });

    const newLog = createLog(
      'travel_return',
      'created',
      'Sincronização de Retorno',
      `Sincronizou ${mapped.length} itens levados na ida para o retorno`
    );

    await onUpdateEvent({
      ...event,
      travelChecklist: {
        ...travel,
        returnItems: [...mapped, ...existingAcquired],
      },
      historyLogs: [newLog, ...historyLogs],
    });
  };

  const handleToggleReturnItem = async (itemId: string) => {
    let targetItemName = '';
    let targetPacked = false;

    const updated = travel.returnItems.map(item => {
      if (item.id === itemId) {
        const nextPacked = !item.packed;
        targetItemName = item.name;
        targetPacked = nextPacked;
        return {
          ...item,
          packed: nextPacked,
          packedBy: nextPacked ? currentUser : undefined,
          packedAt: nextPacked ? new Date().toISOString() : undefined,
        };
      }
      return item;
    });

    const newLog = createLog(
      'travel_return',
      targetPacked ? 'checked' : 'unchecked',
      targetItemName,
      targetPacked ? 'Conferiu item guardado para o retorno' : 'Desmarcou item'
    );

    await onUpdateEvent({
      ...event,
      travelChecklist: {
        ...travel,
        returnItems: updated,
      },
      historyLogs: [newLog, ...historyLogs],
    });
  };

  const handleAddReturnItem = async () => {
    if (!newReturnName.trim()) return;

    const newItem: TravelReturnItem = {
      id: `ret-${Date.now()}`,
      name: newReturnName.trim(),
      category: newReturnCategory,
      quantity: Number(newReturnQuantity) || 1,
      origin: 'acquired_at_event',
      packed: false,
      notes: newReturnNotes.trim() || undefined,
    };

    const newLog = createLog(
      'travel_return',
      'created',
      newItem.name,
      `Registrou novo item ganho ou comprado no evento (${newItem.category})`
    );

    await onUpdateEvent({
      ...event,
      travelChecklist: {
        ...travel,
        returnItems: [...travel.returnItems, newItem],
      },
      historyLogs: [newLog, ...historyLogs],
    });

    setNewReturnName('');
    setNewReturnNotes('');
    setIsAddReturnItemModalOpen(false);
  };

  const handleSaveEditReturnItem = async () => {
    if (!editingReturnItem || !editingReturnItem.name.trim()) return;

    const updated = travel.returnItems.map(item =>
      item.id === editingReturnItem.id ? editingReturnItem : item
    );

    const newLog = createLog(
      'travel_return',
      'updated',
      editingReturnItem.name,
      `Editou detalhes do item de retorno`
    );

    await onUpdateEvent({
      ...event,
      travelChecklist: {
        ...travel,
        returnItems: updated,
      },
      historyLogs: [newLog, ...historyLogs],
    });

    setEditingReturnItem(null);
  };

  const handleDeleteReturnItem = async (itemId: string) => {
    const itemToDelete = travel.returnItems.find(i => i.id === itemId);
    const newLog = createLog(
      'travel_return',
      'deleted',
      itemToDelete ? itemToDelete.name : 'Item',
      'Removeu item do retorno'
    );

    await onUpdateEvent({
      ...event,
      travelChecklist: {
        ...travel,
        returnItems: travel.returnItems.filter(i => i.id !== itemId),
      },
      historyLogs: [newLog, ...historyLogs],
    });
  };

  // ─── Handlers Saída do Hotel ──────────────────────────────────────────────────
  const handleToggleHotelItem = async (itemId: string) => {
    let targetTask = '';
    let targetCompleted = false;

    const updated = matchesData.hotelDepartureChecklist.map(item => {
      if (item.id === itemId) {
        const nextCompleted = !item.completed;
        targetTask = item.task;
        targetCompleted = nextCompleted;
        return {
          ...item,
          completed: nextCompleted,
          completedBy: nextCompleted ? currentUser : undefined,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        };
      }
      return item;
    });

    const newLog = createLog(
      'hotel_departure',
      targetCompleted ? 'checked' : 'unchecked',
      targetTask,
      targetCompleted ? 'Checou saída do hotel para a arena' : 'Desmarcou tarefa'
    );

    await onUpdateEvent({
      ...event,
      matchesChecklist: {
        ...matchesData,
        hotelDepartureChecklist: updated,
      },
      historyLogs: [newLog, ...historyLogs],
    });
  };

  const handleAddHotelItem = async () => {
    if (!newHotelTask.trim()) return;

    const newItem: HotelDepartureItem = {
      id: `hotel-${Date.now()}`,
      task: newHotelTask.trim(),
      category: newHotelCategory,
      completed: false,
    };

    const newLog = createLog(
      'hotel_departure',
      'created',
      newItem.task,
      `Criou nova checagem de saída do hotel (${newItem.category})`
    );

    await onUpdateEvent({
      ...event,
      matchesChecklist: {
        ...matchesData,
        hotelDepartureChecklist: [...matchesData.hotelDepartureChecklist, newItem],
      },
      historyLogs: [newLog, ...historyLogs],
    });

    setNewHotelTask('');
    setIsAddHotelItemModalOpen(false);
  };

  const handleSaveEditHotelItem = async () => {
    if (!editingHotelItem || !editingHotelItem.task.trim()) return;

    const updated = matchesData.hotelDepartureChecklist.map(item =>
      item.id === editingHotelItem.id ? editingHotelItem : item
    );

    const newLog = createLog(
      'hotel_departure',
      'updated',
      editingHotelItem.task,
      `Editou tarefa da saída do hotel`
    );

    await onUpdateEvent({
      ...event,
      matchesChecklist: {
        ...matchesData,
        hotelDepartureChecklist: updated,
      },
      historyLogs: [newLog, ...historyLogs],
    });

    setEditingHotelItem(null);
  };

  const handleDeleteHotelItem = async (itemId: string) => {
    const itemToDelete = matchesData.hotelDepartureChecklist.find(i => i.id === itemId);
    const newLog = createLog(
      'hotel_departure',
      'deleted',
      itemToDelete ? itemToDelete.task : 'Tarefa',
      'Excluiu checagem de saída do hotel'
    );

    await onUpdateEvent({
      ...event,
      matchesChecklist: {
        ...matchesData,
        hotelDepartureChecklist: matchesData.hotelDepartureChecklist.filter(i => i.id !== itemId),
      },
      historyLogs: [newLog, ...historyLogs],
    });
  };

  // ─── Handlers Partidas ────────────────────────────────────────────────────────
  const handleCreateNewMatch = async () => {
    if (!newMatchNumber.trim()) return;

    const newMatch: MatchRecord = {
      id: `match-${Date.now()}`,
      matchNumber: newMatchNumber.trim(),
      roundType: newMatchRoundType,
      allianceColor: newMatchAlliance,
      scheduledTime: newMatchTime.trim() || undefined,
      preMatch: {
        batteryVoltage: '13.0V',
        batteryCode: '',
        radioLinked: false,
        bumpersSecured: false,
        autonomousSelected: false,
        mechanismsInitialState: false,
        customItems: [],
        completed: false,
      },
      postMatch: {
        robotCondition: 'perfect',
        breakagesReport: '',
        postBatteryVoltage: '',
        motorsTempOk: true,
        urgentPitMaintenance: false,
        customItems: [],
        completed: false,
      },
      createdAt: new Date().toISOString(),
      createdBy: currentUser,
    };

    const nextMatches = [newMatch, ...matchesData.matches];
    const newLog = createLog(
      'match_pre',
      'created',
      newMatch.matchNumber,
      `Cadastrou nova partida (${newMatch.roundType}, Aliança ${newMatch.allianceColor})`
    );

    await onUpdateEvent({
      ...event,
      matchesChecklist: {
        ...matchesData,
        matches: nextMatches,
      },
      historyLogs: [newLog, ...historyLogs],
    });

    setActiveMatchId(newMatch.id);
    setNewMatchNumber('');
    setNewMatchTime('');
    setIsNewMatchModalOpen(false);
  };

  const handleUpdateCurrentMatch = async (updatedMatch: MatchRecord, actionLogDesc?: string) => {
    const nextMatches = matchesData.matches.map(m => (m.id === updatedMatch.id ? updatedMatch : m));

    let logsToSave = historyLogs;
    if (actionLogDesc) {
      const newLog = createLog('match_pre', 'updated', updatedMatch.matchNumber, actionLogDesc);
      logsToSave = [newLog, ...historyLogs];
    }

    await onUpdateEvent({
      ...event,
      matchesChecklist: {
        ...matchesData,
        matches: nextMatches,
      },
      historyLogs: logsToSave,
    });
  };

  const handleSaveMatchDetails = async () => {
    if (!editingMatchDetails || !editingMatchDetails.matchNumber.trim()) return;
    await handleUpdateCurrentMatch(editingMatchDetails, 'Editou informações gerais da partida');
    setEditingMatchDetails(null);
  };

  // Itens Customizados Pré-Match
  const handleAddCustomPreItem = async () => {
    if (!currentMatch || !customPreLabel.trim()) return;
    const newItem: CustomChecklistItem = {
      id: `cpre-${Date.now()}`,
      label: customPreLabel.trim(),
      checked: false,
    };
    const currentCustom = currentMatch.preMatch.customItems || [];
    const updatedMatch: MatchRecord = {
      ...currentMatch,
      preMatch: {
        ...currentMatch.preMatch,
        customItems: [...currentCustom, newItem],
      },
    };
    await handleUpdateCurrentMatch(updatedMatch, `Adicionou ponto de checagem pré-match: "${newItem.label}"`);
    setCustomPreLabel('');
  };

  const handleToggleCustomPreItem = async (customId: string) => {
    if (!currentMatch) return;
    const currentCustom = currentMatch.preMatch.customItems || [];
    const updatedCustom = currentCustom.map(ci => (ci.id === customId ? { ...ci, checked: !ci.checked } : ci));
    const updatedMatch: MatchRecord = {
      ...currentMatch,
      preMatch: {
        ...currentMatch.preMatch,
        customItems: updatedCustom,
      },
    };
    await handleUpdateCurrentMatch(updatedMatch);
  };

  const handleDeleteCustomPreItem = async (customId: string) => {
    if (!currentMatch) return;
    const currentCustom = currentMatch.preMatch.customItems || [];
    const updatedMatch: MatchRecord = {
      ...currentMatch,
      preMatch: {
        ...currentMatch.preMatch,
        customItems: currentCustom.filter(ci => ci.id !== customId),
      },
    };
    await handleUpdateCurrentMatch(updatedMatch, 'Removeu ponto de checagem customizado pré-match');
  };

  // Itens Customizados Pós-Match
  const handleAddCustomPostItem = async () => {
    if (!currentMatch || !customPostLabel.trim()) return;
    const newItem: CustomChecklistItem = {
      id: `cpost-${Date.now()}`,
      label: customPostLabel.trim(),
      checked: false,
    };
    const currentCustom = currentMatch.postMatch.customItems || [];
    const updatedMatch: MatchRecord = {
      ...currentMatch,
      postMatch: {
        ...currentMatch.postMatch,
        customItems: [...currentCustom, newItem],
      },
    };
    await handleUpdateCurrentMatch(updatedMatch, `Adicionou ponto de inspeção pós-match: "${newItem.label}"`);
    setCustomPostLabel('');
  };

  const handleToggleCustomPostItem = async (customId: string) => {
    if (!currentMatch) return;
    const currentCustom = currentMatch.postMatch.customItems || [];
    const updatedCustom = currentCustom.map(ci => (ci.id === customId ? { ...ci, checked: !ci.checked } : ci));
    const updatedMatch: MatchRecord = {
      ...currentMatch,
      postMatch: {
        ...currentMatch.postMatch,
        customItems: updatedCustom,
      },
    };
    await handleUpdateCurrentMatch(updatedMatch);
  };

  const handleDeleteCustomPostItem = async (customId: string) => {
    if (!currentMatch) return;
    const currentCustom = currentMatch.postMatch.customItems || [];
    const updatedMatch: MatchRecord = {
      ...currentMatch,
      postMatch: {
        ...currentMatch.postMatch,
        customItems: currentCustom.filter(ci => ci.id !== customId),
      },
    };
    await handleUpdateCurrentMatch(updatedMatch, 'Removeu ponto de inspeção customizado pós-match');
  };

  const handleDeleteMatch = async (matchId: string) => {
    const matchToDelete = matchesData.matches.find(m => m.id === matchId);
    const nextMatches = matchesData.matches.filter(m => m.id !== matchId);
    if (activeMatchId === matchId) {
      setActiveMatchId(nextMatches.length > 0 ? nextMatches[0].id : null);
    }
    const newLog = createLog(
      'match_pre',
      'deleted',
      matchToDelete ? matchToDelete.matchNumber : 'Partida',
      'Excluiu registro de partida'
    );
    await onUpdateEvent({
      ...event,
      matchesChecklist: {
        ...matchesData,
        matches: nextMatches,
      },
      historyLogs: [newLog, ...historyLogs],
    });
  };

  // Itens filtrados da Ida
  const filteredDepartureItems = useMemo(() => {
    return travel.departureItems.filter(item => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchDeparture.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchDeparture.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [travel.departureItems, selectedCategory, searchDeparture]);

  return (
    <div className="space-y-6">
      {/* Sub-Abas do Módulo de Checklist */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-black/30 backdrop-blur-md rounded-2xl border border-white/5">
        <button
          onClick={() => setActiveSubTab('travel_departure')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
            activeSubTab === 'travel_departure'
              ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40 shadow-glow-primary'
              : 'text-text-secondary hover:text-white hover:bg-white/5'
          }`}
        >
          <PlaneTakeoff size={16} />
          <span>Viagem: Ida</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              departureStats.percent === 100
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-blue-500/20 text-blue-300'
            }`}
          >
            {departureStats.percent}%
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('travel_return')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
            activeSubTab === 'travel_return'
              ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 shadow-glow-primary'
              : 'text-text-secondary hover:text-white hover:bg-white/5'
          }`}
        >
          <PlaneLanding size={16} />
          <span>Viagem: Volta</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              returnStats.percent === 100
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-cyan-500/20 text-cyan-300'
            }`}
          >
            {returnStats.percent}%
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('hotel_departure')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
            activeSubTab === 'hotel_departure'
              ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-glow-primary'
              : 'text-text-secondary hover:text-white hover:bg-white/5'
          }`}
        >
          <Hotel size={16} />
          <span>Saída do Hotel</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              hotelStats.percent === 100
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            {hotelStats.percent}%
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('matches')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
            activeSubTab === 'matches'
              ? 'bg-orange-600/30 text-orange-300 border border-orange-500/40 shadow-glow-primary'
              : 'text-text-secondary hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldCheck size={16} />
          <span>Partida: Pré & Pós</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-black">
            {matchesData.matches.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
            activeSubTab === 'analytics'
              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-glow-primary'
              : 'text-text-secondary hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart2 size={16} />
          <span>Gráficos Antes & Depois</span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
            activeSubTab === 'history'
              ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-glow-primary'
              : 'text-text-secondary hover:text-white hover:bg-white/5'
          }`}
        >
          <History size={16} />
          <span>Histórico</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-text-muted font-bold">
            {historyLogs.length}
          </span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          ABA 1: VIAGEM - IDA (O que levar para a viagem)
      ──────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'travel_departure' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-primary/40 border border-white/5 backdrop-blur-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white">Checklist de Ida: O que Levar</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">
                    {departureStats.packed} de {departureStats.total} itens embalados
                  </span>
                </div>
                <p className="text-sm text-text-secondary mt-1">
                  Confira cada equipamento e ferramenta antes de fechar os crates e embarcar.
                </p>
              </div>

              <button
                onClick={() => setIsAddItemModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-glow-primary shrink-0"
              >
                <Plus size={16} />
                <span>Adicionar Item</span>
              </button>
            </div>

            <div className="mt-4">
              <div className="w-full h-3 rounded-full bg-black/40 overflow-hidden p-0.5 border border-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${departureStats.percent}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/5 items-center">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider mr-1">Filtrar:</span>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-glow-primary'
                    : 'bg-white/5 text-text-secondary hover:text-white'
                }`}
              >
                Todas ({travel.departureItems.length})
              </button>
              {travel.departureCategories.map(cat => {
                const count = travel.departureItems.filter(i => i.category === cat).length;
                const catPacked = travel.departureItems.filter(i => i.category === cat && i.packed).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-glow-primary'
                        : 'bg-white/5 text-text-secondary hover:text-white'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="text-[10px] opacity-75">
                      ({catPacked}/{count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Buscar item da mala de viagem..."
              value={searchDeparture}
              onChange={e => setSearchDeparture(e.target.value)}
              className="w-full bg-primary/40 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredDepartureItems.map(item => (
              <div
                key={item.id}
                onClick={() => handleToggleDeparture(item.id)}
                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex items-start justify-between gap-3 group ${
                  item.packed
                    ? 'bg-blue-950/20 border-blue-500/30 opacity-80'
                    : 'bg-primary/50 border-white/5 hover:border-blue-500/40 hover:bg-primary/70'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-0.5 shrink-0 text-blue-400">
                    {item.packed ? (
                      <CheckCircle2 size={20} className="text-emerald-400" />
                    ) : (
                      <Circle size={20} className="opacity-40 group-hover:opacity-100" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-bold text-sm ${item.packed ? 'line-through text-text-secondary' : 'text-white'}`}>
                        {item.name}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-black">
                          x{item.quantity}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-text-muted">
                      <span className="px-2 py-0.5 rounded bg-white/5 font-semibold text-text-secondary">
                        {item.category}
                      </span>
                      {item.notes && <span className="truncate italic text-text-muted">"{item.notes}"</span>}
                    </div>
                    {item.packed && item.packedBy && (
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-400/90 font-medium">
                        <User size={11} />
                        <span>Conferido por {item.packedBy}</span>
                        {item.packedAt && (
                          <span className="opacity-75">
                            ({new Date(item.packedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setEditingDepartureItem({ ...item });
                    }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-cyan-300 hover:bg-cyan-500/10 transition-all"
                    title="Editar item"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteDepartureItem(item.id);
                    }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Excluir item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredDepartureItems.length === 0 && (
            <div className="text-center py-12 rounded-2xl border border-dashed border-white/10 p-6 text-text-muted">
              <PlaneTakeoff size={36} className="mx-auto mb-2 opacity-40 text-blue-400" />
              <p className="text-sm">Nenhum item encontrado nesta categoria ou busca.</p>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          ABA 2: VIAGEM - VOLTA (O que levar embora / Retorno)
      ──────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'travel_return' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-primary/40 border border-white/5 backdrop-blur-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white">Checklist de Retorno: Levar de Volta</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                    {returnStats.packed} de {returnStats.total} itens conferidos
                  </span>
                </div>
                <p className="text-sm text-text-secondary mt-1">
                  Garante que tudo que a equipe levou volte para casa, além dos novos itens comprados ou ganhos na competição!
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleSyncReturnFromDeparture}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-500/30 font-bold text-xs uppercase tracking-wider transition-all duration-300"
                  title="Sincronizar com itens levados na Ida"
                >
                  <RefreshCw size={14} />
                  <span>Sincronizar da Ida</span>
                </button>

                <button
                  onClick={() => setIsAddReturnItemModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-glow-primary"
                >
                  <Plus size={16} />
                  <span>Novo Item Ganho/Comprado</span>
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="w-full h-3 rounded-full bg-black/40 overflow-hidden p-0.5 border border-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${returnStats.percent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {travel.returnItems.map(item => (
              <div
                key={item.id}
                onClick={() => handleToggleReturnItem(item.id)}
                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex items-start justify-between gap-3 group ${
                  item.packed
                    ? 'bg-cyan-950/20 border-cyan-500/30 opacity-80'
                    : item.origin === 'acquired_at_event'
                    ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                    : 'bg-primary/50 border-white/5 hover:border-cyan-500/40 hover:bg-primary/70'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-0.5 shrink-0 text-cyan-400">
                    {item.packed ? (
                      <CheckCircle2 size={20} className="text-emerald-400" />
                    ) : (
                      <Circle size={20} className="opacity-40 group-hover:opacity-100" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-bold text-sm ${item.packed ? 'line-through text-text-secondary' : 'text-white'}`}>
                        {item.name}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-black">
                          x{item.quantity}
                        </span>
                      )}
                      {item.origin === 'acquired_at_event' && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black flex items-center gap-1">
                          <Sparkles size={10} /> Ganho / Comprado Lá
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-text-muted">
                      <span className="px-2 py-0.5 rounded bg-white/5 font-semibold text-text-secondary">
                        {item.category}
                      </span>
                      {item.notes && <span className="truncate italic text-text-muted">"{item.notes}"</span>}
                    </div>
                    {item.packed && item.packedBy && (
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-400 font-medium">
                        <User size={11} />
                        <span>Embalado por {item.packedBy}</span>
                        {item.packedAt && (
                          <span className="opacity-75">
                            ({new Date(item.packedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setEditingReturnItem({ ...item });
                    }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-cyan-300 hover:bg-cyan-500/10 transition-all"
                    title="Editar item"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteReturnItem(item.id);
                    }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Excluir item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {travel.returnItems.length === 0 && (
            <div className="text-center py-12 rounded-2xl border border-dashed border-white/10 p-6 text-text-muted">
              <PlaneLanding size={36} className="mx-auto mb-2 opacity-40 text-cyan-400" />
              <p className="text-sm">Nenhum item na lista de retorno ainda.</p>
              <button
                onClick={handleSyncReturnFromDeparture}
                className="mt-3 px-4 py-2 rounded-xl bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold"
              >
                Carregar itens levados na Ida
              </button>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          ABA 3: PARTIDA - SAÍDA DO HOTEL
      ──────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'hotel_departure' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-primary/40 border border-white/5 backdrop-blur-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white">Saída do Hotel: Transporte para a Arena</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    {hotelStats.completed} de {hotelStats.total} checados
                  </span>
                </div>
                <p className="text-sm text-text-secondary mt-1">
                  Checklist diário antes de entrar na van ou ônibus rumo ao ginásio da competição.
                </p>
              </div>

              <button
                onClick={() => setIsAddHotelItemModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-glow-primary shrink-0"
              >
                <Plus size={16} />
                <span>Adicionar Tarefa</span>
              </button>
            </div>

            <div className="mt-4">
              <div className="w-full h-3 rounded-full bg-black/40 overflow-hidden p-0.5 border border-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                  style={{ width: `${hotelStats.percent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {matchesData.hotelDepartureChecklist.map(item => (
              <div
                key={item.id}
                onClick={() => handleToggleHotelItem(item.id)}
                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex items-start justify-between gap-3 group ${
                  item.completed
                    ? 'bg-amber-950/20 border-amber-500/30 opacity-80'
                    : 'bg-primary/50 border-white/5 hover:border-amber-500/40 hover:bg-primary/70'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-0.5 shrink-0 text-amber-400">
                    {item.completed ? (
                      <CheckCircle2 size={20} className="text-emerald-400" />
                    ) : (
                      <Circle size={20} className="opacity-40 group-hover:opacity-100" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={`font-bold text-sm block ${item.completed ? 'line-through text-text-secondary' : 'text-white'}`}>
                      {item.task}
                    </span>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-white/5 text-text-muted font-semibold">
                      {item.category}
                    </span>
                    {item.completed && item.completedBy && (
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-400 font-medium">
                        <User size={11} />
                        <span>Checado por {item.completedBy}</span>
                        {item.completedAt && (
                          <span className="opacity-75">
                            ({new Date(item.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setEditingHotelItem({ ...item });
                    }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-amber-300 hover:bg-amber-500/10 transition-all"
                    title="Editar tarefa"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteHotelItem(item.id);
                    }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Excluir"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          ABA 4: PARTIDA - PRÉ & PÓS-MATCH (Arena & Fila da Partida)
      ──────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'matches' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-primary/40 border border-white/5 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-black text-white">Inspeção de Partida: Pré & Pós-Match</h3>
                <p className="text-sm text-text-secondary mt-1">
                  Conferência do robô antes de entrar na quadra (baterias, conexões, bumpers) e avaliação pós-partida (quebras e reparos).
                </p>
              </div>

              <div className="flex items-center gap-2">
                {currentMatch && (
                  <button
                    onClick={() => setEditingMatchDetails({ ...currentMatch })}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider border border-white/10"
                    title="Editar informações da partida"
                  >
                    <Edit3 size={14} />
                    <span>Editar Partida</span>
                  </button>
                )}

                <button
                  onClick={() => setIsNewMatchModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-glow-primary shrink-0"
                >
                  <Plus size={16} />
                  <span>Nova Partida</span>
                </button>
              </div>
            </div>

            {/* Carrossel de Partidas */}
            <div className="flex gap-2 overflow-x-auto pb-2 mt-6 custom-scrollbar">
              {matchesData.matches.map(match => {
                const isSelected = match.id === currentMatch?.id;
                const preDone = match.preMatch.completed;
                const postDone = match.postMatch.completed;
                const conditionColor =
                  match.postMatch.robotCondition === 'damaged'
                    ? 'border-red-500/50 bg-red-950/20'
                    : match.postMatch.robotCondition === 'minor_issue'
                    ? 'border-amber-500/50 bg-amber-950/20'
                    : 'border-white/5 bg-white/5';

                return (
                  <button
                    key={match.id}
                    onClick={() => setActiveMatchId(match.id)}
                    className={`p-3 rounded-xl border text-left min-w-[200px] shrink-0 transition-all ${
                      isSelected
                        ? 'border-orange-500/60 bg-orange-600/15 shadow-glow-primary ring-1 ring-orange-500/30'
                        : `${conditionColor} hover:bg-white/10`
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-white">{match.matchNumber}</span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          match.allianceColor === 'blue' ? 'bg-blue-500' : 'bg-red-500'
                        }`}
                        title={`Aliança ${match.allianceColor}`}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-text-muted">
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                          preDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-text-muted'
                        }`}
                      >
                        {preDone ? 'Pré: OK' : 'Pré: Pendente'}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                          postDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-text-muted'
                        }`}
                      >
                        {postDone ? 'Pós: OK' : 'Pós: Pendente'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {currentMatch ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: ANTES DA PARTIDA (Pré-Match) */}
              <div className="p-6 rounded-2xl bg-primary/40 border border-white/5 backdrop-blur-xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                      <BatteryCharging size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-white">Antes da Partida (Pré-Match)</h4>
                      <p className="text-xs text-text-secondary">Fila da arena / Preparação imediata</p>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      currentMatch.preMatch.completed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {currentMatch.preMatch.completed ? 'Aprovado' : 'Em Verificação'}
                  </span>
                </div>

                {/* Bateria & Tensão */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                      Tensão da Bateria (V)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 13.0V"
                      value={currentMatch.preMatch.batteryVoltage}
                      onChange={e => {
                        handleUpdateCurrentMatch({
                          ...currentMatch,
                          preMatch: {
                            ...currentMatch.preMatch,
                            batteryVoltage: e.target.value,
                          },
                        });
                      }}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-orange-500/50"
                    />
                    <span className="text-[10px] text-text-muted mt-0.5 block">Ideal: &gt; 12.8V</span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                      Código da Bateria
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: BAT-02"
                      value={currentMatch.preMatch.batteryCode}
                      onChange={e => {
                        handleUpdateCurrentMatch({
                          ...currentMatch,
                          preMatch: {
                            ...currentMatch.preMatch,
                            batteryCode: e.target.value,
                          },
                        });
                      }}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
                    />
                  </div>
                </div>

                {/* Checkboxes de Inspeção Padrão */}
                <div className="space-y-2.5 pt-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={currentMatch.preMatch.bumpersSecured}
                      onChange={e => {
                        handleUpdateCurrentMatch({
                          ...currentMatch,
                          preMatch: {
                            ...currentMatch.preMatch,
                            bumpersSecured: e.target.checked,
                          },
                        });
                      }}
                      className="w-4 h-4 rounded text-orange-500 focus:ring-0 bg-black/40 border-white/20"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-white block">Bumpers Fixos e Aliança Correta</span>
                      <span className="text-text-muted text-[11px]">
                        Conferir presilhas e cor {currentMatch.allianceColor === 'blue' ? 'Azul' : 'Vermelha'}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={currentMatch.preMatch.radioLinked}
                      onChange={e => {
                        handleUpdateCurrentMatch({
                          ...currentMatch,
                          preMatch: {
                            ...currentMatch.preMatch,
                            radioLinked: e.target.checked,
                          },
                        });
                      }}
                      className="w-4 h-4 rounded text-orange-500 focus:ring-0 bg-black/40 border-white/20"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-white block">Rádio e Driver Station Linkados</span>
                      <span className="text-text-muted text-[11px]">LED de link aceso e comunicação estável</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={currentMatch.preMatch.mechanismsInitialState}
                      onChange={e => {
                        handleUpdateCurrentMatch({
                          ...currentMatch,
                          preMatch: {
                            ...currentMatch.preMatch,
                            mechanismsInitialState: e.target.checked,
                          },
                        });
                      }}
                      className="w-4 h-4 rounded text-orange-500 focus:ring-0 bg-black/40 border-white/20"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-white block">Mecanismos na Posição Inicial</span>
                      <span className="text-text-muted text-[11px]">Braços e garras recolhidos dentro do perímetro inicial</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={currentMatch.preMatch.autonomousSelected}
                      onChange={e => {
                        handleUpdateCurrentMatch({
                          ...currentMatch,
                          preMatch: {
                            ...currentMatch.preMatch,
                            autonomousSelected: e.target.checked,
                          },
                        });
                      }}
                      className="w-4 h-4 rounded text-orange-500 focus:ring-0 bg-black/40 border-white/20"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-white block">Rotina Autônoma Selecionada</span>
                      <span className="text-text-muted text-[11px]">Autônomo alinhado com a estratégia dos parceiros</span>
                    </div>
                  </label>

                  {/* Itens Customizados Pré-Match */}
                  {(currentMatch.preMatch.customItems || []).map(ci => (
                    <div
                      key={ci.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
                    >
                      <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={ci.checked}
                          onChange={() => handleToggleCustomPreItem(ci.id)}
                          className="w-4 h-4 rounded text-orange-500 focus:ring-0 bg-black/40 border-white/20"
                        />
                        <span className={`text-xs font-bold truncate ${ci.checked ? 'line-through text-text-secondary' : 'text-white'}`}>
                          {ci.label}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomPreItem(ci.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-red-400 transition-all"
                        title="Remover ponto de checagem"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  {/* Adicionar Ponto de Inspeção Customizado Pré-Match */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="+ Ponto customizado de checagem pré-match..."
                      value={customPreLabel}
                      onChange={e => setCustomPreLabel(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomPreItem();
                        }
                      }}
                      className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomPreItem}
                      disabled={!customPreLabel.trim()}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-orange-400 text-xs font-bold"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Observações Pré-Jogo
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Alguma calibragem específica feita na arena..."
                    value={currentMatch.preMatch.notes || ''}
                    onChange={e => {
                      handleUpdateCurrentMatch({
                        ...currentMatch,
                        preMatch: {
                          ...currentMatch.preMatch,
                          notes: e.target.value,
                        },
                      });
                    }}
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50"
                  />
                </div>

                <button
                  onClick={() => {
                    const nextCompleted = !currentMatch.preMatch.completed;
                    handleUpdateCurrentMatch(
                      {
                        ...currentMatch,
                        preMatch: {
                          ...currentMatch.preMatch,
                          completed: nextCompleted,
                          completedBy: nextCompleted ? currentUser : undefined,
                          completedAt: nextCompleted ? new Date().toISOString() : undefined,
                        },
                      },
                      nextCompleted ? 'Aprovou inspeção pré-match' : 'Desmarcou inspeção pré-match'
                    );
                  }}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    currentMatch.preMatch.completed
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40'
                      : 'bg-orange-600 hover:bg-orange-500 text-white shadow-glow-primary'
                  }`}
                >
                  <Check size={16} />
                  <span>
                    {currentMatch.preMatch.completed ? 'Inspeção Pré-Match Concluída ✓' : 'Marcar Pré-Match como Pronto'}
                  </span>
                </button>
              </div>

              {/* Card 2: DEPOIS DA PARTIDA (Pós-Match) */}
              <div className="p-6 rounded-2xl bg-primary/40 border border-white/5 backdrop-blur-xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                      <Wrench size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-white">Depois da Partida (Pós-Match)</h4>
                      <p className="text-xs text-text-secondary">Conferência de integridade e avarias</p>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      currentMatch.postMatch.completed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/10 text-text-muted border border-white/5'
                    }`}
                  >
                    {currentMatch.postMatch.completed ? 'Avaliado' : 'Pendente'}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">
                    Condição do Robô Pós-Partida
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateCurrentMatch({
                          ...currentMatch,
                          postMatch: {
                            ...currentMatch.postMatch,
                            robotCondition: 'perfect',
                          },
                        });
                      }}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        currentMatch.postMatch.robotCondition === 'perfect'
                          ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold shadow-glow-primary'
                          : 'bg-white/5 border-white/5 text-text-secondary hover:text-white'
                      }`}
                    >
                      <CheckCircle2 size={18} className="mx-auto mb-1 text-emerald-400" />
                      <span className="text-xs block">100% Íntegro</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateCurrentMatch({
                          ...currentMatch,
                          postMatch: {
                            ...currentMatch.postMatch,
                            robotCondition: 'minor_issue',
                          },
                        });
                      }}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        currentMatch.postMatch.robotCondition === 'minor_issue'
                          ? 'bg-amber-600/30 border-amber-500 text-amber-300 font-bold shadow-glow-primary'
                          : 'bg-white/5 border-white/5 text-text-secondary hover:text-white'
                      }`}
                    >
                      <AlertTriangle size={18} className="mx-auto mb-1 text-amber-400" />
                      <span className="text-xs block">Leve Folga/Ajuste</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateCurrentMatch({
                          ...currentMatch,
                          postMatch: {
                            ...currentMatch.postMatch,
                            robotCondition: 'damaged',
                          },
                        });
                      }}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        currentMatch.postMatch.robotCondition === 'damaged'
                          ? 'bg-red-600/30 border-red-500 text-red-300 font-bold shadow-glow-primary'
                          : 'bg-white/5 border-white/5 text-text-secondary hover:text-white'
                      }`}
                    >
                      <Flame size={18} className="mx-auto mb-1 text-red-400" />
                      <span className="text-xs block">Quebrou / Crítico</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Relatório de Quebras & Como o Robô Ficou
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Descreva detalhadamente: o que quebrou, correia soltou, rebite arrebentou, mecanismo travou..."
                    value={currentMatch.postMatch.breakagesReport}
                    onChange={e => {
                      handleUpdateCurrentMatch({
                        ...currentMatch,
                        postMatch: {
                          ...currentMatch.postMatch,
                          breakagesReport: e.target.value,
                        },
                      });
                    }}
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                      Tensão Pós-Jogo (V)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 12.3V"
                      value={currentMatch.postMatch.postBatteryVoltage}
                      onChange={e => {
                        handleUpdateCurrentMatch({
                          ...currentMatch,
                          postMatch: {
                            ...currentMatch.postMatch,
                            postBatteryVoltage: e.target.value,
                          },
                        });
                      }}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentMatch.postMatch.motorsTempOk}
                        onChange={e => {
                          handleUpdateCurrentMatch({
                            ...currentMatch,
                            postMatch: {
                              ...currentMatch.postMatch,
                              motorsTempOk: e.target.checked,
                            },
                          });
                        }}
                        className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-black/40 border-white/20"
                      />
                      <span className="text-xs text-white font-semibold">Motores Frios/Normais</span>
                    </label>
                  </div>
                </div>

                {/* Itens Customizados Pós-Match */}
                <div className="space-y-2 pt-1">
                  {(currentMatch.postMatch.customItems || []).map(ci => (
                    <div
                      key={ci.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
                    >
                      <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={ci.checked}
                          onChange={() => handleToggleCustomPostItem(ci.id)}
                          className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-black/40 border-white/20"
                        />
                        <span className={`text-xs font-bold truncate ${ci.checked ? 'line-through text-text-secondary' : 'text-white'}`}>
                          {ci.label}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomPostItem(ci.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-red-400 transition-all"
                        title="Remover ponto de inspeção pós-match"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="+ Ponto customizado de checagem pós-match..."
                      value={customPostLabel}
                      onChange={e => setCustomPostLabel(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomPostItem();
                        }
                      }}
                      className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomPostItem}
                      disabled={!customPostLabel.trim()}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-cyan-300 text-xs font-bold"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={currentMatch.postMatch.urgentPitMaintenance}
                    onChange={e => {
                      handleUpdateCurrentMatch({
                        ...currentMatch,
                        postMatch: {
                          ...currentMatch.postMatch,
                          urgentPitMaintenance: e.target.checked,
                        },
                      });
                    }}
                    className="w-4 h-4 rounded text-red-500 focus:ring-0 bg-black/40 border-red-400"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-red-300 block">Exige Manutenção Imediata no Pit</span>
                    <span className="text-text-muted text-[11px]">Avisar a equipe mecânica para agir antes da próxima rodada</span>
                  </div>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const nextCompleted = !currentMatch.postMatch.completed;
                      handleUpdateCurrentMatch(
                        {
                          ...currentMatch,
                          postMatch: {
                            ...currentMatch.postMatch,
                            completed: nextCompleted,
                            completedBy: nextCompleted ? currentUser : undefined,
                            completedAt: nextCompleted ? new Date().toISOString() : undefined,
                          },
                        },
                        nextCompleted ? 'Registrou avaliação pós-match' : 'Desmarcou avaliação pós-match'
                      );
                    }}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      currentMatch.postMatch.completed
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-glow-primary'
                    }`}
                  >
                    <Check size={16} />
                    <span>
                      {currentMatch.postMatch.completed ? 'Diagnóstico Pós-Match Salvo ✓' : 'Salvar Avaliação Pós-Match'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteMatch(currentMatch.id)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-text-muted hover:text-red-400 border border-white/5 transition-all"
                    title="Excluir partida"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 rounded-2xl border border-dashed border-white/10 p-6 text-text-muted">
              <ShieldCheck size={36} className="mx-auto mb-2 opacity-40 text-orange-400" />
              <p className="text-sm">Nenhuma partida registrada ainda.</p>
              <button
                onClick={() => setIsNewMatchModalOpen(true)}
                className="mt-3 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs uppercase tracking-wider"
              >
                Cadastrar Primeira Partida
              </button>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          ABA 5: GRÁFICOS ANTES & DEPOIS DA PARTIDA
      ──────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'analytics' && (
        <MatchesAnalyticsChart matches={matchesData.matches} />
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          ABA 6: HISTÓRICO DE AUDITORIA & REGISTROS
      ──────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'history' && (
        <ChecklistHistoryTimeline logs={historyLogs} />
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL: ADICIONAR ITEM NA VIAGEM (IDA)
      ──────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isAddItemModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-primary/95 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-black text-white">Adicionar Item para a Viagem</h3>
                <button onClick={() => setIsAddItemModalOpen(false)} className="p-1 rounded-lg text-text-muted hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Nome do Item *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Alicate de bico fino, Baterias extras..."
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Categoria</label>
                    <select
                      value={newItemCategory}
                      onChange={e => setNewItemCategory(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      {travel.departureCategories.map(cat => (
                        <option key={cat} value={cat} className="bg-primary text-white">
                          {cat}
                        </option>
                      ))}
                      <option value="nova_categoria" className="bg-primary text-blue-400">
                        + Nova Categoria...
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Quantidade</label>
                    <input
                      type="number"
                      min={1}
                      value={newItemQuantity}
                      onChange={e => setNewItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                {newItemCategory === 'nova_categoria' && (
                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                      Nome da Nova Categoria
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Mecatrônica, Uniformes..."
                      value={customCategoryInput}
                      onChange={e => setCustomCategoryInput(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Observações / Cuidados (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Frágil, levar na mala de mão..."
                    value={newItemNotes}
                    onChange={e => setNewItemNotes(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary text-xs font-bold uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddDepartureItem}
                  disabled={!newItemName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider shadow-glow-primary"
                >
                  Salvar Item
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL: EDITAR ITEM DA VIAGEM (IDA)
      ──────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingDepartureItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-primary/95 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-black text-white">Editar Item (Ida)</h3>
                <button onClick={() => setEditingDepartureItem(null)} className="p-1 rounded-lg text-text-muted hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Nome do Item *
                  </label>
                  <input
                    type="text"
                    value={editingDepartureItem.name}
                    onChange={e => setEditingDepartureItem({ ...editingDepartureItem, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Categoria</label>
                    <select
                      value={editingDepartureItem.category}
                      onChange={e => setEditingDepartureItem({ ...editingDepartureItem, category: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      {travel.departureCategories.map(cat => (
                        <option key={cat} value={cat} className="bg-primary text-white">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Quantidade</label>
                    <input
                      type="number"
                      min={1}
                      value={editingDepartureItem.quantity}
                      onChange={e =>
                        setEditingDepartureItem({ ...editingDepartureItem, quantity: Math.max(1, parseInt(e.target.value) || 1) })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Observações / Cuidados
                  </label>
                  <input
                    type="text"
                    value={editingDepartureItem.notes || ''}
                    onChange={e => setEditingDepartureItem({ ...editingDepartureItem, notes: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingDepartureItem(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary text-xs font-bold uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditDepartureItem}
                  disabled={!editingDepartureItem.name.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider shadow-glow-primary"
                >
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL: ADICIONAR ITEM RETORNO (GANHO / COMPRADO LÁ)
      ──────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isAddReturnItemModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-primary/95 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-black text-white">Item Ganho ou Comprado no Evento</h3>
                <button onClick={() => setIsAddReturnItemModalOpen(false)} className="p-1 rounded-lg text-text-muted hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    O que a equipe ganhou/comprou? *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Troféu de Engenharia, Banner trocado com equipe X..."
                    value={newReturnName}
                    onChange={e => setNewReturnName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Categoria</label>
                    <select
                      value={newReturnCategory}
                      onChange={e => setNewReturnCategory(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="Prêmios & Conquistas" className="bg-primary">
                        Prêmios & Conquistas
                      </option>
                      <option value="Brindes & Lembranças" className="bg-primary">
                        Brindes & Lembranças
                      </option>
                      <option value="Peças Adquiridas Lá" className="bg-primary">
                        Peças Adquiridas Lá
                      </option>
                      <option value="Ferramentas Novas" className="bg-primary">
                        Ferramentas Novas
                      </option>
                      <option value="Outros" className="bg-primary">
                        Outros
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Quantidade</label>
                    <input
                      type="number"
                      min={1}
                      value={newReturnQuantity}
                      onChange={e => setNewReturnQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Detalhes (de quem foi ganho / onde foi guardado)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Presente da equipe 17745, guardado na mala 2..."
                    value={newReturnNotes}
                    onChange={e => setNewReturnNotes(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddReturnItemModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary text-xs font-bold uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddReturnItem}
                  disabled={!newReturnName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider shadow-glow-primary"
                >
                  Registrar Item
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL: EDITAR ITEM DE RETORNO (VOLTA)
      ──────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingReturnItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-primary/95 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-black text-white">Editar Item (Retorno)</h3>
                <button onClick={() => setEditingReturnItem(null)} className="p-1 rounded-lg text-text-muted hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Nome do Item *
                  </label>
                  <input
                    type="text"
                    value={editingReturnItem.name}
                    onChange={e => setEditingReturnItem({ ...editingReturnItem, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Categoria</label>
                    <input
                      type="text"
                      value={editingReturnItem.category}
                      onChange={e => setEditingReturnItem({ ...editingReturnItem, category: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Quantidade</label>
                    <input
                      type="number"
                      min={1}
                      value={editingReturnItem.quantity}
                      onChange={e =>
                        setEditingReturnItem({ ...editingReturnItem, quantity: Math.max(1, parseInt(e.target.value) || 1) })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Origem do Item</label>
                  <select
                    value={editingReturnItem.origin}
                    onChange={e => setEditingReturnItem({ ...editingReturnItem, origin: e.target.value as any })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="departure">Veio da Ida</option>
                    <option value="acquired_at_event">Adquirido / Ganho no Evento</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Observações / Cuidados
                  </label>
                  <input
                    type="text"
                    value={editingReturnItem.notes || ''}
                    onChange={e => setEditingReturnItem({ ...editingReturnItem, notes: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingReturnItem(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary text-xs font-bold uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditReturnItem}
                  disabled={!editingReturnItem.name.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider shadow-glow-primary"
                >
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL: ADICIONAR TAREFA SAÍDA DO HOTEL
      ──────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isAddHotelItemModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-primary/95 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-black text-white">Nova Checagem: Saída do Hotel</h3>
                <button onClick={() => setIsAddHotelItemModalOpen(false)} className="p-1 rounded-lg text-text-muted hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Descrição da Tarefa / Item *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Verificar se todos pegaram a credencial..."
                    value={newHotelTask}
                    onChange={e => setNewHotelTask(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Categoria</label>
                  <select
                    value={newHotelCategory}
                    onChange={e => setNewHotelCategory(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Transporte Arena" className="bg-primary">Transporte Arena</option>
                    <option value="Segurança & Acesso" className="bg-primary">Segurança & Acesso</option>
                    <option value="Alimentação & Hidratação" className="bg-primary">Alimentação & Hidratação</option>
                    <option value="Eletrônica" className="bg-primary">Eletrônica</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddHotelItemModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary text-xs font-bold uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddHotelItem}
                  disabled={!newHotelTask.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider shadow-glow-primary"
                >
                  Salvar Checagem
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL: EDITAR TAREFA SAÍDA DO HOTEL
      ──────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingHotelItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-primary/95 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-black text-white">Editar Checagem (Saída Hotel)</h3>
                <button onClick={() => setEditingHotelItem(null)} className="p-1 rounded-lg text-text-muted hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Descrição da Tarefa *
                  </label>
                  <input
                    type="text"
                    value={editingHotelItem.task}
                    onChange={e => setEditingHotelItem({ ...editingHotelItem, task: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Categoria</label>
                  <input
                    type="text"
                    value={editingHotelItem.category}
                    onChange={e => setEditingHotelItem({ ...editingHotelItem, category: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingHotelItem(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary text-xs font-bold uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditHotelItem}
                  disabled={!editingHotelItem.task.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider shadow-glow-primary"
                >
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL: CRIAR NOVA PARTIDA
      ──────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isNewMatchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-primary/95 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-black text-white">Cadastrar Nova Partida</h3>
                <button onClick={() => setIsNewMatchModalOpen(false)} className="p-1 rounded-lg text-text-muted hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Nome / Número da Partida *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Qualificação #4, Treino #2, Semifinal 1..."
                    value={newMatchNumber}
                    onChange={e => setNewMatchNumber(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Tipo de Round</label>
                    <select
                      value={newMatchRoundType}
                      onChange={e => setNewMatchRoundType(e.target.value as any)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="practice" className="bg-primary">Treino Oficial</option>
                      <option value="qualification" className="bg-primary">Qualificatória</option>
                      <option value="playoff" className="bg-primary">Playoff / Finais</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Aliança</label>
                    <select
                      value={newMatchAlliance}
                      onChange={e => setNewMatchAlliance(e.target.value as any)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="blue" className="bg-primary text-blue-400">Azul</option>
                      <option value="red" className="bg-primary text-red-400">Vermelha</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Horário Previsto (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 14:45"
                    value={newMatchTime}
                    onChange={e => setNewMatchTime(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewMatchModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary text-xs font-bold uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewMatch}
                  disabled={!newMatchNumber.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider shadow-glow-primary"
                >
                  Criar Partida
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL: EDITAR INFORMAÇÕES DA PARTIDA
      ──────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingMatchDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-primary/95 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-black text-white">Editar Dados da Partida</h3>
                <button onClick={() => setEditingMatchDetails(null)} className="p-1 rounded-lg text-text-muted hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Nome / Número da Partida *
                  </label>
                  <input
                    type="text"
                    value={editingMatchDetails.matchNumber}
                    onChange={e => setEditingMatchDetails({ ...editingMatchDetails, matchNumber: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Tipo de Round</label>
                    <select
                      value={editingMatchDetails.roundType}
                      onChange={e => setEditingMatchDetails({ ...editingMatchDetails, roundType: e.target.value as any })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="practice">Treino Oficial</option>
                      <option value="qualification">Qualificatória</option>
                      <option value="playoff">Playoff / Finais</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Aliança</label>
                    <select
                      value={editingMatchDetails.allianceColor}
                      onChange={e => setEditingMatchDetails({ ...editingMatchDetails, allianceColor: e.target.value as any })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="blue">Azul</option>
                      <option value="red">Vermelha</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Horário Previsto</label>
                  <input
                    type="text"
                    value={editingMatchDetails.scheduledTime || ''}
                    onChange={e => setEditingMatchDetails({ ...editingMatchDetails, scheduledTime: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingMatchDetails(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary text-xs font-bold uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveMatchDetails}
                  disabled={!editingMatchDetails.matchNumber.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider shadow-glow-primary"
                >
                  Salvar Dados
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompetitionChecklists;

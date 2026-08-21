import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench, Plus, Search, Filter, CheckCircle2, AlertCircle,
  Clock, XCircle, ChevronRight, Image as ImageIcon, Trash2, Edit3,
  Users, Tag, Sparkles, RefreshCw, UploadCloud, X, ZoomIn, FileDown,
  Layers, Hammer, Cpu, Terminal, Globe, Lightbulb, Box, Share2, Eye
} from 'lucide-react';
import { PrototypeItem, PrototypeType, PrototypeOutcome, PrototypeStatus, PrototypePhoto, UserRole } from '../../types';
import { compressImageToMax100KB, formatBytes } from '../../utils/imageCompressor';

interface PrototypesTabProps {
  currentUser: string;
  userRole: UserRole;
}

const PROTOTYPE_TYPE_INFO: Record<PrototypeType, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  mechanics: { label: 'Mecânica & Estrutura', icon: Hammer, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  electronics: { label: 'Eletrônica & Elétrica', icon: Cpu, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  programming: { label: 'Programação & Autônomo', icon: Terminal, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  software: { label: 'Software & Telemetria', icon: Globe, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  innovation: { label: 'Inovação & Design', icon: Lightbulb, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  '3d_printing': { label: 'Prototipagem 3D', icon: Box, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  outreach: { label: 'Divulgação & B-LEED', icon: Users, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
  other: { label: 'Outro / Geral', icon: Layers, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
};

const OUTCOME_CONFIG: Record<PrototypeOutcome, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  worked: { label: 'Funcionou com Sucesso', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  partially: { label: 'Funcionou Parcialmente', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  failed: { label: 'Não Funcionou (Aprendizado)', icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30' },
  testing: { label: 'Em Testes / Validação', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
};

const STATUS_CONFIG: Record<PrototypeStatus, { label: string; color: string; bg: string }> = {
  in_progress: { label: 'Em Andamento', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  completed: { label: 'Concluído', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  paused: { label: 'Pausado', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  archived: { label: 'Arquivado', color: 'text-slate-400', bg: 'bg-slate-500/10' },
};

export default function PrototypesTab({ currentUser, userRole }: PrototypesTabProps) {
  const [prototypes, setPrototypes] = useState<PrototypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableMembers, setAvailableMembers] = useState<string[]>([]);

  // Filtros e Busca
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modais
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingPrototype, setEditingPrototype] = useState<PrototypeItem | null>(null);
  const [detailPrototype, setDetailPrototype] = useState<PrototypeItem | null>(null);
  const [zoomPhoto, setZoomPhoto] = useState<{ src: string; caption?: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<PrototypeType>('mechanics');
  const [formCustomType, setFormCustomType] = useState('');
  const [formObjective, setFormObjective] = useState('');
  const [formOutcome, setFormOutcome] = useState<PrototypeOutcome>('testing');
  const [formStatus, setFormStatus] = useState<PrototypeStatus>('in_progress');
  const [formConsiderations, setFormConsiderations] = useState('');
  const [formMembers, setFormMembers] = useState<string[]>([]);
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formTagInput, setFormTagInput] = useState('');
  const [formPhotos, setFormPhotos] = useState<PrototypePhoto[]>([]);
  const [compressingPhotos, setCompressingPhotos] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isTech = userRole === 'technician' || ['Jonas', 'Ramon'].includes(currentUser);

  // ─── Carregar Dados ──────────────────────────────────────────────────────────
  const fetchPrototypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects?scope=prototype');
      const data = await res.json();
      if (data.success) {
        setPrototypes(data.prototypes || data.projects || []);
      } else {
        throw new Error(data.error || 'Erro ao carregar protótipos.');
      }

      // Buscar membros da equipe para seleção
      const memRes = await fetch(`/api/members?requester=${encodeURIComponent(currentUser)}`);
      const memData = await memRes.json();
      if (memData.success && Array.isArray(memData.members)) {
        setAvailableMembers(memData.members.map((m: any) => m.username || m.name));
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Erro de conexão com o banco de dados.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchPrototypes();
  }, [fetchPrototypes]);

  // ─── Handlers de Fotos com Compressão Automática < 100 KB ───────────────────
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setCompressingPhotos(true);
    try {
      const newPhotos: PrototypePhoto[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Executa compressão garantindo estritamente <= 100 KB
        const compressed = await compressImageToMax100KB(file, 100 * 1024);
        newPhotos.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          dataUrl: compressed.dataUrl,
          sizeKb: compressed.sizeKb,
          caption: file.name.replace(/\.[^/.]+$/, ''),
          uploadedAt: new Date().toISOString(),
        });
      }
      setFormPhotos(prev => [...prev, ...newPhotos]);
    } catch (err: any) {
      alert(`Erro ao processar e compactar fotos: ${err.message}`);
    } finally {
      setCompressingPhotos(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (photoId: string) => {
    setFormPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const updatePhotoCaption = (photoId: string, caption: string) => {
    setFormPhotos(prev => prev.map(p => p.id === photoId ? { ...p, caption } : p));
  };

  // ─── Abrir Modal de Criação / Edição ─────────────────────────────────────────
  const openCreateModal = () => {
    setEditingPrototype(null);
    setFormTitle('');
    setFormType('mechanics');
    setFormCustomType('');
    setFormObjective('');
    setFormOutcome('testing');
    setFormStatus('in_progress');
    setFormConsiderations('');
    setFormMembers([currentUser]);
    setFormTags([]);
    setFormTagInput('');
    setFormPhotos([]);
    setCreateModalOpen(true);
  };

  const openEditModal = (prototype: PrototypeItem) => {
    setEditingPrototype(prototype);
    setFormTitle(prototype.title);
    setFormType(prototype.projectType);
    setFormCustomType(prototype.customTypeLabel || '');
    setFormObjective(prototype.objective);
    setFormOutcome(prototype.outcome);
    setFormStatus(prototype.status);
    setFormConsiderations(prototype.considerations);
    setFormMembers(prototype.members || [currentUser]);
    setFormTags(prototype.tags || []);
    setFormTagInput('');
    setFormPhotos(prototype.photos || []);
    setCreateModalOpen(true);
  };

  // ─── Salvar Protótipo (POST / PUT) ───────────────────────────────────────────
  const handleSavePrototype = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Por favor, informe o nome do protótipo.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        title: formTitle.trim(),
        projectType: formType,
        customTypeLabel: formType === 'other' ? formCustomType.trim() : undefined,
        objective: formObjective.trim(),
        outcome: formOutcome,
        status: formStatus,
        considerations: formConsiderations.trim(),
        photos: formPhotos,
        members: formMembers.length > 0 ? formMembers : [currentUser],
        tags: formTags,
      };

      let res;
      if (editingPrototype) {
        res = await fetch('/api/projects?scope=prototype', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: currentUser,
            prototypeId: editingPrototype.id,
            prototype: payload,
          }),
        });
      } else {
        res = await fetch('/api/projects?scope=prototype', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: currentUser,
            prototype: payload,
          }),
        });
      }

      const data = await res.json();
      if (data.success) {
        setCreateModalOpen(false);
        fetchPrototypes();
        if (detailPrototype && editingPrototype && detailPrototype.id === editingPrototype.id) {
          setDetailPrototype(data.prototype || data.project);
        }
      } else {
        alert(data.error || 'Erro ao salvar protótipo.');
      }
    } catch (err: any) {
      alert(`Erro na requisição: ${err.message}`);
    } finally {
      setFormSubmitting(false);
    }
  };

  // ─── Excluir Protótipo ───────────────────────────────────────────────────────
  const handleDeletePrototype = async (prototypeId: string) => {
    try {
      const res = await fetch('/api/projects?scope=prototype', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser, prototypeId }),
      });
      const data = await res.json();
      if (data.success) {
        setDeleteConfirmId(null);
        if (detailPrototype?.id === prototypeId) setDetailPrototype(null);
        fetchPrototypes();
      } else {
        alert(data.error || 'Erro ao excluir protótipo.');
      }
    } catch (err: any) {
      alert(`Erro na exclusão: ${err.message}`);
    }
  };

  // ─── Exportar Relatório em Markdown ────────────────────────────────────────
  const exportPrototypeMarkdown = (prototype: PrototypeItem) => {
    const outcomeLabel = OUTCOME_CONFIG[prototype.outcome]?.label || prototype.outcome;
    const typeLabel = prototype.projectType === 'other' && prototype.customTypeLabel 
      ? prototype.customTypeLabel 
      : PROTOTYPE_TYPE_INFO[prototype.projectType]?.label || prototype.projectType;

    const mdContent = `# Relatório de Protótipo: ${prototype.title}
**Tipo:** ${typeLabel}
**Status:** ${STATUS_CONFIG[prototype.status]?.label || prototype.status}
**Resultado:** ${outcomeLabel}
**Data de Criação:** ${new Date(prototype.createdAt).toLocaleDateString('pt-BR')}
**Autor / Responsáveis:** ${prototype.members.join(', ')}

---

## 🎯 Objetivo
${prototype.objective || '_Nenhum objetivo detalhado registrado._'}

---

## 🔍 Análise de Desempenho & Funcionamento
**Resultado Geral:** ${outcomeLabel}

### Considerações Técnicas & Lições Aprendidas:
${prototype.considerations || '_Sem considerações registradas._'}

---

## 📸 Registro Fotográfico
${prototype.photos.length > 0 ? prototype.photos.map((p, idx) => `### Foto ${idx + 1}: ${p.caption || 'Sem legenda'}\n*Registrado em ${new Date(p.uploadedAt).toLocaleString('pt-BR')}*\n`).join('\n') : '_Nenhuma foto anexada._'}
`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prototipo-${prototype.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── Tags Handlers ──────────────────────────────────────────────────────────
  const addTag = () => {
    const val = formTagInput.trim();
    if (val && !formTags.includes(val)) {
      setFormTags([...formTags, val]);
      setFormTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormTags(formTags.filter(t => t !== tag));
  };

  // ─── Filtros Aplicados ──────────────────────────────────────────────────────
  const filteredPrototypes = prototypes.filter(p => {
    const matchesSearch = searchTerm === '' || 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.objective.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.considerations.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.members.some(m => m.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesType = selectedType === 'all' || p.projectType === selectedType;
    const matchesOutcome = selectedOutcome === 'all' || p.outcome === selectedOutcome;
    const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;

    return matchesSearch && matchesType && matchesOutcome && matchesStatus;
  });

  // Métricas do Dashboard de Protótipos
  const totalPrototypes = prototypes.length;
  const workedCount = prototypes.filter(p => p.outcome === 'worked').length;
  const testingCount = prototypes.filter(p => p.outcome === 'testing').length;
  const successRate = totalPrototypes > 0 ? Math.round((workedCount / totalPrototypes) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Header do Módulo ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-glass">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Wrench className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                Protótipos de Bancada
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold uppercase tracking-wider">
                  Testes Rápidos
                </span>
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Validação ágil de hipóteses, mecanismos individuais, fotos compactadas e lições aprendidas.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPrototypes}
            disabled={loading}
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-text-secondary hover:text-white transition-all disabled:opacity-50"
            title="Atualizar dados do banco"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span>Registrar Protótipo</span>
          </button>
        </div>
      </div>

      {/* ── Cards de Métricas ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-primary/40 border border-white/5 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total de Protótipos</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{totalPrototypes}</p>
          <p className="text-[11px] text-text-secondary mt-1">Mecanismos registrados</p>
        </div>

        <div className="bg-primary/40 border border-white/5 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Funcionaram</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400">{workedCount}</p>
          <p className="text-[11px] text-emerald-500/80 mt-1">{successRate}% de aprovação</p>
        </div>

        <div className="bg-primary/40 border border-white/5 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Em Testes</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-400">{testingCount}</p>
          <p className="text-[11px] text-blue-500/80 mt-1">Validações ativas</p>
        </div>

        <div className="bg-primary/40 border border-white/5 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Fotos no Banco</span>
            <ImageIcon className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-cyan-400">
            {prototypes.reduce((acc, p) => acc + (p.photos?.length || 0), 0)}
          </p>
          <p className="text-[11px] text-cyan-500/80 mt-1">Todas &le; 100 KB (Otimizadas)</p>
        </div>
      </div>

      {/* ── Barra de Busca & Filtros ── */}
      <div className="bg-primary/40 border border-white/5 rounded-2xl p-4 sm:p-5 backdrop-blur-md flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por nome, objetivo, responsável, tag..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-amber-500 text-sm transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Filtro de Tipo */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos os Tipos</option>
            {Object.entries(PROTOTYPE_TYPE_INFO).map(([key, info]) => (
              <option key={key} value={key}>{info.label}</option>
            ))}
          </select>

          {/* Filtro de Resultado */}
          <select
            value={selectedOutcome}
            onChange={e => setSelectedOutcome(e.target.value)}
            className="px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos os Resultados</option>
            {Object.entries(OUTCOME_CONFIG).map(([key, info]) => (
              <option key={key} value={key}>{info.label}</option>
            ))}
          </select>

          {/* Filtro de Status */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos os Status</option>
            {Object.entries(STATUS_CONFIG).map(([key, info]) => (
              <option key={key} value={key}>{info.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Lista / Grid de Protótipos ── */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-sm text-text-secondary">Sincronizando protótipos do Supabase...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm text-rose-300">{error}</p>
          <button
            onClick={fetchPrototypes}
            className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold rounded-lg transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      ) : filteredPrototypes.length === 0 ? (
        <div className="py-16 text-center bg-primary/20 border border-white/5 rounded-2xl p-8 space-y-4">
          <Wrench className="w-12 h-12 text-text-muted mx-auto opacity-50" />
          <div>
            <h3 className="text-lg font-bold text-white">Nenhum protótipo encontrado</h3>
            <p className="text-sm text-text-secondary mt-1">
              {searchTerm || selectedType !== 'all' || selectedOutcome !== 'all' || selectedStatus !== 'all'
                ? 'Nenhum protótipo corresponde aos filtros selecionados.'
                : 'Comece registrando o primeiro teste de mecanismo da equipe!'}
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Primeiro Protótipo</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filteredPrototypes.map(prototype => {
              const typeInfo = PROTOTYPE_TYPE_INFO[prototype.projectType] || PROTOTYPE_TYPE_INFO.other;
              const outcomeInfo = OUTCOME_CONFIG[prototype.outcome] || OUTCOME_CONFIG.testing;
              const statusInfo = STATUS_CONFIG[prototype.status] || STATUS_CONFIG.in_progress;
              const TypeIcon = typeInfo.icon;
              const OutcomeIcon = outcomeInfo.icon;

              const isOwnerOrTech = isTech || prototype.createdBy === currentUser || prototype.members.includes(currentUser);

              return (
                <motion.div
                  key={prototype.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-primary/50 hover:bg-primary/70 border border-white/5 hover:border-white/15 rounded-2xl overflow-hidden transition-all duration-300 shadow-glass flex flex-col group"
                >
                  {/* Foto de Capa / Preview */}
                  <div className="relative h-44 bg-black/40 overflow-hidden border-b border-white/5">
                    {prototype.photos && prototype.photos.length > 0 ? (
                      <div className="w-full h-full relative">
                        <img
                          src={prototype.photos[0].dataUrl}
                          alt={prototype.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        {prototype.photos.length > 1 && (
                          <div className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white flex items-center gap-1">
                            <ImageIcon className="w-3 h-3 text-cyan-400" />
                            <span>+{prototype.photos.length - 1} foto{prototype.photos.length > 2 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-text-muted gap-2 bg-gradient-to-br from-white/[0.02] to-transparent">
                        <TypeIcon className={`w-10 h-10 ${typeInfo.color} opacity-40`} />
                        <span className="text-xs font-semibold">Sem fotos anexadas</span>
                      </div>
                    )}

                    {/* Badges de Categoria & Status sobre a foto */}
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${typeInfo.bg} ${typeInfo.color} ${typeInfo.border} backdrop-blur-md flex items-center gap-1`}>
                        <TypeIcon className="w-3 h-3" />
                        {prototype.projectType === 'other' && prototype.customTypeLabel ? prototype.customTypeLabel : typeInfo.label}
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 border border-white/10 ${statusInfo.color} backdrop-blur-md`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Conteúdo do Card */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                        {prototype.title}
                      </h3>

                      {/* Tag de Resultado (Funcionou / Falhou) */}
                      <div className="inline-flex">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${outcomeInfo.bg} ${outcomeInfo.color} ${outcomeInfo.border} flex items-center gap-1.5`}>
                          <OutcomeIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{outcomeInfo.label}</span>
                        </span>
                      </div>

                      {/* Objetivo */}
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed mt-2">
                        {prototype.objective || 'Nenhum objetivo especificado.'}
                      </p>
                    </div>

                    {/* Rodapé do Card */}
                    <div className="pt-3 border-t border-white/5 space-y-3">
                      {/* Membros envolvidos */}
                      <div className="flex items-center justify-between text-[11px] text-text-muted">
                        <div className="flex items-center gap-1.5 truncate">
                          <Users className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                          <span className="truncate">
                            {prototype.members && prototype.members.length > 0 ? prototype.members.join(', ') : prototype.createdBy}
                          </span>
                        </div>
                        <span className="text-[10px] text-text-muted shrink-0">
                          {new Date(prototype.updatedAt || prototype.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => setDetailPrototype(prototype)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-amber-500/20 text-text-primary hover:text-amber-300 border border-white/5 hover:border-amber-500/30 text-xs font-bold transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Detalhes</span>
                        </button>

                        {isOwnerOrTech && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(prototype)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white border border-white/5 transition-all"
                              title="Editar protótipo"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(prototype.id)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-text-secondary hover:text-rose-400 border border-white/5 hover:border-rose-500/30 transition-all"
                              title="Excluir protótipo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Modal de Detalhes Completo ── */}
      <AnimatePresence>
        {detailPrototype && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-primary border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
            >
              {/* Top Header do Modal */}
              <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4 sticky top-0 bg-primary/95 backdrop-blur-xl z-20">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${PROTOTYPE_TYPE_INFO[detailPrototype.projectType]?.bg} ${PROTOTYPE_TYPE_INFO[detailPrototype.projectType]?.color} ${PROTOTYPE_TYPE_INFO[detailPrototype.projectType]?.border}`}>
                      {PROTOTYPE_TYPE_INFO[detailPrototype.projectType]?.label}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${OUTCOME_CONFIG[detailPrototype.outcome]?.bg} ${OUTCOME_CONFIG[detailPrototype.outcome]?.color} ${OUTCOME_CONFIG[detailPrototype.outcome]?.border}`}>
                      {OUTCOME_CONFIG[detailPrototype.outcome]?.label}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-black/40 border border-white/10 ${STATUS_CONFIG[detailPrototype.status]?.color}`}>
                      {STATUS_CONFIG[detailPrototype.status]?.label}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{detailPrototype.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportPrototypeMarkdown(detailPrototype)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white border border-white/10 transition-all"
                    title="Exportar Markdown"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDetailPrototype(null)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white border border-white/10 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Corpo do Modal */}
              <div className="p-6 space-y-6 flex-1">
                {/* Galeria de Fotos */}
                {detailPrototype.photos && detailPrototype.photos.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-cyan-400" />
                      Galeria de Fotos ({detailPrototype.photos.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {detailPrototype.photos.map((photo, i) => (
                        <div
                          key={photo.id || i}
                          onClick={() => setZoomPhoto({ src: photo.dataUrl, caption: photo.caption })}
                          className="relative aspect-video rounded-xl overflow-hidden bg-black/50 border border-white/10 cursor-pointer group shadow-sm hover:border-cyan-500/40 transition-all"
                        >
                          <img
                            src={photo.dataUrl}
                            alt={photo.caption || `Foto ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-white text-xs font-bold transition-opacity">
                            <ZoomIn className="w-4 h-4" />
                            <span>Ampliar</span>
                          </div>
                          {photo.caption && (
                            <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-sm p-1.5 text-[10px] text-white truncate text-center">
                              {photo.caption}
                            </div>
                          )}
                          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-cyan-300">
                            {photo.sizeKb} KB
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Objetivo */}
                <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Objetivo do Protótipo
                  </h4>
                  <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                    {detailPrototype.objective || 'Nenhum objetivo registrado.'}
                  </p>
                </div>

                {/* Considerações e Lições Aprendidas */}
                <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                  <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Considerações Técnicas & Lições Aprendidas
                  </h4>
                  <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                    {detailPrototype.considerations || 'Nenhuma consideração registrada.'}
                  </p>
                </div>

                {/* Informações Complementares */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                    <span className="text-text-muted font-bold block">Responsáveis / Membros:</span>
                    <span className="text-white font-medium">
                      {detailPrototype.members && detailPrototype.members.length > 0 ? detailPrototype.members.join(', ') : detailPrototype.createdBy}
                    </span>
                  </div>

                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                    <span className="text-text-muted font-bold block">Registrado por:</span>
                    <span className="text-white font-medium">
                      {detailPrototype.createdBy} em {new Date(detailPrototype.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                {detailPrototype.tags && detailPrototype.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    <Tag className="w-3.5 h-3.5 text-text-muted mr-1" />
                    {detailPrototype.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-text-secondary font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Rodapé do Modal */}
              <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end gap-3">
                <button
                  onClick={() => setDetailPrototype(null)}
                  className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all"
                >
                  Fechar
                </button>
                {(isTech || detailPrototype.createdBy === currentUser || detailPrototype.members.includes(currentUser)) && (
                  <button
                    onClick={() => {
                      const proto = detailPrototype;
                      setDetailPrototype(null);
                      openEditModal(proto);
                    }}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Protótipo</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal de Zoom da Foto ── */}
      <AnimatePresence>
        {zoomPhoto && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg"
            onClick={() => setZoomPhoto(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={zoomPhoto.src}
                alt={zoomPhoto.caption || 'Foto ampliada'}
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />
              {zoomPhoto.caption && (
                <p className="text-sm font-bold text-white mt-3 px-4 py-1.5 rounded-full bg-black/60 border border-white/10">
                  {zoomPhoto.caption}
                </p>
              )}
              <button
                onClick={() => setZoomPhoto(null)}
                className="absolute -top-4 -right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal de Confirmação de Exclusão ── */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-primary border border-rose-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-bold text-white">Confirmar Exclusão</h3>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                Tem certeza que deseja excluir este protótipo permanentemente do Supabase? Essa ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeletePrototype(deleteConfirmId)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-500/20"
                >
                  Excluir Definitivamente
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal de Criação / Edição de Protótipo ── */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-primary border border-white/10 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col"
            >
              {/* Header do Form */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-primary/95 backdrop-blur-xl z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {editingPrototype ? 'Editar Protótipo' : 'Registrar Novo Protótipo'}
                    </h2>
                    <p className="text-xs text-text-secondary">
                      Grave hipóteses, fotos e testes no Supabase
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSavePrototype} className="p-6 space-y-5 flex-1">
                {/* Nome do Protótipo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Nome do Protótipo / Mecanismo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Garra Rotacional com Servomotores v2"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-amber-500 text-sm transition-all"
                  />
                </div>

                {/* Grid: Tipo de Protótipo e Funcionou? */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tipo de Protótipo */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                      Área / Tipo de Protótipo *
                    </label>
                    <select
                      value={formType}
                      onChange={e => setFormType(e.target.value as PrototypeType)}
                      className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white focus:outline-none focus:border-amber-500 text-sm"
                    >
                      {Object.entries(PROTOTYPE_TYPE_INFO).map(([key, info]) => (
                        <option key={key} value={key}>{info.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Resultado: Funcionou? */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                      Resultado / Funcionou? *
                    </label>
                    <select
                      value={formOutcome}
                      onChange={e => setFormOutcome(e.target.value as PrototypeOutcome)}
                      className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white focus:outline-none focus:border-amber-500 text-sm"
                    >
                      {Object.entries(OUTCOME_CONFIG).map(([key, info]) => (
                        <option key={key} value={key}>{info.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Campo customizado se 'other' */}
                {formType === 'other' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                      Especifique o Tipo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Gestão de Suprimentos / Mecanismo Custom"
                      value={formCustomType}
                      onChange={e => setFormCustomType(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-sm"
                    />
                  </div>
                )}

                {/* Status do Protótipo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Status de Andamento
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(STATUS_CONFIG).map(([key, info]) => (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setFormStatus(key as PrototypeStatus)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                          formStatus === key
                            ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                            : 'bg-black/20 border-white/5 text-text-muted hover:text-white'
                        }`}
                      >
                        {info.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Objetivo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Objetivo do Protótipo
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Qual problema este protótipo visa resolver? Quais eram as metas quantitativas ou qualitativas?"
                    value={formObjective}
                    onChange={e => setFormObjective(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-amber-500 text-sm transition-all"
                  />
                </div>

                {/* Considerações e Lições Aprendidas */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Considerações Técnicas & Lições Aprendidas
                  </label>
                  <textarea
                    rows={3}
                    placeholder="O que funcionou? O que deu errado e como foi ajustado? Quais melhorias ficam para a próxima iteração?"
                    value={formConsiderations}
                    onChange={e => setFormConsiderations(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-amber-500 text-sm transition-all"
                  />
                </div>

                {/* Seção de Fotos com Redução Automática para < 100 KB */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-cyan-400" />
                      Fotos do Protótipo (&le; 100 KB cada)
                    </label>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      Compressão automática via Canvas
                    </span>
                  </div>

                  {/* Dropzone / Upload Button */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/15 hover:border-cyan-500/50 rounded-2xl p-5 text-center cursor-pointer bg-white/[0.01] hover:bg-cyan-500/[0.03] transition-all group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto group-hover:scale-110 transition-transform mb-2" />
                    <p className="text-xs font-bold text-white">
                      Clique ou arraste fotos aqui
                    </p>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      As imagens serão redimensionadas e compactadas para &le; 100 KB automaticamente.
                    </p>
                  </div>

                  {compressingPhotos && (
                    <div className="flex items-center justify-center gap-2 py-2 text-xs text-cyan-400 font-semibold">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Compactando fotos...</span>
                    </div>
                  )}

                  {/* Lista de Fotos anexadas */}
                  {formPhotos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                      {formPhotos.map(photo => (
                        <div
                          key={photo.id}
                          className="relative group rounded-xl overflow-hidden bg-black/40 border border-white/10 p-1"
                        >
                          <div className="aspect-video w-full rounded-lg overflow-hidden relative">
                            <img
                              src={photo.dataUrl}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-emerald-400">
                              {photo.sizeKb} KB
                            </div>
                            <button
                              type="button"
                              onClick={() => removePhoto(photo.id)}
                              className="absolute top-1 right-1 p-1 rounded-md bg-rose-600/80 hover:bg-rose-600 text-white transition-all"
                              title="Remover foto"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Legenda (opcional)"
                            value={photo.caption || ''}
                            onChange={e => updatePhotoCaption(photo.id, e.target.value)}
                            className="w-full mt-1.5 px-2 py-1 rounded bg-black/40 border border-white/10 text-[11px] text-white focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Membros Envolvidos */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Membros Envolvidos
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl bg-black/20 border border-white/10">
                    {availableMembers.map(member => {
                      const isSelected = formMembers.includes(member);
                      return (
                        <button
                          type="button"
                          key={member}
                          onClick={() => {
                            if (isSelected) {
                              setFormMembers(formMembers.filter(m => m !== member));
                            } else {
                              setFormMembers([...formMembers, member]);
                            }
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                            isSelected
                              ? 'bg-amber-600/20 border-amber-500/40 text-amber-300'
                              : 'bg-white/5 border-white/5 text-text-muted hover:text-white'
                          }`}
                        >
                          {member}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Tags do Protótipo
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: chassi, intake, autonomia, pid..."
                      value={formTagInput}
                      onChange={e => setFormTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                    >
                      Adicionar
                    </button>
                  </div>
                  {formTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {formTags.map(tag => (
                        <span
                          key={tag}
                          className="text-[11px] px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-1"
                        >
                          #{tag}
                          <button type="button" onClick={() => removeTag(tag)} className="hover:text-white">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rodapé e Submit */}
                <div className="pt-4 border-t border-white/10 flex justify-end gap-3 sticky bottom-0 bg-primary/95 backdrop-blur-xl py-3">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting || compressingPhotos}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {formSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Salvando no Supabase...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{editingPrototype ? 'Salvar Alterações' : 'Criar Protótipo'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

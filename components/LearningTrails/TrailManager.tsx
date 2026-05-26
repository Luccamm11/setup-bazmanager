import React, { useState } from 'react';
import { Plus, X, Save, Edit2, Trash2, ArrowLeft, Target } from 'lucide-react';
import { LearningTrail, TrailStage, Competency, PillarType } from './types';

interface TrailManagerProps {
  definitions: LearningTrail[];
  onSave: (newDefs: LearningTrail[]) => void;
  onClose: () => void;
}

export const TrailManager: React.FC<TrailManagerProps> = ({ definitions, onSave, onClose }) => {
  const [localDefs, setLocalDefs] = useState<LearningTrail[]>(definitions);
  const [editingTrailId, setEditingTrailId] = useState<string | null>(null);

  const activeTrail = localDefs.find(t => t.id === editingTrailId);

  const handleCreateTrail = () => {
    const newTrail: LearningTrail = {
      id: `trail_${Date.now()}`,
      title: 'Nova Trilha',
      description: 'Descrição da trilha...',
      stages: []
    };
    setLocalDefs([...localDefs, newTrail]);
    setEditingTrailId(newTrail.id);
  };

  const handleUpdateTrail = (updates: Partial<LearningTrail>) => {
    if (!editingTrailId) return;
    setLocalDefs(defs => defs.map(t => t.id === editingTrailId ? { ...t, ...updates } : t));
  };

  const handleDeleteTrail = (trailId: string) => {
    if (confirm('Tem certeza que deseja excluir esta trilha? (O progresso atual dos membros será arquivado)')) {
      setLocalDefs(defs => defs.filter(t => t.id !== trailId));
      if (editingTrailId === trailId) setEditingTrailId(null);
    }
  };

  const handleAddStage = () => {
    if (!editingTrailId || !activeTrail) return;
    const newStage: TrailStage = {
      id: `stage_${Date.now()}`,
      level: `Etapa ${activeTrail.stages.length + 1}`,
      competencies: []
    };
    handleUpdateTrail({ stages: [...activeTrail.stages, newStage] });
  };

  const handleUpdateStage = (stageId: string, updates: Partial<TrailStage>) => {
    if (!activeTrail) return;
    const updatedStages = activeTrail.stages.map(s => s.id === stageId ? { ...s, ...updates } : s);
    handleUpdateTrail({ stages: updatedStages });
  };

  const handleDeleteStage = (stageId: string) => {
    if (!activeTrail) return;
    if (confirm('Excluir esta etapa?')) {
      handleUpdateTrail({ stages: activeTrail.stages.filter(s => s.id !== stageId) });
    }
  };

  const handleAddCompetency = (stageId: string) => {
    if (!activeTrail) return;
    const newComp: Competency = {
      id: `comp_${Date.now()}`,
      title: 'Nova Missão',
      description: '',
      pillar: 'Desenvolvimento Autônomo',
      evaluationMethod: '',
      xpReward: 50
    };
    const updatedStages = activeTrail.stages.map(s => {
      if (s.id === stageId) {
        return { ...s, competencies: [...s.competencies, newComp] };
      }
      return s;
    });
    handleUpdateTrail({ stages: updatedStages });
  };

  const handleUpdateCompetency = (stageId: string, compId: string, updates: Partial<Competency>) => {
    if (!activeTrail) return;
    const updatedStages = activeTrail.stages.map(s => {
      if (s.id === stageId) {
        return {
          ...s,
          competencies: s.competencies.map(c => c.id === compId ? { ...c, ...updates } : c)
        };
      }
      return s;
    });
    handleUpdateTrail({ stages: updatedStages });
  };

  const handleDeleteCompetency = (stageId: string, compId: string) => {
    if (!activeTrail) return;
    const updatedStages = activeTrail.stages.map(s => {
      if (s.id === stageId) {
        return { ...s, competencies: s.competencies.filter(c => c.id !== compId) };
      }
      return s;
    });
    handleUpdateTrail({ stages: updatedStages });
  };

  const handleSaveChanges = () => {
    onSave(localDefs);
  };

  return (
    <div className="bg-background absolute inset-0 z-40 overflow-y-auto pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg text-text-secondary hover:text-white transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Gerenciador de Trilhas</h2>
          </div>
          <button
            onClick={handleSaveChanges}
            className="flex items-center gap-2 px-6 py-2.5 bg-accent-primary hover:bg-accent-secondary text-white font-bold rounded-xl transition-colors shadow-glow-primary"
          >
            <Save size={18} /> Salvar Alterações
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - List of Trails */}
          <div className="lg:col-span-1 space-y-4">
            <button
              onClick={handleCreateTrail}
              className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-white/20 hover:border-accent-primary text-text-secondary hover:text-white rounded-xl transition-colors font-bold"
            >
              <Plus size={18} /> Nova Trilha
            </button>

            <div className="space-y-2">
              {localDefs.map(trail => (
                <div 
                  key={trail.id}
                  onClick={() => setEditingTrailId(trail.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center group ${
                    editingTrailId === trail.id 
                      ? 'bg-accent-primary/10 border-accent-primary/50 text-white' 
                      : 'bg-surface border-white/5 text-text-secondary hover:bg-white/5 hover:border-white/10 hover:text-white'
                  }`}
                >
                  <span className="font-bold truncate pr-2">{trail.title}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteTrail(trail.id); }}
                    className={`p-1.5 rounded-lg text-red-400 hover:bg-red-400/20 opacity-0 group-hover:opacity-100 transition-all ${editingTrailId === trail.id ? 'opacity-100' : ''}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Main Editor */}
          <div className="lg:col-span-3">
            {!activeTrail ? (
              <div className="bg-surface/50 border border-white/5 rounded-2xl p-12 text-center h-full flex flex-col justify-center items-center">
                <Target className="w-12 h-12 text-zinc-600 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Selecione ou crie uma trilha</h3>
                <p className="text-text-secondary">Escolha uma trilha na barra lateral para editar suas etapas e missões.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-surface border border-white/10 rounded-2xl p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5">Título da Trilha</label>
                      <input 
                        value={activeTrail.title}
                        onChange={e => handleUpdateTrail({ title: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-xl focus:outline-none focus:border-accent-primary"
                        placeholder="Ex: Trilha de Programação Bazinga"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5">Descrição Geral</label>
                      <textarea 
                        value={activeTrail.description}
                        onChange={e => handleUpdateTrail({ description: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent-primary min-h-[80px] resize-none"
                        placeholder="Descreva o objetivo desta trilha..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white">Etapas ({activeTrail.stages.length})</h3>
                  <button 
                    onClick={handleAddStage}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors text-sm"
                  >
                    <Plus size={16} /> Adicionar Etapa
                  </button>
                </div>

                <div className="space-y-6">
                  {activeTrail.stages.map((stage, sIdx) => (
                    <div key={stage.id} className="bg-surface/80 border border-white/10 rounded-2xl overflow-hidden">
                      <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
                        <div className="flex-1 flex items-center gap-3">
                          <span className="bg-accent-primary/20 text-accent-primary font-black px-3 py-1 rounded-lg text-sm">
                            {sIdx + 1}
                          </span>
                          <input 
                            value={stage.level}
                            onChange={e => handleUpdateStage(stage.id, { level: e.target.value })}
                            className="bg-transparent border-none text-white font-bold text-lg focus:outline-none w-full max-w-sm"
                            placeholder="Nome da Etapa (Ex: Iniciante)"
                          />
                        </div>
                        <button 
                          onClick={() => handleDeleteStage(stage.id)}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="p-4 space-y-4">
                        {stage.competencies.map((comp) => (
                          <div key={comp.id} className="bg-black/40 border border-white/5 rounded-xl p-4 relative group">
                            <button 
                              onClick={() => handleDeleteCompetency(stage.id, comp.id)}
                              className="absolute top-4 right-4 p-1.5 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-400/10 rounded transition-all"
                            >
                              <X size={16} />
                            </button>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Missão (Título)</label>
                                  <input 
                                    value={comp.title}
                                    onChange={e => handleUpdateCompetency(stage.id, comp.id, { title: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-bold focus:outline-none focus:border-accent-primary"
                                    placeholder="Ex: Montar Caixa de Redução"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Descrição</label>
                                  <textarea 
                                    value={comp.description}
                                    onChange={e => handleUpdateCompetency(stage.id, comp.id, { description: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-primary min-h-[70px] resize-none"
                                    placeholder="O que o aluno precisa estudar ou fazer?"
                                  />
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Método de Avaliação</label>
                                  <input 
                                    value={comp.evaluationMethod}
                                    onChange={e => handleUpdateCompetency(stage.id, comp.id, { evaluationMethod: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-primary"
                                    placeholder="Como será provado que ele aprendeu?"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Pilar B-LEED</label>
                                    <select 
                                      value={comp.pillar}
                                      onChange={e => handleUpdateCompetency(stage.id, comp.id, { pillar: e.target.value as PillarType })}
                                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-primary"
                                    >
                                      <option value="Desenvolvimento Autônomo">Desenvolvimento Autônomo</option>
                                      <option value="Mentoria Estratégica">Mentoria Estratégica</option>
                                      <option value="Aprendizagem Coletiva">Aprendizagem Coletiva</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">XP (Recompensa)</label>
                                    <input 
                                      type="number"
                                      value={comp.xpReward}
                                      onChange={e => handleUpdateCompetency(stage.id, comp.id, { xpReward: Number(e.target.value) })}
                                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-primary"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <button 
                          onClick={() => handleAddCompetency(stage.id)}
                          className="w-full py-3 border border-dashed border-white/10 hover:border-white/30 text-text-muted hover:text-white rounded-xl transition-colors font-bold text-sm flex items-center justify-center gap-2"
                        >
                          <Plus size={16} /> Adicionar Missão à Etapa
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {activeTrail.stages.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-text-secondary text-sm">Esta trilha ainda não possui etapas.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

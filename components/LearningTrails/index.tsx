import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Shield, Users, Target, CheckCircle, Clock, Zap, Plus, Settings, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UserRole } from '../../types';
import { ALL_MEMBERS } from '../../constants';
import { LearningTrail, MemberTrailData, ProgressStatus, LearningTrailsData } from './types';
import { TrailManager } from './TrailManager';

interface LearningTrailsProps {
  currentUser: string;
  userRole: UserRole;
}

const LearningTrails: React.FC<LearningTrailsProps> = ({ currentUser, userRole }) => {
  const { t } = useTranslation('common');
  const [isLoading, setIsLoading] = useState(true);
  
  const [definitions, setDefinitions] = useState<LearningTrail[]>([]);
  const [memberProgress, setMemberProgress] = useState<MemberTrailData[]>([]);
  
  const [selectedMember, setSelectedMember] = useState<string>(currentUser);

  // Modal states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTrailId, setAssignTrailId] = useState<string>('');
  const [assignMember, setAssignMember] = useState<string>(currentUser);
  
  // Manager State
  const [isManaging, setIsManaging] = useState(false);

  useEffect(() => {
    if (userRole === 'member') {
      setSelectedMember(currentUser);
    }
  }, [userRole, currentUser]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/crud?type=learning_trails');
      const resData = await res.json();
      if (resData.success && resData.learning_trails) {
        const data = resData.learning_trails as LearningTrailsData;
        setDefinitions(data.definitions || []);
        setMemberProgress(data.progress || []);
      }
    } catch (err) {
      console.error('Failed to load learning trails:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async (newDefs: LearningTrail[], newProgress: MemberTrailData[]) => {
    setDefinitions(newDefs);
    setMemberProgress(newProgress);
    try {
      await fetch('/api/crud?type=learning_trails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          learning_trails: { 
            definitions: newDefs, 
            progress: newProgress 
          } 
        })
      });
    } catch (err) {
      console.error('Failed to save learning trails:', err);
    }
  };

  const handleSaveDefinitions = (newDefs: LearningTrail[]) => {
    // When definitions change, we might have deleted trails or stages.
    // If a trail is deleted, archive member progress for that trail
    const existingTrailIds = new Set(newDefs.map(d => d.id));
    
    const updatedProgress = memberProgress.map(p => {
      if (!existingTrailIds.has(p.trailId)) {
        return { ...p, isArchived: true };
      }
      return p;
    });

    saveData(newDefs, updatedProgress);
    setIsManaging(false);
  };

  const handleAssignTrail = () => {
    if (!assignTrailId) {
      alert('Selecione uma trilha válida.');
      return;
    }

    const trailDef = definitions.find(d => d.id === assignTrailId);
    if (!trailDef || trailDef.stages.length === 0) {
      alert('Esta trilha não possui etapas. Adicione etapas no Gerenciador primeiro.');
      return;
    }

    // Check if member already has this active trail
    const existing = memberProgress.find(t => t.username === assignMember && t.trailId === assignTrailId && !t.isArchived);
    if (existing) {
      alert('Este membro já possui esta trilha ativa.');
      return;
    }

    const initialStageId = trailDef.stages[0].id;

    const newTrailAssignment: MemberTrailData = {
      username: assignMember,
      trailId: assignTrailId,
      activeStageId: initialStageId,
      progress: {},
      assignedBy: currentUser,
      assignedAt: new Date().toISOString(),
      isArchived: false
    };

    saveData(definitions, [...memberProgress, newTrailAssignment]);
    setIsAssignModalOpen(false);
  };

  const handleUpdateCompetencyStatus = (memberUsername: string, trailId: string, competencyId: string, newStatus: ProgressStatus) => {
    const updated = memberProgress.map(t => {
      if (t.username === memberUsername && t.trailId === trailId && !t.isArchived) {
        return {
          ...t,
          progress: {
            ...t.progress,
            [competencyId]: {
              competencyId,
              status: newStatus,
              updatedAt: new Date().toISOString()
            }
          }
        };
      }
      return t;
    });
    saveData(definitions, updated);
  };

  const handleAdvanceStage = (memberUsername: string, trailId: string, currentStageId: string) => {
    const trailDef = definitions.find(d => d.id === trailId);
    if (!trailDef) return;

    const stageIndex = trailDef.stages.findIndex(s => s.id === currentStageId);
    if (stageIndex === -1 || stageIndex >= trailDef.stages.length - 1) {
      alert('Este aluno já está na última etapa desta trilha!');
      return;
    }

    const nextStageId = trailDef.stages[stageIndex + 1].id;

    if (confirm(`Avançar aluno para a próxima etapa (${trailDef.stages[stageIndex + 1].level})?`)) {
      const updated = memberProgress.map(t => {
        if (t.username === memberUsername && t.trailId === trailId && !t.isArchived) {
          return {
            ...t,
            activeStageId: nextStageId
          };
        }
        return t;
      });
      saveData(definitions, updated);
    }
  };

  const visibleTrails = selectedMember === 'Todos' 
    ? memberProgress.filter(t => !t.isArchived)
    : memberProgress.filter(t => t.username === selectedMember && !t.isArchived);

  const getStatusColor = (status?: ProgressStatus) => {
    switch(status) {
      case 'completed': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'review': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'in_progress': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default: return 'text-zinc-500 bg-white/5 border-white/10';
    }
  };

  const getStatusLabel = (status?: ProgressStatus) => {
    switch(status) {
      case 'completed': return 'Concluído';
      case 'review': return 'Em Revisão';
      case 'in_progress': return 'Em Andamento';
      default: return 'Não Iniciado';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64 text-white">Carregando Trilhas...</div>;
  }

  if (isManaging && userRole === 'technician') {
    return <TrailManager definitions={definitions} onSave={handleSaveDefinitions} onClose={() => setIsManaging(false)} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            Trilhas de Aprendizagem
          </h2>
          <p className="text-text-secondary mt-1 text-sm">Desenvolvimento individual focado nos pilares B-LEED.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          {userRole === 'technician' && (
            <button
              onClick={() => setIsManaging(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-colors text-sm whitespace-nowrap"
            >
              <Settings size={18} /> Gerenciar Trilhas
            </button>
          )}

          {userRole === 'technician' && (
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary transition-colors text-sm font-bold"
            >
              <option value="Todos">Visão Geral (Todos)</option>
              <option value={currentUser}>Minhas Trilhas</option>
              <optgroup label="Membros">
                {ALL_MEMBERS.map(member => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </optgroup>
            </select>
          )}

          {userRole === 'technician' && (
            <button
              onClick={() => {
                if (definitions.length === 0) {
                  alert('Crie ao menos uma Trilha no Gerenciador antes de atribuir.');
                  return;
                }
                setAssignTrailId(definitions[0].id);
                setIsAssignModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent-primary hover:bg-accent-secondary text-white font-bold rounded-xl transition-colors shadow-glow-primary text-sm whitespace-nowrap"
            >
              <Plus size={18} /> Atribuir Trilha
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visibleTrails.length === 0 ? (
          <div className="col-span-full bg-surface/50 border border-white/10 rounded-2xl p-12 text-center">
            <Target className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhuma trilha ativa encontrada</h3>
            <p className="text-text-secondary">
              {selectedMember === currentUser 
                ? 'Você ainda não possui nenhuma trilha de aprendizagem ativa. Fale com um técnico.' 
                : 'Este membro não possui trilhas ativas.'}
            </p>
          </div>
        ) : (
          visibleTrails.map((trailData, idx) => {
            const trailDef = definitions.find(d => d.id === trailData.trailId);
            if (!trailDef) return null; // Trail might have been deleted, but not archived properly if data is inconsistent

            const isCurrentStageCompleted = () => {
              const currentStage = trailDef.stages.find(s => s.id === trailData.activeStageId);
              if (!currentStage || currentStage.competencies.length === 0) return false;
              return currentStage.competencies.every(c => trailData.progress[c.id]?.status === 'completed');
            };

            const canAdvance = userRole === 'technician' && isCurrentStageCompleted();
            const currentStageIndex = trailDef.stages.findIndex(s => s.id === trailData.activeStageId);
            const isLastStage = currentStageIndex === trailDef.stages.length - 1;

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={`${trailData.username}-${trailData.trailId}`}
                className="bg-surface/80 border border-white/10 rounded-2xl overflow-hidden shadow-lg flex flex-col"
              >
                {/* Header */}
                <div className="p-5 border-b border-white/10 bg-gradient-to-r from-black/40 to-transparent">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {selectedMember === 'Todos' && (
                          <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Users size={10} /> {trailData.username}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-black text-white">{trailDef.title}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Etapa Atual</p>
                      <p className="text-sm font-bold text-white">
                        {trailDef.stages.find(s => s.id === trailData.activeStageId)?.level || 'Desconhecida'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{trailDef.description}</p>
                </div>

                {/* Stages & Competencies */}
                <div className="p-5 space-y-6 bg-black/20 flex-1">
                  {trailDef.stages.map(stage => (
                    <div key={stage.id} className={`space-y-3 ${stage.id !== trailData.activeStageId && 'opacity-60 grayscale'}`}>
                      <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/10 pb-2 flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <CheckCircle size={14} className={stage.id === trailData.activeStageId ? 'text-blue-400' : 'text-zinc-500'} />
                          Nível: {stage.level}
                        </span>
                        
                        {/* Botão de Avançar Etapa (Técnico) */}
                        {stage.id === trailData.activeStageId && canAdvance && !isLastStage && (
                          <button 
                            onClick={() => handleAdvanceStage(trailData.username, trailData.trailId, stage.id)}
                            className="bg-accent-primary/20 text-accent-primary hover:bg-accent-primary hover:text-white px-3 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-glow-primary"
                          >
                            Avançar Aluno <ArrowRight size={14} />
                          </button>
                        )}
                        {stage.id === trailData.activeStageId && isLastStage && isCurrentStageCompleted() && (
                          <span className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded">Trilha Finalizada! 🎉</span>
                        )}
                      </h4>
                      
                      {stage.competencies.length === 0 ? (
                        <p className="text-xs text-text-muted italic">Nenhuma missão nesta etapa.</p>
                      ) : (
                        <div className="space-y-3">
                          {stage.competencies.map(comp => {
                            const p = trailData.progress[comp.id];
                            const status = p?.status || 'pending';
                            
                            return (
                              <div key={comp.id} className="bg-black/40 border border-white/5 rounded-xl p-4 transition-all hover:border-white/10">
                                <div className="flex justify-between items-start gap-4 mb-2">
                                  <div>
                                    <h5 className="text-sm font-bold text-white leading-tight">{comp.title}</h5>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[9px] font-bold text-zinc-400 bg-white/5 px-2 py-0.5 rounded uppercase tracking-wider">
                                        {comp.pillar}
                                      </span>
                                      <span className="text-[9px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded flex items-center gap-0.5">
                                        <Zap size={10} /> {comp.xpReward} XP
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${getStatusColor(status)}`}>
                                    {getStatusLabel(status)}
                                  </div>
                                </div>
                                
                                <p className="text-xs text-text-secondary mb-3">{comp.description}</p>
                                
                                <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.05] mb-3">
                                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Target size={12} /> Avaliação
                                  </p>
                                  <p className="text-xs text-zinc-300 italic">"{comp.evaluationMethod}"</p>
                                </div>

                                {/* Action Buttons based on Role & Status */}
                                <div className="flex justify-end gap-2 border-t border-white/5 pt-3">
                                  {(userRole === 'member' && (currentUser === trailData.username)) && (
                                    <>
                                      {status === 'pending' && (
                                        <button 
                                          onClick={() => handleUpdateCompetencyStatus(trailData.username, trailData.trailId, comp.id, 'in_progress')}
                                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                                        >
                                          Iniciar Estudo
                                        </button>
                                      )}
                                      {status === 'in_progress' && (
                                        <button 
                                          onClick={() => handleUpdateCompetencyStatus(trailData.username, trailData.trailId, comp.id, 'review')}
                                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                                        >
                                          Solicitar Avaliação
                                        </button>
                                      )}
                                      {status === 'review' && (
                                        <span className="text-xs font-bold text-yellow-500 flex items-center gap-1">
                                          <Clock size={14} /> Aguardando Técnico
                                        </span>
                                      )}
                                    </>
                                  )}

                                  {userRole === 'technician' && (
                                    <>
                                      {status === 'review' && (
                                        <button 
                                          onClick={() => handleUpdateCompetencyStatus(trailData.username, trailData.trailId, comp.id, 'completed')}
                                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors flex items-center gap-1 shadow-[0_0_15px_rgba(74,222,128,0.2)]"
                                        >
                                          <CheckCircle size={14} /> Aprovar Missão
                                        </button>
                                      )}
                                      {status === 'completed' && (
                                        <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                                          <CheckCircle size={14} /> Aprovado
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Assign Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Atribuir Trilha</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Membro</label>
                <select
                  value={assignMember}
                  onChange={e => setAssignMember(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary"
                >
                  {ALL_MEMBERS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Trilha de Aprendizagem</label>
                <select
                  value={assignTrailId}
                  onChange={e => setAssignTrailId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary"
                >
                  {definitions.map(trail => (
                    <option key={trail.id} value={trail.id}>{trail.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-bold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignTrail}
                className="px-6 py-2 bg-accent-primary hover:bg-accent-secondary text-white rounded-xl transition-colors font-bold text-sm shadow-glow-primary"
              >
                Atribuir Trilha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningTrails;

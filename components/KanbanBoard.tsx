import React, { useState, useEffect } from 'react';
import { KanbanTask, KanbanStatus, TeamMission, UserRole } from '../types';
import { Plus, GripVertical, Users, Shield, Target } from 'lucide-react';
import { ALL_MEMBERS } from './tech/AttendanceDashboard'; // Re-use member list or define locally

interface KanbanBoardProps {
  currentUser: string;
  userRole: UserRole;
  missions: TeamMission[];
  onCompleteMission: (missionId: string) => void;
}

const KANBAN_COLUMNS: { id: KanbanStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'A Fazer', color: 'border-blue-500/50 bg-blue-500/10' },
  { id: 'in_progress', label: 'Em Andamento', color: 'border-yellow-500/50 bg-yellow-500/10' },
  { id: 'done', label: 'Concluído', color: 'border-green-500/50 bg-green-500/10' },
];

export const TEAM_MEMBERS = [
  'Danilo', 'Rafael', 'João Paulo', 'João Victor', 'Matheus',
  'Icaro', 'Caio', 'Bruno', 'Maria Luiza', 'Luiza', 'Lucca'
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({ currentUser, userRole, missions, onCompleteMission }) => {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string>(currentUser);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskMissionId, setNewTaskMissionId] = useState<string>('');

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  useEffect(() => {
    // If user is member, lock to themselves
    if (userRole === 'member') {
      setSelectedMember(currentUser);
    }
  }, [userRole, currentUser]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/kanban');
      const data = await res.json();
      if (data.success && data.tasks) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error('Failed to load kanban tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTasks = async (newTasks: KanbanTask[]) => {
    setTasks(newTasks);
    try {
      await fetch('/api/kanban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: newTasks })
      });
    } catch (err) {
      console.error('Failed to save kanban tasks:', err);
    }
  };

  // Sync Missions into Kanban dynamically?
  // Or just manual creation for now. We will provide a button to "Import my missions"
  const handleImportMissions = () => {
    const myMissions = missions.filter(m => 
      (m.assignedTo.length === 0 || m.assignedTo.includes(selectedMember)) &&
      !m.completedBy.includes(selectedMember)
    );

    const existingMissionIds = tasks.filter(t => t.assignee === selectedMember && t.missionId).map(t => t.missionId);
    
    const newTasks: KanbanTask[] = [];
    myMissions.forEach(m => {
      if (!existingMissionIds.includes(m.id)) {
        newTasks.push({
          id: Math.random().toString(36).substring(2, 9),
          title: `[Missão] ${m.title}`,
          description: m.description,
          status: 'todo',
          assignee: selectedMember,
          createdBy: 'system',
          missionId: m.id,
          createdAt: new Date().toISOString()
        });
      }
    });

    if (newTasks.length > 0) {
      saveTasks([...tasks, ...newTasks]);
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;

    const newTask: KanbanTask = {
      id: Math.random().toString(36).substring(2, 9),
      title: newTaskTitle,
      description: newTaskDesc,
      status: 'todo',
      assignee: selectedMember,
      createdBy: currentUser,
      missionId: newTaskMissionId || undefined,
      createdAt: new Date().toISOString()
    };

    saveTasks([...tasks, newTask]);
    setIsModalOpen(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskMissionId('');
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: KanbanStatus) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const taskIndex = tasks.findIndex(t => t.id === draggedTaskId);
    if (taskIndex === -1) return;

    const updatedTasks = [...tasks];
    const task = updatedTasks[taskIndex];
    
    if (task.status !== status) {
      task.status = status;
      saveTasks(updatedTasks);

      // If dropped to done and has missionId, maybe complete it
      if (status === 'done' && task.missionId) {
        // Only actual member who owns the task or a tech can complete
        if (currentUser === task.assignee || userRole === 'technician') {
          // If the mission isn't already completed by this user
          const mission = missions.find(m => m.id === task.missionId);
          if (mission && !mission.completedBy.includes(task.assignee)) {
             // In a real app we'd need an endpoint to complete it FOR the assignee if done by tech.
             // Currently onCompleteMission completes it for the CURRENT user.
             // To keep it simple, we just call onCompleteMission and it handles it, though we might need to adjust TeamMissions logic if techs complete it for students.
             // Let's assume if it's the student moving it, it triggers:
             if (currentUser === task.assignee) {
               onCompleteMission(task.missionId);
             }
          }
        }
      }
    }
    setDraggedTaskId(null);
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      saveTasks(tasks.filter(t => t.id !== id));
    }
  };

  const visibleTasks = tasks.filter(t => t.assignee === selectedMember);
  const myAvailableMissions = missions.filter(m => 
    (m.assignedTo.length === 0 || m.assignedTo.includes(selectedMember))
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-64 text-white">Carregando Kanban...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Target className="w-8 h-8 text-accent-primary" />
            Quadro Kanban
          </h2>
          <p className="text-text-secondary mt-1">Gerencie suas tarefas e missões</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {userRole === 'technician' && (
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-primary transition-colors"
            >
              <option value={currentUser}>Meu Quadro</option>
              <optgroup label="Alunos">
                {TEAM_MEMBERS.map(member => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </optgroup>
            </select>
          )}

          <button
            onClick={handleImportMissions}
            className="px-4 py-2 bg-surface hover:bg-white/5 border border-white/10 text-white font-medium rounded-xl transition-colors whitespace-nowrap"
          >
            Importar Missões
          </button>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-secondary text-white font-bold rounded-xl transition-colors shadow-glow-primary whitespace-nowrap"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nova Tarefa</span>
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden min-h-0">
        {KANBAN_COLUMNS.map(col => {
          const colTasks = visibleTasks.filter(t => t.status === col.id);
          return (
            <div 
              key={col.id} 
              className={`flex flex-col rounded-2xl border ${col.color} backdrop-blur-md overflow-hidden`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-white tracking-wide uppercase text-sm">{col.label}</h3>
                <span className="bg-black/40 text-white/70 text-xs px-2 py-1 rounded-lg font-mono">
                  {colTasks.length}
                </span>
              </div>
              
              <div className="flex-1 p-3 overflow-y-auto custom-scrollbar space-y-3">
                {colTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="bg-surface/80 border border-white/10 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-white/20 transition-all shadow-sm group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-white text-sm break-words flex-1 pr-2">{task.title}</h4>
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-400/10 rounded transition-all shrink-0"
                      >
                        X
                      </button>
                    </div>
                    {task.description && (
                      <p className="text-text-secondary text-xs mb-3 line-clamp-3">{task.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                      {task.missionId ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded flex items-center gap-1">
                          <Shield size={10} /> Missão
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted bg-white/5 px-2 py-0.5 rounded">
                          Personalizada
                        </span>
                      )}
                      
                      <div className="text-[10px] text-text-muted flex items-center gap-1">
                         <Users size={10} />
                         {task.createdBy === task.assignee ? 'Própria' : task.createdBy}
                      </div>
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div className="h-full flex items-center justify-center min-h-[100px] border-2 border-dashed border-white/5 rounded-xl">
                    <p className="text-white/20 text-sm font-medium">Solte tarefas aqui</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Nova Tarefa para {selectedMember === currentUser ? 'Mim' : selectedMember}</h3>
            
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Descrição (Opcional)
                </label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary transition-colors min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Vincular a uma Missão (Opcional)
                </label>
                <select
                  value={newTaskMissionId}
                  onChange={(e) => setNewTaskMissionId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary transition-colors appearance-none"
                >
                  <option value="">-- Nenhuma Missão --</option>
                  {myAvailableMissions.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-accent-primary hover:bg-accent-secondary text-white rounded-xl transition-colors font-bold shadow-glow-primary"
                >
                  Criar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban, Plus, Calendar, Clock, CheckCircle2, AlertTriangle,
  Layers, Users, Hammer, Cpu, Terminal, Sparkles, RefreshCw, X,
  Edit3, Trash2, FileDown, Check, ChevronRight, ArrowRight, BookOpen,
  Target, ShieldCheck, Compass, Lightbulb, Activity, CheckSquare,
  Square, AlertCircle, FileText, BarChart3, TrendingUp, HelpCircle
} from 'lucide-react';
import {
  BProjectItem, BProjectMilestone, BProjectGameRule, BProjectStrategyDecision,
  BProjectTechnicalChoice, BProjectTeamRole, BProjectScheduleStage, BProjectTest,
  BProjectTestAttempt, BProjectTechnicalCategory, UserRole
} from '../../types';

interface BProjectsTabProps {
  currentUser: string;
  userRole: UserRole;
}

// ─── Dados Iniciais Padrão para Novo B-Project ─────────────────────────────────

const DEFAULT_MILESTONES: BProjectMilestone[] = [
  { id: 'm1', name: 'Entrega do CAD', deadline: '2026-07-27', expectedResult: 'Modelo 3D finalizado e exportado', completed: false },
  { id: 'm2', name: 'Robô físico funcional', deadline: '2026-08-07', expectedResult: 'Robô montado e pronto para programação', completed: false },
  { id: 'm3', name: 'Programação completa', deadline: '2026-08-21', expectedResult: 'TeleOp e Autônomo funcionando', completed: false },
];

const DEFAULT_GAME_RULES: BProjectGameRule[] = [
  { id: 'gr1', rule: 'O robô só pode carregar um elemento de jogo por vez', projectImpact: 'O robô precisa de limitador físico ou lógica de controle para evitar penalidade' },
];

const DEFAULT_STRATEGY_DECISIONS: BProjectStrategyDecision[] = [
  { id: 'sd1', guidingDecision: 'Garantir estacionamento no End Game', whyItMatters: 'Pontos de fim de partida costumam ser previsíveis e valiosos' },
];

const DEFAULT_TECHNICAL_CHOICES: BProjectTechnicalChoice[] = [
  // Locomoção
  { id: 'tc_dt_1', category: 'drivetrain', categoryLabel: 'Sistema De Locomoção', systemName: 'Mecanum Drive Motor Direto', analysis: '', selected: false },
  { id: 'tc_dt_2', category: 'drivetrain', categoryLabel: 'Sistema De Locomoção', systemName: 'Mecanum Drive com Motor e Gear Box 90º', analysis: '', selected: false },
  { id: 'tc_dt_3', category: 'drivetrain', categoryLabel: 'Sistema De Locomoção', systemName: 'Tração X-Drive 3 Rodas', analysis: '', selected: false },
  { id: 'tc_dt_4', category: 'drivetrain', categoryLabel: 'Sistema De Locomoção', systemName: 'Tração X-Drive 4 Rodas', analysis: '', selected: false },
  { id: 'tc_dt_5', category: 'drivetrain', categoryLabel: 'Sistema De Locomoção', systemName: 'Tank Drive 4 Rodas', analysis: '', selected: false },
  { id: 'tc_dt_6', category: 'drivetrain', categoryLabel: 'Sistema De Locomoção', systemName: 'Tank Drive 6 Rodas', analysis: '', selected: false },

  // Base
  { id: 'tc_ch_1', category: 'chassis', categoryLabel: 'Construção Da Base', systemName: 'Kit de Estrutura REV', analysis: '', selected: false },
  { id: 'tc_ch_2', category: 'chassis', categoryLabel: 'Construção Da Base', systemName: 'Kit de Estrutura GoBilda', analysis: '', selected: false },
  { id: 'tc_ch_3', category: 'chassis', categoryLabel: 'Construção Da Base', systemName: 'Impressão 3D', analysis: '', selected: false },
  { id: 'tc_ch_4', category: 'chassis', categoryLabel: 'Construção Da Base', systemName: 'Corte a Laser', analysis: '', selected: false },
  { id: 'tc_ch_5', category: 'chassis', categoryLabel: 'Construção Da Base', systemName: 'Metal Customizado', analysis: '', selected: false },

  // Coleta
  { id: 'tc_in_1', category: 'intake', categoryLabel: 'Coleta De Elementos', systemName: 'Intake', analysis: '', selected: false },
  { id: 'tc_in_2', category: 'intake', categoryLabel: 'Coleta De Elementos', systemName: 'Braço de Pivot Simples', analysis: '', selected: false },
  { id: 'tc_in_3', category: 'intake', categoryLabel: 'Coleta De Elementos', systemName: 'Braço de Pivot Múltiplos', analysis: '', selected: false },
  { id: 'tc_in_4', category: 'intake', categoryLabel: 'Coleta De Elementos', systemName: 'Braço em 4-Bar', analysis: '', selected: false },
  { id: 'tc_in_5', category: 'intake', categoryLabel: 'Coleta De Elementos', systemName: 'Braço Telescópico', analysis: '', selected: false },
  { id: 'tc_in_6', category: 'intake', categoryLabel: 'Coleta De Elementos', systemName: 'Garra de 2 Pontas', analysis: '', selected: false },
  { id: 'tc_in_7', category: 'intake', categoryLabel: 'Coleta De Elementos', systemName: 'Garra de Múltiplas Pontas', analysis: '', selected: false },
  { id: 'tc_in_8', category: 'intake', categoryLabel: 'Coleta De Elementos', systemName: 'Slider', analysis: '', selected: false },

  // Subsistemas
  { id: 'tc_sub_1', category: 'subsystems', categoryLabel: 'Subsistemas', systemName: 'Transporte do elemento dentro do robô', analysis: '', selected: false },
  { id: 'tc_sub_2', category: 'subsystems', categoryLabel: 'Subsistemas', systemName: 'Sistema escalador', analysis: '', selected: false },
  { id: 'tc_sub_3', category: 'subsystems', categoryLabel: 'Subsistemas', systemName: 'Lançador de objeto no End Game', analysis: '', selected: false },

  // Depósito
  { id: 'tc_out_1', category: 'outtake', categoryLabel: 'Depósito Do Elemento', systemName: 'Outtake', analysis: '', selected: false },
  { id: 'tc_out_2', category: 'outtake', categoryLabel: 'Depósito Do Elemento', systemName: 'Braço de Pivot Simples', analysis: '', selected: false },
  { id: 'tc_out_3', category: 'outtake', categoryLabel: 'Depósito Do Elemento', systemName: 'Braço de Pivot Múltiplos', analysis: '', selected: false },
  { id: 'tc_out_4', category: 'outtake', categoryLabel: 'Depósito Do Elemento', systemName: 'Braço em 4-Bar', analysis: '', selected: false },
  { id: 'tc_out_5', category: 'outtake', categoryLabel: 'Depósito Do Elemento', systemName: 'Braço Telescópico', analysis: '', selected: false },
  { id: 'tc_out_6', category: 'outtake', categoryLabel: 'Depósito Do Elemento', systemName: 'Garra de 2 Pontas', analysis: '', selected: false },
  { id: 'tc_out_7', category: 'outtake', categoryLabel: 'Depósito Do Elemento', systemName: 'Garra de Múltiplas Pontas', analysis: '', selected: false },
  { id: 'tc_out_8', category: 'outtake', categoryLabel: 'Depósito Do Elemento', systemName: 'Shooter', analysis: '', selected: false },
  { id: 'tc_out_9', category: 'outtake', categoryLabel: 'Depósito Do Elemento', systemName: 'Slider', analysis: '', selected: false },

  // Sensores
  { id: 'tc_sens_1', category: 'sensors', categoryLabel: 'Sensores E Acessórios', systemName: 'IMU do Control Hub', analysis: '', selected: false },
  { id: 'tc_sens_2', category: 'sensors', categoryLabel: 'Sensores E Acessórios', systemName: 'Pinpoint', analysis: '', selected: false },
  { id: 'tc_sens_3', category: 'sensors', categoryLabel: 'Sensores E Acessórios', systemName: 'Encoders REV', analysis: '', selected: false },
  { id: 'tc_sens_4', category: 'sensors', categoryLabel: 'Sensores E Acessórios', systemName: 'Limelight', analysis: '', selected: false },
  { id: 'tc_sens_5', category: 'sensors', categoryLabel: 'Sensores E Acessórios', systemName: 'WebCam', analysis: '', selected: false },
  { id: 'tc_sens_6', category: 'sensors', categoryLabel: 'Sensores E Acessórios', systemName: 'Sensor de Cor', analysis: '', selected: false },
  { id: 'tc_sens_7', category: 'sensors', categoryLabel: 'Sensores E Acessórios', systemName: 'Sensor de Toque', analysis: '', selected: false },
  { id: 'tc_sens_8', category: 'sensors', categoryLabel: 'Sensores E Acessórios', systemName: 'Sensor de Distância', analysis: '', selected: false },
  { id: 'tc_sens_9', category: 'sensors', categoryLabel: 'Sensores E Acessórios', systemName: 'Sensor Magnético', analysis: '', selected: false },
  { id: 'tc_sens_10', category: 'sensors', categoryLabel: 'Sensores E Acessórios', systemName: 'LED Simples', analysis: '', selected: false },
  { id: 'tc_sens_11', category: 'sensors', categoryLabel: 'Sensores E Acessórios', systemName: 'LED Fita', analysis: '', selected: false },
];

const DEFAULT_TEAM_ORGANIZATION: BProjectTeamRole[] = [
  { id: 'to1', area: 'Estratégia', responsible: [], expectedDelivery: 'Definir prioridades do jogo e decisões principais' },
  { id: 'to2', area: 'CAD', responsible: [], expectedDelivery: 'Modelagem, revisão e exportação' },
  { id: 'to3', area: 'Mecânica', responsible: [], expectedDelivery: 'Construção, montagem e manutenção' },
  { id: 'to4', area: 'Programação', responsible: [], expectedDelivery: 'TeleOp, Autônomo e sensores' },
  { id: 'to5', area: 'Documentação', responsible: [], expectedDelivery: 'Diário de engenharia e registros' },
  { id: 'to6', area: 'Mídia/registro', responsible: [], expectedDelivery: 'Fotos, vídeos e bastidores' },
  { id: 'to7', area: 'Apresentação', responsible: [], expectedDelivery: 'Defesa técnica e narrativa do projeto' },
];

const DEFAULT_SCHEDULE: BProjectScheduleStage[] = [
  { id: 'sch1', stageName: 'Kickoff, leitura do regulamento e divisão de papeis', startDate: '2026-07-07', endDate: '2026-07-08', responsible: ['Todos'], deliverables: 'Ata, regras-chave e dúvidas abertas', completed: false },
  { id: 'sch2', stageName: 'Matriz de decisão técnica', startDate: '2026-07-10', endDate: '2026-07-12', responsible: ['Todos'], deliverables: 'Escolhas técnicas justificadas', completed: false },
  { id: 'sch3', stageName: 'CAD da base, drivetrain e estrutura', startDate: '2026-07-13', endDate: '2026-07-16', responsible: ['CAD', 'Mecânica'], deliverables: 'Conjunto inicial no CAD', completed: false },
  { id: 'sch4', stageName: 'Montagem física da base', startDate: '2026-07-28', endDate: '2026-07-31', responsible: ['Mecânica'], deliverables: 'Chassi funcional', completed: false },
  { id: 'sch5', stageName: 'Programação completa', startDate: '2026-08-17', endDate: '2026-08-21', responsible: ['Programação'], deliverables: 'Código completo', completed: false },
  { id: 'sch6', stageName: 'Simulados e revisão final', startDate: '2026-09-05', endDate: '2026-09-11', responsible: ['Todos'], deliverables: 'Robô validado para demonstração', completed: false },
];

// ─── Componente Principal ──────────────────────────────────────────────────────

export default function BProjectsTab({ currentUser, userRole }: BProjectsTabProps) {
  const [projects, setProjects] = useState<BProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableMembers, setAvailableMembers] = useState<string[]>([]);

  // Visualização e Seleção
  const [activeProject, setActiveProject] = useState<BProjectItem | null>(null);
  const [activeTab, setActiveTab] = useState<number>(1);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Estado do Projeto em Edição / Novo
  const [formData, setFormData] = useState<Partial<BProjectItem>>({});

  // Sub-Modais
  const [newSystemModal, setNewSystemModal] = useState<{ open: boolean; category: BProjectTechnicalCategory; categoryLabel: string }>({
    open: false,
    category: 'drivetrain',
    categoryLabel: ''
  });
  const [customSystemName, setCustomSystemName] = useState('');

  // Novo Teste Modal
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [currentTest, setCurrentTest] = useState<Partial<BProjectTest>>({
    testName: '',
    evaluatedSystem: '',
    testType: 'teleop',
    objective: '',
    metric: '',
    attempts: []
  });

  const isTech = userRole === 'technician' || ['Jonas', 'Ramon'].includes(currentUser);

  // ─── Buscar Projetos do Supabase ───────────────────────────────────────────
  const fetchBProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects?scope=b_project');
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects || []);
      } else {
        throw new Error(data.error || 'Erro ao carregar projetos.');
      }

      const memRes = await fetch(`/api/members?requester=${encodeURIComponent(currentUser)}`);
      const memData = await memRes.json();
      if (memData.success && Array.isArray(memData.members)) {
        setAvailableMembers(memData.members.map((m: any) => m.username || m.name));
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchBProjects();
  }, [fetchBProjects]);

  // ─── Criar / Abrir Projeto ──────────────────────────────────────────────────
  const handleOpenNewProjectModal = () => {
    const newProj: Partial<BProjectItem> = {
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      milestones: JSON.parse(JSON.stringify(DEFAULT_MILESTONES)),
      gameRules: JSON.parse(JSON.stringify(DEFAULT_GAME_RULES)),
      strategyDecisions: JSON.parse(JSON.stringify(DEFAULT_STRATEGY_DECISIONS)),
      technicalChoices: JSON.parse(JSON.stringify(DEFAULT_TECHNICAL_CHOICES)),
      teamOrganization: JSON.parse(JSON.stringify(DEFAULT_TEAM_ORGANIZATION)),
      schedule: JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)),
      tests: [],
      status: 'planning',
    };
    setFormData(newProj);
    setActiveProject(null);
    setIsEditingModalOpen(true);
    setActiveTab(1);
  };

  const handleOpenProjectDetails = (proj: BProjectItem) => {
    setActiveProject(proj);
    setFormData(JSON.parse(JSON.stringify(proj)));
    setIsEditingModalOpen(true);
    setActiveTab(1);
  };

  // ─── Salvar Projeto (POST / PUT) ────────────────────────────────────────────
  const handleSaveProject = async () => {
    if (!formData.name?.trim()) {
      alert('Por favor, informe o nome do projeto (Ex: Robô do SESI Verso).');
      return;
    }

    setIsSaving(true);
    try {
      const isExisting = !!activeProject?.id;
      const endpoint = '/api/projects?scope=b_project';

      let res;
      if (isExisting) {
        res = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: currentUser,
            projectId: activeProject.id,
            project: formData,
          }),
        });
      } else {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: currentUser,
            project: formData,
          }),
        });
      }

      const data = await res.json();
      if (data.success) {
        setIsEditingModalOpen(false);
        setActiveProject(null);
        fetchBProjects();
      } else {
        alert(data.error || 'Erro ao salvar B-Project.');
      }
    } catch (err: any) {
      alert(`Erro na requisição: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Excluir Projeto ────────────────────────────────────────────────────────
  const handleDeleteProject = async (id: string) => {
    try {
      const res = await fetch('/api/projects?scope=b_project', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser, projectId: id }),
      });
      const data = await res.json();
      if (data.success) {
        setDeleteConfirmId(null);
        if (activeProject?.id === id) {
          setActiveProject(null);
          setIsEditingModalOpen(false);
        }
        fetchBProjects();
      } else {
        alert(data.error || 'Erro ao excluir.');
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  // ─── Handlers de Itens das Tabelas ──────────────────────────────────────────

  // 1. Marcos
  const addMilestone = () => {
    const newM: BProjectMilestone = {
      id: `m_${Date.now()}`,
      name: '',
      deadline: '',
      expectedResult: '',
      completed: false,
    };
    setFormData(prev => ({ ...prev, milestones: [...(prev.milestones || []), newM] }));
  };

  const updateMilestone = (id: string, field: keyof BProjectMilestone, value: any) => {
    setFormData(prev => ({
      ...prev,
      milestones: (prev.milestones || []).map(m => m.id === id ? { ...m, [field]: value } : m)
    }));
  };

  const removeMilestone = (id: string) => {
    setFormData(prev => ({ ...prev, milestones: (prev.milestones || []).filter(m => m.id !== id) }));
  };

  // 2. Regras do Jogo
  const addGameRule = () => {
    const newR: BProjectGameRule = { id: `gr_${Date.now()}`, rule: '', projectImpact: '' };
    setFormData(prev => ({ ...prev, gameRules: [...(prev.gameRules || []), newR] }));
  };

  const updateGameRule = (id: string, field: keyof BProjectGameRule, value: string) => {
    setFormData(prev => ({
      ...prev,
      gameRules: (prev.gameRules || []).map(r => r.id === id ? { ...r, [field]: value } : r)
    }));
  };

  const removeGameRule = (id: string) => {
    setFormData(prev => ({ ...prev, gameRules: (prev.gameRules || []).filter(r => r.id !== id) }));
  };

  // 3. Estratégia Adotada
  const addStrategyDecision = () => {
    const newSD: BProjectStrategyDecision = { id: `sd_${Date.now()}`, guidingDecision: '', whyItMatters: '' };
    setFormData(prev => ({ ...prev, strategyDecisions: [...(prev.strategyDecisions || []), newSD] }));
  };

  const updateStrategyDecision = (id: string, field: keyof BProjectStrategyDecision, value: string) => {
    setFormData(prev => ({
      ...prev,
      strategyDecisions: (prev.strategyDecisions || []).map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const removeStrategyDecision = (id: string) => {
    setFormData(prev => ({ ...prev, strategyDecisions: (prev.strategyDecisions || []).filter(s => s.id !== id) }));
  };

  // 4. Checklist Técnico
  const toggleTechnicalChoice = (id: string) => {
    setFormData(prev => ({
      ...prev,
      technicalChoices: (prev.technicalChoices || []).map(c => c.id === id ? { ...c, selected: !c.selected } : c)
    }));
  };

  const updateTechnicalAnalysis = (id: string, analysis: string) => {
    setFormData(prev => ({
      ...prev,
      technicalChoices: (prev.technicalChoices || []).map(c => c.id === id ? { ...c, analysis } : c)
    }));
  };

  const handleAddCustomSystem = () => {
    if (!customSystemName.trim()) return;
    const newChoice: BProjectTechnicalChoice = {
      id: `tc_custom_${Date.now()}`,
      category: newSystemModal.category,
      categoryLabel: newSystemModal.categoryLabel,
      systemName: customSystemName.trim(),
      analysis: '',
      selected: true,
      isCustom: true
    };
    setFormData(prev => ({ ...prev, technicalChoices: [...(prev.technicalChoices || []), newChoice] }));
    setCustomSystemName('');
    setNewSystemModal({ open: false, category: 'drivetrain', categoryLabel: '' });
  };

  // 5. Organização da Equipe
  const updateTeamRole = (id: string, field: keyof BProjectTeamRole, value: any) => {
    setFormData(prev => ({
      ...prev,
      teamOrganization: (prev.teamOrganization || []).map(t => t.id === id ? { ...t, [field]: value } : t)
    }));
  };

  // 6. Cronograma & Gantt
  const addScheduleStage = () => {
    const newStage: BProjectScheduleStage = {
      id: `sch_${Date.now()}`,
      stageName: '',
      startDate: '',
      endDate: '',
      responsible: [],
      deliverables: '',
      completed: false,
      onTimeStatus: 'pending'
    };
    setFormData(prev => ({ ...prev, schedule: [...(prev.schedule || []), newStage] }));
  };

  const updateScheduleStage = (id: string, field: keyof BProjectScheduleStage, value: any) => {
    setFormData(prev => ({
      ...prev,
      schedule: (prev.schedule || []).map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const toggleScheduleCompleted = (id: string, onTime: boolean) => {
    setFormData(prev => ({
      ...prev,
      schedule: (prev.schedule || []).map(s => {
        if (s.id === id) {
          const nextCompleted = !s.completed;
          return {
            ...s,
            completed: nextCompleted,
            onTimeStatus: nextCompleted ? (onTime ? 'on_time' : 'delayed') : 'pending'
          };
        }
        return s;
      })
    }));
  };

  const removeScheduleStage = (id: string) => {
    setFormData(prev => ({ ...prev, schedule: (prev.schedule || []).filter(s => s.id !== id) }));
  };

  // 7. Testes do Projeto
  const handleOpenAddTest = () => {
    setCurrentTest({
      id: `test_${Date.now()}`,
      testName: '',
      evaluatedSystem: '',
      testType: 'teleop',
      objective: '',
      metric: '',
      attempts: [
        {
          id: `att_1`,
          attemptNumber: 1,
          timeOrCycle: '',
          result: '',
          problemFound: '',
          improvementSuggestion: '',
          date: new Date().toISOString().split('T')[0]
        }
      ],
      improvementWorked: 'partially',
      nextAction: 'adjust',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setTestModalOpen(true);
  };

  const handleSaveTest = () => {
    if (!currentTest.testName?.trim()) {
      alert('Informe o nome do teste.');
      return;
    }
    const testToSave = currentTest as BProjectTest;
    setFormData(prev => {
      const existing = prev.tests || [];
      const idx = existing.findIndex(t => t.id === testToSave.id);
      if (idx !== -1) {
        const updated = [...existing];
        updated[idx] = testToSave;
        return { ...prev, tests: updated };
      }
      return { ...prev, tests: [...existing, testToSave] };
    });
    setTestModalOpen(false);
  };

  const addAttemptToCurrentTest = () => {
    const currentAttempts = currentTest.attempts || [];
    const nextNum = currentAttempts.length + 1;
    const newAtt: BProjectTestAttempt = {
      id: `att_${Date.now()}`,
      attemptNumber: nextNum,
      timeOrCycle: '',
      result: '',
      problemFound: '',
      improvementSuggestion: '',
      date: new Date().toISOString().split('T')[0]
    };
    setCurrentTest(prev => ({ ...prev, attempts: [...(prev.attempts || []), newAtt] }));
  };

  const updateAttemptInCurrentTest = (attId: string, field: keyof BProjectTestAttempt, val: any) => {
    setCurrentTest(prev => ({
      ...prev,
      attempts: (prev.attempts || []).map(a => a.id === attId ? { ...a, [field]: val } : a)
    }));
  };

  const removeAttemptFromCurrentTest = (attId: string) => {
    setCurrentTest(prev => ({
      ...prev,
      attempts: (prev.attempts || []).filter(a => a.id !== attId)
    }));
  };

  const removeTest = (testId: string) => {
    setFormData(prev => ({ ...prev, tests: (prev.tests || []).filter(t => t.id !== testId) }));
  };

  // ─── Exportar Engineering Notebook Markdown ────────────────────────────────
  const exportEngineeringNotebook = (p: BProjectItem) => {
    const md = `# Engineering Notebook: ${p.name}
**Status do Projeto:** ${p.status.toUpperCase()}
**Período:** ${p.startDate || 'Não informado'} até ${p.endDate || 'Não informado'}
**Autor do Registro:** ${p.createdBy}

---

## 1. Marcos do Projeto
${(p.milestones || []).map(m => `- [${m.completed ? 'x' : ' '}] **${m.name}** (Prazo: ${m.deadline}) &rarr; ${m.expectedResult}`).join('\n')}

---

## 2. Leitura Estratégica do Jogo
${(p.gameRules || []).map(r => `### Regra: ${r.rule}\n**Impacto na Engenharia:** ${r.projectImpact}\n`).join('\n')}

---

## 3. Estratégia Adotada pela Equipe
${(p.strategyDecisions || []).map(s => `### Decisão: ${s.guidingDecision}\n**Por Que Importa:** ${s.whyItMatters}\n`).join('\n')}

---

## 4. Matriz de Decisões Técnicas
${(p.technicalChoices || []).filter(c => c.selected).map(c => `### ${c.categoryLabel || c.category}: ${c.systemName}\n**Análise / Justificativa:** ${c.analysis || 'Sem análise registrada'}\n`).join('\n')}

---

## 5. Organização da Equipe
${(p.teamOrganization || []).map(t => `- **${t.area}:** Responsáveis: ${t.responsible.join(', ') || 'Nenhum'} | Entrega: ${t.expectedDelivery}`).join('\n')}

---

## 6. Cronograma & Entregas
${(p.schedule || []).map(s => `- [${s.completed ? 'x' : ' '}] **${s.stageName}** (${s.startDate} a ${s.endDate}) - Responsável: ${s.responsible.join(', ')} | Entregas: ${s.deliverables} | Status: ${s.onTimeStatus === 'on_time' ? 'Dentro do prazo' : s.onTimeStatus === 'delayed' ? 'Fora do prazo' : 'Pendente'}`).join('\n')}

---

## 7. Registro de Testes & Validação
${(p.tests || []).map(t => `### Teste: ${t.testName} (${t.testType.toUpperCase()})
**Sistema Avaliado:** ${t.evaluatedSystem}
**Objetivo:** ${t.objective}
**Métrica:** ${t.metric}
**Melhoria Funcionou?:** ${t.improvementWorked} | **Próxima Ação:** ${t.nextAction}

#### Tentativas:
${t.attempts.map(a => `- Tentativa #${a.attemptNumber} (${a.date}): Tempo/Ciclo: ${a.timeOrCycle} | Resultado: ${a.result} | Problema: ${a.problemFound} | Sugestão: ${a.improvementSuggestion}`).join('\n')}
`).join('\n')}
`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bproject-${p.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── Renderização do Gráfico de Gantt Interativo ─────────────────────────────
  const renderGanttChart = (schedule: BProjectScheduleStage[]) => {
    const validStages = schedule.filter(s => s.startDate && s.endDate);
    if (validStages.length === 0) {
      return (
        <div className="py-8 text-center bg-black/20 rounded-xl border border-white/5 text-xs text-text-muted">
          Preencha as datas de início e fim no cronograma para visualizar o Gráfico de Gantt automático.
        </div>
      );
    }

    const allDates = validStages.flatMap(s => [new Date(s.startDate).getTime(), new Date(s.endDate).getTime()]).filter(t => !isNaN(t));
    if (allDates.length === 0) return null;

    const minTime = Math.min(...allDates);
    const maxTime = Math.max(...allDates);
    const totalDuration = Math.max(maxTime - minTime, 86400000); // no mínimo 1 dia

    return (
      <div className="space-y-3 bg-black/30 p-4 rounded-xl border border-white/10 overflow-x-auto">
        <div className="flex items-center justify-between text-xs text-text-muted pb-2 border-b border-white/5 min-w-[500px]">
          <span>Início: {new Date(minTime).toLocaleDateString('pt-BR')}</span>
          <span className="font-bold text-cyan-400">Gráfico de Gantt Interativo do Projeto</span>
          <span>Término: {new Date(maxTime).toLocaleDateString('pt-BR')}</span>
        </div>

        <div className="space-y-3 min-w-[500px] pt-2">
          {validStages.map((stage, idx) => {
            const start = new Date(stage.startDate).getTime();
            const end = new Date(stage.endDate).getTime();
            const leftPct = Math.max(0, Math.min(100, ((start - minTime) / totalDuration) * 100));
            const widthPct = Math.max(4, Math.min(100 - leftPct, ((end - start) / totalDuration) * 100));

            let barColor = 'from-blue-600 to-cyan-600';
            if (stage.completed) {
              barColor = stage.onTimeStatus === 'on_time' 
                ? 'from-emerald-600 to-teal-500' 
                : 'from-amber-600 to-orange-500';
            }

            return (
              <div key={stage.id || idx} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-white truncate max-w-[280px]">
                    {stage.stageName || `Etapa ${idx + 1}`}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-text-muted">
                    <span>{stage.startDate} &rarr; {stage.endDate}</span>
                    {stage.completed && (
                      <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                        stage.onTimeStatus === 'on_time' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {stage.onTimeStatus === 'on_time' ? 'No Prazo' : 'Fora do Prazo'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Barra do Gantt */}
                <div className="h-4 bg-white/5 rounded-full overflow-hidden relative">
                  <div
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    className={`absolute top-0 bottom-0 rounded-full bg-gradient-to-r ${barColor} shadow-md transition-all duration-500`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Categorias Técnicas Agrupadas ──────────────────────────────────────────
  const groupedTechnicalChoices = useMemo(() => {
    const choices = formData.technicalChoices || [];
    const categories: { key: BProjectTechnicalCategory; label: string; items: BProjectTechnicalChoice[] }[] = [
      { key: 'drivetrain', label: '1. Sistema De Locomoção', items: [] },
      { key: 'chassis', label: '2. Construção Da Base', items: [] },
      { key: 'intake', label: '3. Coleta De Elementos', items: [] },
      { key: 'subsystems', label: '4. Subsistemas', items: [] },
      { key: 'outtake', label: '5. Depósito Do Elemento', items: [] },
      { key: 'sensors', label: '6. Sensores E Acessórios', items: [] },
    ];

    choices.forEach(c => {
      const cat = categories.find(cat => cat.key === c.category);
      if (cat) cat.items.push(c);
      else {
        // Custom
        const other = categories.find(cat => cat.key === 'drivetrain');
        if (other) other.items.push(c);
      }
    });

    return categories;
  }, [formData.technicalChoices]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Header do B-Project ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-glass">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
              <FolderKanban className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                B-Project
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold uppercase tracking-wider">
                  Robótica & FTC Live
                </span>
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Central de criação, planejamento estratégico, matriz de decisão, cronograma com Gantt e testes de robôs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBProjects}
            disabled={loading}
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-text-secondary hover:text-white transition-all disabled:opacity-50"
            title="Atualizar dados do Supabase"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenNewProjectModal}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span>+ Novo Projeto</span>
          </button>
        </div>
      </div>

      {/* ── Lista de Projetos (Cards) ── */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm text-text-secondary">Sincronizando B-Projects do Supabase...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm text-rose-300">{error}</p>
          <button
            onClick={fetchBProjects}
            className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold rounded-lg"
          >
            Tentar Novamente
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="py-16 text-center bg-primary/20 border border-white/5 rounded-2xl p-8 space-y-4">
          <FolderKanban className="w-12 h-12 text-text-muted mx-auto opacity-50" />
          <div>
            <h3 className="text-lg font-bold text-white">Nenhum B-Project criado</h3>
            <p className="text-sm text-text-secondary mt-1">
              Comece agora registrando o projeto do próximo robô, regional, amistoso ou temporada oficial!
            </p>
          </div>
          <button
            onClick={handleOpenNewProjectModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Criar Primeiro Projeto</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {projects.map(proj => {
              const completedMilestones = (proj.milestones || []).filter(m => m.completed).length;
              const totalMilestones = (proj.milestones || []).length;
              const completedStages = (proj.schedule || []).filter(s => s.completed).length;
              const totalStages = (proj.schedule || []).length;
              const totalTests = (proj.tests || []).length;

              const isOwnerOrTech = isTech || proj.createdBy === currentUser;

              return (
                <motion.div
                  key={proj.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-primary/50 hover:bg-primary/70 border border-white/5 hover:border-cyan-500/30 rounded-2xl p-5 shadow-glass flex flex-col justify-between space-y-4 group transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {proj.name}
                      </h3>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase tracking-wider shrink-0">
                        {proj.status || 'planning'}
                      </span>
                    </div>

                    {/* Datas */}
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>
                        {proj.startDate ? new Date(proj.startDate).toLocaleDateString('pt-BR') : 'Início pendente'} &rarr;{' '}
                        {proj.endDate ? new Date(proj.endDate).toLocaleDateString('pt-BR') : 'Término a definir'}
                      </span>
                    </div>

                    {/* Barra de Progresso de Marcos */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] text-text-secondary font-medium">
                        <span>Marcos Concluídos</span>
                        <span className="text-white font-bold">{completedMilestones}/{totalMilestones}</span>
                      </div>
                      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Indicadores rápidos */}
                    <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-black/20 border border-white/5 flex items-center justify-between">
                        <span className="text-text-muted">Cronograma</span>
                        <span className="text-white font-bold">{completedStages}/{totalStages}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/20 border border-white/5 flex items-center justify-between">
                        <span className="text-text-muted">Testes</span>
                        <span className="text-cyan-400 font-bold">{totalTests}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé / Ações */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenProjectDetails(proj)}
                      className="flex-1 py-2 px-3 rounded-xl bg-cyan-600/15 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Abrir Painel B-Project</span>
                    </button>

                    <button
                      onClick={() => exportEngineeringNotebook(proj)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white border border-white/5 transition-all"
                      title="Exportar Engineering Notebook (Markdown)"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                    </button>

                    {isOwnerOrTech && (
                      <button
                        onClick={() => setDeleteConfirmId(proj.id)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-text-secondary hover:text-rose-400 border border-white/5 hover:border-rose-500/30 transition-all"
                        title="Excluir projeto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Modal / Painel de Edição Completo das 7 Etapas do B-Project ── */}
      <AnimatePresence>
        {isEditingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-primary border border-white/10 rounded-2xl w-full max-w-5xl max-h-[94vh] overflow-y-auto shadow-2xl flex flex-col"
            >
              {/* Header Principal do Modal */}
              <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4 sticky top-0 bg-primary/95 backdrop-blur-xl z-30">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase tracking-wider">
                      B-Project • Engenharia FTC
                    </span>
                    {activeProject && (
                      <span className="text-[10px] text-text-muted">
                        Registrado por {activeProject.createdBy}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {formData.name || 'Novo Projeto B-Project'}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {activeProject && (
                    <button
                      onClick={() => exportEngineeringNotebook(activeProject)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white border border-white/10 transition-all flex items-center gap-1 text-xs font-bold"
                      title="Exportar Markdown"
                    >
                      <FileDown className="w-4 h-4" />
                      <span className="hidden sm:inline">Exportar Notebook</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsEditingModalOpen(false)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Barra de Navegação entre as 7 Etapas */}
              <div className="px-5 pt-3 pb-2 border-b border-white/10 bg-black/20 flex overflow-x-auto gap-2 text-xs no-scrollbar">
                {[
                  { id: 1, label: '1. Dados & Marcos', icon: Target },
                  { id: 2, label: '2. Regras do Jogo', icon: BookOpen },
                  { id: 3, label: '3. Estratégia', icon: Lightbulb },
                  { id: 4, label: '4. Checklist Técnico', icon: CheckSquare },
                  { id: 5, label: '5. Organização Equipe', icon: Users },
                  { id: 6, label: '6. Cronograma & Gantt', icon: Calendar },
                  { id: 7, label: '7. Testes do Projeto', icon: Activity },
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                          : 'bg-white/5 hover:bg-white/10 text-text-muted hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Corpo da Etapa Ativa */}
              <div className="p-6 space-y-6 flex-1">
                {/* ── ETAPA 1: DADOS DO PROJETO & MARCOS ── */}
                {activeTab === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
                      <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Identificação e Prazos do Projeto
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-3 space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">
                            Nome do Projeto *
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Robô do SESI Verso, Robô do Amistoso, Robô do Regional"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-cyan-500 text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">
                            Data de Início
                          </label>
                          <input
                            type="date"
                            value={formData.startDate || ''}
                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">
                            Data de Término (Prazo Final)
                          </label>
                          <input
                            type="date"
                            value={formData.endDate || ''}
                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase">
                            Status Atual
                          </label>
                          <select
                            value={formData.status || 'planning'}
                            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                          >
                            <option value="planning">Planejamento</option>
                            <option value="building">Construção Mecânica</option>
                            <option value="programming">Programação & Sensores</option>
                            <option value="testing">Testes & Validação</option>
                            <option value="completed">Concluído</option>
                            <option value="archived">Arquivado</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Tabela de Marcos do Projeto */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                            Marcos do Projeto (Tabela de Principais Entregas)
                          </h4>
                          <p className="text-xs text-text-muted">
                            Visão geral do caminho até o robô estar pronto.
                          </p>
                        </div>
                        <button
                          onClick={addMilestone}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition-all flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Adicionar Marco</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-white/5 text-text-secondary uppercase text-[10px] font-bold border-b border-white/10">
                            <tr>
                              <th className="p-3 w-12 text-center">Status</th>
                              <th className="p-3">Marco</th>
                              <th className="p-3 w-36">Data de Entrega</th>
                              <th className="p-3">Resultado Esperado</th>
                              <th className="p-3 w-12 text-center">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {(formData.milestones || []).map(m => (
                              <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => updateMilestone(m.id, 'completed', !m.completed)}
                                    className="text-cyan-400 hover:scale-110 transition-transform"
                                  >
                                    {m.completed ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-text-muted" />}
                                  </button>
                                </td>
                                <td className="p-3">
                                  <input
                                    type="text"
                                    value={m.name}
                                    onChange={e => updateMilestone(m.id, 'name', e.target.value)}
                                    placeholder="Ex: Entrega do CAD"
                                    className="w-full bg-transparent border-b border-transparent focus:border-cyan-500 focus:outline-none text-white text-xs"
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    type="date"
                                    value={m.deadline}
                                    onChange={e => updateMilestone(m.id, 'deadline', e.target.value)}
                                    className="w-full bg-black/30 px-2 py-1 rounded border border-white/10 text-white text-xs"
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    type="text"
                                    value={m.expectedResult}
                                    onChange={e => updateMilestone(m.id, 'expectedResult', e.target.value)}
                                    placeholder="Ex: Modelo 3D finalizado e exportado"
                                    className="w-full bg-transparent border-b border-transparent focus:border-cyan-500 focus:outline-none text-text-secondary text-xs"
                                  />
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => removeMilestone(m.id)}
                                    className="text-text-muted hover:text-rose-400 p-1"
                                    title="Remover marco"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── ETAPA 2: LEITURA ESTRATÉGICA DO JOGO ── */}
                {activeTab === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-cyan-400" />
                          Leitura Estratégica Do Jogo (Regra vs Decisão de Engenharia)
                        </h4>
                        <p className="text-xs text-text-muted">
                          Transforme cada regulamento e restrição em decisões técnicas claras para o robô.
                        </p>
                      </div>
                      <button
                        onClick={addGameRule}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Adicionar Regra</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 text-text-secondary uppercase text-[10px] font-bold border-b border-white/10">
                          <tr>
                            <th className="p-3 w-1/2">Regra / Regulamento do Jogo</th>
                            <th className="p-3 w-1/2">Impacto no Projeto / Solução de Engenharia</th>
                            <th className="p-3 w-12 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {(formData.gameRules || []).map(r => (
                            <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-3 align-top">
                                <textarea
                                  rows={2}
                                  value={r.rule}
                                  onChange={e => updateGameRule(r.id, 'rule', e.target.value)}
                                  placeholder="Ex: O robô só pode carregar um elemento de jogo por vez"
                                  className="w-full bg-black/20 p-2 rounded-lg border border-white/10 focus:border-cyan-500 focus:outline-none text-white text-xs"
                                />
                              </td>
                              <td className="p-3 align-top">
                                <textarea
                                  rows={2}
                                  value={r.projectImpact}
                                  onChange={e => updateGameRule(r.id, 'projectImpact', e.target.value)}
                                  placeholder="Ex: O robô precisa de limitador físico ou lógica de controle para evitar penalidade"
                                  className="w-full bg-black/20 p-2 rounded-lg border border-white/10 focus:border-cyan-500 focus:outline-none text-text-secondary text-xs"
                                />
                              </td>
                              <td className="p-3 text-center align-middle">
                                <button
                                  onClick={() => removeGameRule(r.id)}
                                  className="text-text-muted hover:text-rose-400 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── ETAPA 3: ESTRATÉGIA ADOTADA PELA EQUIPE ── */}
                {activeTab === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-cyan-400" />
                          Estratégia Adotada Pela Equipe
                        </h4>
                        <p className="text-xs text-text-muted">
                          Registre as escolhas estratégicas orientadoras antes de iniciar o desenho e a construção.
                        </p>
                      </div>
                      <button
                        onClick={addStrategyDecision}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Adicionar Decisão</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 text-text-secondary uppercase text-[10px] font-bold border-b border-white/10">
                          <tr>
                            <th className="p-3 w-1/2">Decisão Orientadora</th>
                            <th className="p-3 w-1/2">Por Que Importa?</th>
                            <th className="p-3 w-12 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {(formData.strategyDecisions || []).map(s => (
                            <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-3 align-top">
                                <textarea
                                  rows={2}
                                  value={s.guidingDecision}
                                  onChange={e => updateStrategyDecision(s.id, 'guidingDecision', e.target.value)}
                                  placeholder="Ex: Garantir estacionamento no End Game"
                                  className="w-full bg-black/20 p-2 rounded-lg border border-white/10 focus:border-cyan-500 focus:outline-none text-white text-xs"
                                />
                              </td>
                              <td className="p-3 align-top">
                                <textarea
                                  rows={2}
                                  value={s.whyItMatters}
                                  onChange={e => updateStrategyDecision(s.id, 'whyItMatters', e.target.value)}
                                  placeholder="Ex: Pontos de fim de partida costumam ser previsíveis e valiosos"
                                  className="w-full bg-black/20 p-2 rounded-lg border border-white/10 focus:border-cyan-500 focus:outline-none text-text-secondary text-xs"
                                />
                              </td>
                              <td className="p-3 text-center align-middle">
                                <button
                                  onClick={() => removeStrategyDecision(s.id)}
                                  className="text-text-muted hover:text-rose-400 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── ETAPA 4: CHECKLIST DE DECISÕES TÉCNICAS ── */}
                {activeTab === 4 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-cyan-400" />
                          Checklist De Decisões Técnicas
                        </h4>
                        <p className="text-xs text-text-muted">
                          Marque os sistemas adotados e documente prós e contras para a estratégia da temporada.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {groupedTechnicalChoices.map(group => (
                        <div key={group.key} className="space-y-3 bg-black/25 p-4 rounded-xl border border-white/10">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-black text-cyan-300 uppercase tracking-wider">
                              {group.label}
                            </h5>
                            <button
                              type="button"
                              onClick={() => {
                                setNewSystemModal({
                                  open: true,
                                  category: group.key,
                                  categoryLabel: group.label
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-600/20 text-cyan-400 text-[11px] font-bold border border-white/10 hover:border-cyan-500/30 transition-all flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Cadastrar Novo Sistema</span>
                            </button>
                          </div>

                          <div className="overflow-x-auto rounded-lg border border-white/5">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-white/5 text-text-secondary uppercase text-[9px] font-bold">
                                <tr>
                                  <th className="p-2.5 w-12 text-center">Seleção</th>
                                  <th className="p-2.5 w-72">Sistema</th>
                                  <th className="p-2.5">Análise (Prós e Contras / Justificativa)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {group.items.map(item => (
                                  <tr key={item.id} className={`hover:bg-white/[0.02] ${item.selected ? 'bg-cyan-950/20' : ''}`}>
                                    <td className="p-2.5 text-center">
                                      <button
                                        type="button"
                                        onClick={() => toggleTechnicalChoice(item.id)}
                                        className="text-cyan-400 hover:scale-110 transition-transform"
                                      >
                                        {item.selected ? <CheckSquare className="w-4 h-4 text-cyan-400" /> : <Square className="w-4 h-4 text-text-muted" />}
                                      </button>
                                    </td>
                                    <td className="p-2.5">
                                      <span className={`font-semibold ${item.selected ? 'text-white' : 'text-text-secondary'}`}>
                                        {item.systemName}
                                      </span>
                                      {item.isCustom && (
                                        <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase">
                                          Custom
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-2.5">
                                      <input
                                        type="text"
                                        value={item.analysis || ''}
                                        onChange={e => updateTechnicalAnalysis(item.id, e.target.value)}
                                        placeholder="Prós e contras para a estratégia..."
                                        className="w-full bg-black/30 px-3 py-1.5 rounded-lg border border-white/10 focus:border-cyan-500 focus:outline-none text-white text-xs"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── ETAPA 5: ORGANIZAÇÃO DA EQUIPE ── */}
                {activeTab === 5 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Users className="w-4 h-4 text-cyan-400" />
                          Organização Da Equipe
                        </h4>
                        <p className="text-xs text-text-muted">
                          Defina papéis claros e entregas esperadas para cada área de trabalho.
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 text-text-secondary uppercase text-[10px] font-bold border-b border-white/10">
                          <tr>
                            <th className="p-3 w-40">Área</th>
                            <th className="p-3 w-72">Responsáveis</th>
                            <th className="p-3">Entrega Esperada</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {(formData.teamOrganization || []).map(t => (
                            <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-3 font-bold text-white align-top">
                                {t.area}
                              </td>
                              <td className="p-3 align-top">
                                <div className="space-y-1.5">
                                  <div className="flex flex-wrap gap-1">
                                    {(t.responsible || []).map(resp => (
                                      <span key={resp} className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold flex items-center gap-1">
                                        {resp}
                                        <button
                                          type="button"
                                          onClick={() => updateTeamRole(t.id, 'responsible', t.responsible.filter(r => r !== resp))}
                                          className="hover:text-white"
                                        >
                                          &times;
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                  <select
                                    onChange={e => {
                                      if (e.target.value && !t.responsible.includes(e.target.value)) {
                                        updateTeamRole(t.id, 'responsible', [...t.responsible, e.target.value]);
                                      }
                                      e.target.value = '';
                                    }}
                                    className="w-full bg-black/40 px-2 py-1 rounded border border-white/10 text-[11px] text-text-secondary"
                                  >
                                    <option value="">+ Adicionar Membro...</option>
                                    {availableMembers.map(m => (
                                      <option key={m} value={m}>{m}</option>
                                    ))}
                                  </select>
                                </div>
                              </td>
                              <td className="p-3 align-top">
                                <input
                                  type="text"
                                  value={t.expectedDelivery}
                                  onChange={e => updateTeamRole(t.id, 'expectedDelivery', e.target.value)}
                                  placeholder="Definir entregas da área..."
                                  className="w-full bg-black/20 px-3 py-1.5 rounded-lg border border-white/10 focus:border-cyan-500 focus:outline-none text-text-secondary text-xs"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── ETAPA 6: CRONOGRAMA PREVISTO & GRÁFICO DE GANTT ── */}
                {activeTab === 6 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-cyan-400" />
                          Cronograma Previsto & Validação de Prazos
                        </h4>
                        <p className="text-xs text-text-muted">
                          Acompanhe o cumprimento das datas e visualize o Gráfico de Gantt automático.
                        </p>
                      </div>
                      <button
                        onClick={addScheduleStage}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Adicionar Etapa</span>
                      </button>
                    </div>

                    {/* Gráfico de Gantt Interativo */}
                    {renderGanttChart(formData.schedule || [])}

                    {/* Tabela do Cronograma */}
                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 text-text-secondary uppercase text-[10px] font-bold border-b border-white/10">
                          <tr>
                            <th className="p-3 w-48">Status / Conclusão</th>
                            <th className="p-3">Etapa</th>
                            <th className="p-3 w-32">Início</th>
                            <th className="p-3 w-32">Fim</th>
                            <th className="p-3 w-36">Responsável</th>
                            <th className="p-3">Entregas</th>
                            <th className="p-3 w-12 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {(formData.schedule || []).map(s => (
                            <tr key={s.id} className={`hover:bg-white/[0.02] ${s.completed ? 'bg-emerald-950/15' : ''}`}>
                              <td className="p-3 align-top">
                                <div className="flex flex-col gap-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleScheduleCompleted(s.id, true)}
                                    className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                                      s.completed && s.onTimeStatus === 'on_time'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-white/5 text-text-muted hover:text-white'
                                    }`}
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Concluído (No Prazo)</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => toggleScheduleCompleted(s.id, false)}
                                    className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                                      s.completed && s.onTimeStatus === 'delayed'
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-white/5 text-text-muted hover:text-white'
                                    }`}
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>Concluído (Fora Prazo)</span>
                                  </button>
                                </div>
                              </td>
                              <td className="p-3 align-top">
                                <input
                                  type="text"
                                  value={s.stageName}
                                  onChange={e => updateScheduleStage(s.id, 'stageName', e.target.value)}
                                  placeholder="Nome da etapa..."
                                  className="w-full bg-black/30 p-2 rounded-lg border border-white/10 focus:border-cyan-500 focus:outline-none text-white text-xs font-semibold"
                                />
                              </td>
                              <td className="p-3 align-top">
                                <input
                                  type="date"
                                  value={s.startDate}
                                  onChange={e => updateScheduleStage(s.id, 'startDate', e.target.value)}
                                  className="w-full bg-black/30 p-1.5 rounded-lg border border-white/10 text-white text-xs"
                                />
                              </td>
                              <td className="p-3 align-top">
                                <input
                                  type="date"
                                  value={s.endDate}
                                  onChange={e => updateScheduleStage(s.id, 'endDate', e.target.value)}
                                  className="w-full bg-black/30 p-1.5 rounded-lg border border-white/10 text-white text-xs"
                                />
                              </td>
                              <td className="p-3 align-top">
                                <input
                                  type="text"
                                  value={s.responsible.join(', ')}
                                  onChange={e => updateScheduleStage(s.id, 'responsible', e.target.value.split(',').map(x => x.trim()).filter(Boolean))}
                                  placeholder="Responsáveis..."
                                  className="w-full bg-black/30 p-2 rounded-lg border border-white/10 focus:border-cyan-500 focus:outline-none text-text-secondary text-xs"
                                />
                              </td>
                              <td className="p-3 align-top">
                                <textarea
                                  rows={2}
                                  value={s.deliverables}
                                  onChange={e => updateScheduleStage(s.id, 'deliverables', e.target.value)}
                                  placeholder="Entregas esperadas..."
                                  className="w-full bg-black/30 p-2 rounded-lg border border-white/10 focus:border-cyan-500 focus:outline-none text-text-secondary text-xs"
                                />
                              </td>
                              <td className="p-3 text-center align-middle">
                                <button
                                  onClick={() => removeScheduleStage(s.id)}
                                  className="text-text-muted hover:text-rose-400 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── ETAPA 7: TESTES DO PROJETO (ABA EVOLUTIVA) ── */}
                {activeTab === 7 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Activity className="w-4 h-4 text-cyan-400" />
                          Testes Do Projeto & Validação Evolutiva
                        </h4>
                        <p className="text-xs text-text-muted">
                          Registre evidências, tempos de ciclo, falhas e analise se as melhorias realmente funcionaram.
                        </p>
                      </div>
                      <button
                        onClick={handleOpenAddTest}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Adicionar Teste</span>
                      </button>
                    </div>

                    {(formData.tests || []).length === 0 ? (
                      <div className="py-12 text-center bg-black/20 rounded-xl border border-white/5 p-6 space-y-3">
                        <Activity className="w-8 h-8 text-text-muted mx-auto opacity-50" />
                        <p className="text-xs text-text-secondary">
                          Nenhum teste registrado ainda para este robô.
                        </p>
                        <button
                          onClick={handleOpenAddTest}
                          className="px-4 py-2 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold"
                        >
                          Registrar Primeiro Teste de Ciclo / Autônomo
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(formData.tests || []).map(test => (
                          <div key={test.id} className="p-5 rounded-2xl bg-black/30 border border-white/10 space-y-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 uppercase">
                                    {test.testType}
                                  </span>
                                  <span className="text-xs text-text-muted">
                                    Sistema: <strong className="text-white">{test.evaluatedSystem}</strong>
                                  </span>
                                </div>
                                <h5 className="text-base font-black text-white">{test.testName}</h5>
                                <p className="text-xs text-text-secondary">
                                  <strong>Objetivo:</strong> {test.objective} | <strong>Métrica:</strong> {test.metric}
                                </p>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setCurrentTest(JSON.parse(JSON.stringify(test)));
                                    setTestModalOpen(true);
                                  }}
                                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white"
                                  title="Editar teste"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => removeTest(test.id)}
                                  className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-text-secondary hover:text-rose-400"
                                  title="Remover teste"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Tabela de Tentativas do Teste */}
                            <div className="overflow-x-auto rounded-lg border border-white/5 bg-black/20">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-white/5 text-text-secondary text-[9px] uppercase font-bold">
                                  <tr>
                                    <th className="p-2 w-16 text-center">Tentativa</th>
                                    <th className="p-2 w-28">Tempo / Ciclo</th>
                                    <th className="p-2">Resultado</th>
                                    <th className="p-2">Problema Encontrado</th>
                                    <th className="p-2">Sugestão De Melhoria</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {test.attempts.map(att => (
                                    <tr key={att.id} className="hover:bg-white/[0.02]">
                                      <td className="p-2 text-center font-bold text-cyan-400">#{att.attemptNumber}</td>
                                      <td className="p-2 font-mono text-white">{att.timeOrCycle || '-'}</td>
                                      <td className="p-2 text-text-secondary">{att.result || '-'}</td>
                                      <td className="p-2 text-rose-300">{att.problemFound || '-'}</td>
                                      <td className="p-2 text-emerald-300">{att.improvementSuggestion || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Avaliação de Melhoria e Próxima Ação */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                              <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5 flex items-center justify-between">
                                <span className="text-text-muted font-bold">A melhoria funcionou?</span>
                                <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                                  test.improvementWorked === 'yes' ? 'bg-emerald-500/20 text-emerald-300' : test.improvementWorked === 'partially' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                                }`}>
                                  {test.improvementWorked === 'yes' ? 'Sim' : test.improvementWorked === 'partially' ? 'Parcialmente' : 'Não'}
                                </span>
                              </div>

                              <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5 flex items-center justify-between">
                                <span className="text-text-muted font-bold">Próxima ação:</span>
                                <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-cyan-500/20 text-cyan-300">
                                  {test.nextAction === 'keep' ? 'Manter' : test.nextAction === 'adjust' ? 'Ajustar' : test.nextAction === 'redo' ? 'Refazer' : 'Descartar'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Rodapé Fixo do Modal */}
              <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between gap-3 sticky bottom-0 z-20">
                <div className="text-xs text-text-muted hidden sm:block">
                  Etapa {activeTab} de 7: Todas as alterações são salvas diretamente no Supabase.
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsEditingModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveProject}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Salvando no Supabase...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Salvar B-Project</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Sub-Modal: Cadastrar Novo Sistema Customizado ── */}
      <AnimatePresence>
        {newSystemModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-primary border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">
                  Cadastrar Novo Sistema ({newSystemModal.categoryLabel})
                </h3>
                <button
                  onClick={() => setNewSystemModal({ open: false, category: 'drivetrain', categoryLabel: '' })}
                  className="text-text-muted hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase">
                  Nome do Sistema / Dispositivo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Intake com Roda Mecanum Direcionadora"
                  value={customSystemName}
                  onChange={e => setCustomSystemName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewSystemModal({ open: false, category: 'drivetrain', categoryLabel: '' })}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomSystem}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
                >
                  Adicionar ao Checklist
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Sub-Modal: Adicionar / Editar Teste Evolutivo ── */}
      <AnimatePresence>
        {testModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-primary border border-white/10 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-bold text-white">Registro de Teste do Projeto</h3>
                </div>
                <button onClick={() => setTestModalOpen(false)} className="text-text-muted hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-text-secondary uppercase">Nome do Teste *</label>
                  <input
                    type="text"
                    placeholder="Ex: Teste de Ciclo, Teste de Autônomo, Teste de Coleta"
                    value={currentTest.testName || ''}
                    onChange={e => setCurrentTest({ ...currentTest, testName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">Sistema Avaliado</label>
                  <input
                    type="text"
                    placeholder="Ex: Locomoção, coleta, depósito, sensor..."
                    value={currentTest.evaluatedSystem || ''}
                    onChange={e => setCurrentTest({ ...currentTest, evaluatedSystem: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">Tipo de Teste</label>
                  <select
                    value={currentTest.testType || 'teleop'}
                    onChange={e => setCurrentTest({ ...currentTest, testType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-xs"
                  >
                    <option value="teleop">TeleOp</option>
                    <option value="autonomous">Autônomo</option>
                    <option value="endgame">End Game</option>
                    <option value="mechanical">Mecânico / Resistência</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">Objetivo (O que validar?)</label>
                  <input
                    type="text"
                    placeholder="Ex: Validar se a garra não solta a amostra em aceleração máxima"
                    value={currentTest.objective || ''}
                    onChange={e => setCurrentTest({ ...currentTest, objective: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">Métrica Avaliada</label>
                  <input
                    type="text"
                    placeholder="Ex: Tempo de ciclo (s), taxa de acerto (%)"
                    value={currentTest.metric || ''}
                    onChange={e => setCurrentTest({ ...currentTest, metric: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              {/* Tentativas */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Registro de Tentativas
                  </h4>
                  <button
                    type="button"
                    onClick={addAttemptToCurrentTest}
                    className="px-2.5 py-1 rounded bg-cyan-600/20 text-cyan-300 text-[11px] font-bold border border-cyan-500/30 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Adicionar Tentativa</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-text-secondary text-[9px] uppercase font-bold">
                      <tr>
                        <th className="p-2 w-12 text-center">#</th>
                        <th className="p-2 w-28">Tempo / Ciclo</th>
                        <th className="p-2">Resultado</th>
                        <th className="p-2">Problema Encontrado</th>
                        <th className="p-2">Sugestão de Melhoria</th>
                        <th className="p-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(currentTest.attempts || []).map(att => (
                        <tr key={att.id}>
                          <td className="p-2 text-center font-bold text-cyan-400">#{att.attemptNumber}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Ex: 11.2s"
                              value={att.timeOrCycle}
                              onChange={e => updateAttemptInCurrentTest(att.id, 'timeOrCycle', e.target.value)}
                              className="w-full bg-black/40 px-2 py-1 rounded border border-white/10 text-white text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Ex: 3/4 peças"
                              value={att.result}
                              onChange={e => updateAttemptInCurrentTest(att.id, 'result', e.target.value)}
                              className="w-full bg-black/40 px-2 py-1 rounded border border-white/10 text-white text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Ex: Garra patinou"
                              value={att.problemFound}
                              onChange={e => updateAttemptInCurrentTest(att.id, 'problemFound', e.target.value)}
                              className="w-full bg-black/40 px-2 py-1 rounded border border-white/10 text-white text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Ex: Aumentar fricção silicone"
                              value={att.improvementSuggestion}
                              onChange={e => updateAttemptInCurrentTest(att.id, 'improvementSuggestion', e.target.value)}
                              className="w-full bg-black/40 px-2 py-1 rounded border border-white/10 text-white text-xs"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeAttemptFromCurrentTest(att.id)}
                              className="text-text-muted hover:text-rose-400"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Avaliação de Melhoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">A melhoria funcionou?</label>
                  <select
                    value={currentTest.improvementWorked || 'partially'}
                    onChange={e => setCurrentTest({ ...currentTest, improvementWorked: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-xs font-bold"
                  >
                    <option value="yes">Sim</option>
                    <option value="partially">Parcialmente</option>
                    <option value="no">Não</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary uppercase">Próxima ação:</label>
                  <select
                    value={currentTest.nextAction || 'adjust'}
                    onChange={e => setCurrentTest({ ...currentTest, nextAction: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-xs font-bold"
                  >
                    <option value="keep">Manter</option>
                    <option value="adjust">Ajustar</option>
                    <option value="redo">Refazer</option>
                    <option value="discard">Descartar</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setTestModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveTest}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md"
                >
                  Salvar Teste
                </button>
              </div>
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
                Tem certeza que deseja excluir este B-Project permanentemente do Supabase? Todas as 7 matrizes e registros de testes serão apagados.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteProject(deleteConfirmId)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-500/20"
                >
                  Excluir Definitivamente
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

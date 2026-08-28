import React from 'react';

// --- Role & Team Mission Types ---
export type UserRole = 'member' | 'technician';

export interface RealmXpReward {
  realm: Realm;
  xp: number;
}

export type EvidenceType = 'conclusion' | 'certificate' | 'practical_application' | 'practical_presentation';

export interface TeamMission {
  id: string;
  title: string;
  description: string;
  realmRewards: RealmXpReward[]; // Used for backward compatibility/saving calculated XP
  credit_reward: number;
  difficulty: Difficulty;
  duration_est_min: number;
  deadline: string;
  createdBy: string;
  assignedTo: string[];   // empty = all members
  completedBy: string[];
  createdAt: string;

  // New leveling math fields
  missionLevel: number; // 1 to 5
  evidenceType: EvidenceType;
  evidenceMultiplier: number; // 1.0, 1.2, 1.5, 2.0
  competencyWeights?: { realm: Realm; percentage: number }[]; // weights totaling exactly 100
}

export type KanbanStatus = 'todo' | 'in_progress' | 'done';

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  status: KanbanStatus;
  assignee: string; 
  createdBy: string;
  missionId?: string; // Optional link to a TeamMission
  createdAt: string;
}

export enum Realm {
  TechnicalWriting = "TechnicalWriting",
  Networking = "Networking",
  Oratory = "Oratory",
  Planning = "Planning",
  Creativity = "Creativity",
  Programming = "Programming",
  Engineering = "Engineering",
  FirstCulture = "FirstCulture",
}

export enum Difficulty {
  Easy = "Easy",
  Medium = "Medium",
  Hard = "Hard",
}

export enum QuestStatus {
  Pending = "pending",
  InProgress = "in_progress",
  Completed = "completed",
}

export enum TopicDifficulty {
    Easy = "Easy",
    Medium = "Medium",
    Hard = "Hard",
    SuperHard = "SuperHard"
}

export interface KnowledgeTopic {
    id: string;
    name: string;
    difficulty: TopicDifficulty;
    skillId: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  realm: Realm;
  knowledgeTopics: string[];
  xp_reward: number;
  credit_reward: number;
  difficulty: Difficulty;
  duration_est_min: number;
  status: QuestStatus;
  deadline?: string;
  penalty?: {
      type: 'xp' | 'credits';
      amount: number;
  };
  isMystery?: boolean;
  chain?: {
    current: number;
    total: number;
  };
  isBossQuest?: boolean;
  isWeeklyBoss?: boolean;
  source?: 'google_calendar' | 'github' | 'user' | 'ai_chatbot' | 'ai_system';
  realmRewards?: RealmXpReward[];  // Multi-realm XP distribution
}

export interface Skill {
  id:string;
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  realm: Realm;
  priority: number; // 1 to 5
  isActive: boolean;
  xpScale: number;
}

export interface Arc {
    id: string;
    title: string;
    description: string;
    type: 'Exam' | 'Fitness' | 'Cyber Dungeon';
    effects: string[];
    isGenerated?: boolean;
}

export interface StoreItem {
    id:string;
    name: string;
    description: string;
    cost: number;
    category: 'Buff' | 'Utility' | 'Reward';
    effect: {
        type: 'XP_BOOST' | 'STREAK_SAVER' | 'QUEST_REROLL' | 'INSTANT_STREAK' | 'REAL_WORLD_REWARD';
        value?: number; // e.g., 2 for 2x XP boost
        duration?: number; // duration in hours
        realms?: Realm[];
    };
    isGenerated?: boolean;
}

export interface ActiveBuff {
    itemId: string;
    itemName: string;
    expiryTimestamp: number;
    effect: StoreItem['effect'];
}

export interface InventoryItem {
    itemId: string;
    quantity: number;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string; // Icon name as a string
    isGenerated?: boolean; // To distinguish system vs user-created badges
}

export interface UserState {
  coreMission: string;
  longTermGoals: string;
  shortTermGoals: string;
  emergencyGoals: string;
  sideQuests: string;
  awardFocus: string;
}

export interface ActiveTimedQuest {
  title: string;
  realm: Realm;
  estimatedMinutes: number;
  startTime: string; // ISO string
}

export interface User {
  name: string;
  fullName?: string;
  role?: string;
  grade?: string;        // Série (ex: 3º Ano Médio)
  seasons?: string[];            // Temporadas como competidor
  mentorSeasons?: string[];      // Temporadas como mentor
  volunteerSeasons?: string[];   // Temporadas como voluntário
  entryDate?: string;    // Data de entrada na equipe
  birthDate?: string;    // Data de nascimento
  bio?: string;          // Breve descrição / Quem sou eu
  awardFocus?: string | null;
  rank: string;
  level_overall: number;
  xp_total: number;
  xpToNextLevel: number;
  stats: {
    [key in Realm]: number;
  };
  wallet: {
    credits: number;
    gems: number;
  };
  skill_tree: { [skill_id: string]: Skill };
  knowledgeBase: { [topic_id: string]: KnowledgeTopic };
  streaks: {
    daily_streak: number;
    lastQuestCompletionDate?: string | null;
  };
  activeArc: Arc | null;
  inventory: InventoryItem[];
  activeBuffs: ActiveBuff[];
  questsCompleted: number;
  bossQuestsCompleted: number;
  unlockedBadges: string[];
  staked_credits: number;
  stakedBuffs: { [itemId: string]: number };
  lastWeeklyBossDate?: string | null;
  state: UserState;
  completedMajorGoals?: MajorGoal[];
  activeTimedQuest?: ActiveTimedQuest | null;
  profileSetup?: boolean;
  initialLevelsSet?: boolean;
  initialStats?: { [key in Realm]?: number }; // Snapshot do nivelamento inicial definido pelo técnico
}

export interface StoryLogEntry {
  id: string;
  date: string;
  title: string;
  narrative: string;
}

export interface SystemMessage {
    id:string;
    text: string;
    timestamp: string;
    type: 'info' | 'warning' | 'system' | 'reward';
}

export interface Integration {
  id: string;
  name: string;
  connected: boolean;
  description: string;
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: string;
}

export interface TeamChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: string;
    conversationId: string;
}


export interface WeeklyProgress {
    day: string;
    xp: number;
}

export interface ActivityData {
    date: string; // YYYY-MM-DD format
    skillId: string;
    xp: number;
}

// FIX: Renamed BossChallenge to MajorGoal and battlePlan to syllabus for consistency.
export interface MajorGoal {
  id: string;
  title: string;
  description: string;
  type: 'Siege' | 'Forge' | 'Gauntlet'; // Exam, Project, Hackathon
  deadline: string; // ISO String
  xp_reward: number;
  credit_reward: number;
  syllabus?: string; // Formerly battlePlan
  skillId?: string;
  penalty?: {
      type: 'xp' | 'credits';
      amount: number;
  };
}

export interface JournalEntry {
    id: string;
    majorGoalId: string;
    majorGoalTitle: string;
    reflectionText: string;
    generatedChecklistQuestIds: string[];
    timestamp: string;
}

export interface RewardNotification {
    id: string;
    type: 'xp' | 'credits';
    originalAmount: number;
    finalAmount: number;
}

export interface AiSkillRecommendation {
    name: string;
    realm: Realm;
    reason: string;
}

export interface AiTopicRecommendation {
    name: string;
    skillId: string;
    reason: string;
}

export interface AiRecommendations {
    skills: AiSkillRecommendation[];
    topics: AiTopicRecommendation[];
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

// ─── Notification Types ──────────────────────────────────────────────────────

export type NotificationType = 
  | 'new_mission' 
  | '5w2h_submitted' 
  | '5w2h_reviewed' 
  | 'mission_completed'
  | 'evaluation_pending'
  | 'activity_evaluated';

export interface AppNotification {
  id: string;
  recipientUsername: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
}

export interface PrinterQueueItem {
    id: string;
    filename: string;
    userName: string;
    status: 'pending' | 'printing' | 'completed';
    createdAt: string;
    materialType?: 'ABS' | 'PLA' | 'TPU' | 'PETG';
    materialQuantity?: number; // em gramas
    color?: string;
    brand?: string;
    estimatedTime?: string; // ex: "2h 30m"
    quality?: number; // 0-10
    hasProblem?: boolean;
    problemDescription?: string;
    completedAt?: string;
    imageLinks?: string[]; // Links externos de imagens/fotos da peça
}

// ─── 5W2H Types ───────────────────────────────────────────────────────────────

export type FiveW2HPlanStatus = 'pending_review' | 'approved' | 'in_progress' | 'done';

export interface FiveW2HPlan {
  id: string;

  // 5W2H Fields
  what: string;       // O quê?
  why: string;        // Por quê?
  who: string;        // Quem?
  where: string;      // Onde?
  when: string;       // Quando? (ISO date string)
  how: string;        // Como?
  howMuch: string;    // Quanto custa / quanto tempo?

  // Metadata
  title: string;
  createdBy: string;         // username of creator
  assignedTo: string[];      // usernames – empty = only creator
  isGroup: boolean;

  status: FiveW2HPlanStatus;
  createdAt: string;         // ISO
  updatedAt: string;         // ISO

  // XP rewards (filled by technician review)
  realmRewards: RealmXpReward[];  // reusing existing type
  creditReward: number;

  // Technician review
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;

  // Links externos de imagens/evidências
  imageLinks?: string[];
}

// ─── Mentor & Mentorship Record Types ───────────────────────────────────────

export interface Mentor {
  id: string;
  name: string;
  area: string;
  organization?: string;
  active: boolean;
  role: 'mentor' | 'volunteer' | 'both'; // Papel desta pessoa
}

export interface MentorshipRecord {
  id: string;
  mentorId?: string;
  mentorName: string;
  date: string; // ISO string ou YYYY-MM-DD
  workloadHours: number; // Carga horária em horas (do formulário B-Leed)
  participants: string[]; // usernames dos membros participantes
  objectives: string; // Objetivos da Mentoria
  solutions: string; // Soluções Encontradas
  nextSteps: string; // Próximos Passos
  area?: string; // Área de foco / especialidade do mentor
  imageLinks?: string[]; // Links externos de imagens/evidências
  evaluation?: ActivityEvaluation; // Avaliação e pontuação atribuída pelos técnicos
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

// ─── Scan B-Leed OCR Types ──────────────────────────────────────────────────
export interface BLeedScanMentoriasData {
  formType: 'mentorias';
  date: string; // YYYY-MM-DD
  workloadHours: number;
  mentorName: string;
  isNewMentor?: boolean;
  participants: string[];
  objectives: string;
  solutions: string;
  nextSteps: string;
}

export interface BLeedScanEvolucaoData {
  formType: 'evolucao_coletiva';
  date: string; // YYYY-MM-DD
  workloadHours: number;
  invitedTeam: string;
  participants: string[];
  meetingObjectives: string;
  solutionsFound: string;
  nextSteps: string;
}

export interface BLeedScanAutonomoData {
  formType: 'desenvolvimento_autonomo';
  date: string; // YYYY-MM-DD
  workloadHours: number;
  courseName: string;
  participants: string[];
  courseObjectives: string;
  courseSyllabus: string;
  keyLearnings: string;
}

export type BLeedScanData = BLeedScanMentoriasData | BLeedScanEvolucaoData | BLeedScanAutonomoData;

// Contribuição individual de um voluntário em um trabalho
export interface VolunteerContribution {
  username: string;
  contribution: string; // O que esta pessoa fez no evento
  durationHours?: number; // Tempo de atuação em horas
}

export interface VolunteerWork {
  id: string;
  eventName: string;       // Nome do evento
  location: string;        // Onde foi
  date: string;            // YYYY-MM-DD
  description: string;     // Descrição geral do trabalho
  contributions: VolunteerContribution[]; // Lista de voluntários + o que cada um fez
  imageLinks?: string[]; // Links externos de imagens/evidências
}

// ─── Prototypes / Protótipos Types ─────────────────────────────────────────

export type PrototypeType = 
  | 'mechanics'      // Mecânica / Estrutura
  | 'electronics'    // Eletrônica / Elétrica / Sensores
  | 'programming'    // Programação / Autônomo / Controle
  | 'software'       // Telemetria / Software / Web
  | 'innovation'     // Projeto de Inovação / Design
  | '3d_printing'    // Prototipagem / Peça 3D
  | 'outreach'       // Divulgação / Social / B-LEED
  | 'other';         // Outro

export type ProjectType = PrototypeType; // alias retrocompatível

export type PrototypeOutcome = 
  | 'worked'        // Funcionou com sucesso
  | 'partially'     // Parcialmente (com ressalvas)
  | 'failed'        // Não funcionou / Aprendizado
  | 'testing';      // Em testes / Em andamento

export type ProjectOutcome = PrototypeOutcome; // alias retrocompatível

export type PrototypeStatus = 
  | 'in_progress'   // Em andamento
  | 'completed'     // Concluído
  | 'paused'        // Pausado
  | 'archived';     // Arquivado

export type ProjectStatus = PrototypeStatus; // alias retrocompatível

export interface PrototypePhoto {
  id: string;
  dataUrl: string;       // Base64 comprimida <= 100 KB
  sizeKb: number;        // Tamanho exato em KB para transparência
  caption?: string;      // Legenda opcional da foto
  uploadedAt: string;    // ISO string
}

export type ProjectPhoto = PrototypePhoto; // alias retrocompatível

export interface PrototypeItem {
  id: string;
  title: string;                 // Nome do protótipo
  projectType: PrototypeType;    // Tipo/Área técnica do protótipo
  customTypeLabel?: string;      // Rótulo se for 'other' ou custom
  objective: string;             // Qual o objetivo / o que busca resolver
  outcome: PrototypeOutcome;     // Se funcionou / resultado
  status: PrototypeStatus;       // Status de andamento
  considerations: string;        // Considerações, lições aprendidas, melhorias
  photos: PrototypePhoto[];      // Fotos comprimidas (< 100kb cada)
  members: string[];             // Membros envolvidos (usernames)
  createdBy: string;             // Autor do registro
  tags?: string[];               // Tags ou pilares relacionados
  createdAt: string;             // ISO string
  updatedAt: string;             // ISO string
}

export type ProjectItem = PrototypeItem; // alias retrocompatível

// ─── B-Project (Robôs, Temporada & Engenharia FTC) Types ───────────────────

export interface BProjectMilestone {
  id: string;
  name: string;
  deadline: string;
  expectedResult: string;
  completed?: boolean;
}

export interface BProjectGameRule {
  id: string;
  rule: string;
  projectImpact: string;
}

export interface BProjectStrategyDecision {
  id: string;
  guidingDecision: string;
  whyItMatters: string;
}

export type BProjectTechnicalCategory = 
  | 'drivetrain'
  | 'chassis'
  | 'intake'
  | 'subsystems'
  | 'outtake'
  | 'sensors'
  | 'custom';

export interface BProjectTechnicalChoice {
  id: string;
  category: BProjectTechnicalCategory;
  categoryLabel?: string;
  selected: boolean;
  systemName: string;
  analysis: string; // Prós e contras para a estratégia
  isCustom?: boolean;
}

export interface BProjectTeamRole {
  id: string;
  area: string;
  responsible: string[];
  expectedDelivery: string;
}

export interface BProjectScheduleStage {
  id: string;
  stageName: string;
  startDate: string;
  endDate: string;
  responsible: string[];
  deliverables: string;
  completed: boolean;
  onTimeStatus?: 'on_time' | 'delayed' | 'pending';
}

export interface BProjectTestAttempt {
  id: string;
  attemptNumber: number;
  timeOrCycle: string; // Ex: "12.4s" ou "4 peças/min"
  result: string;
  problemFound: string;
  improvementSuggestion: string;
  date: string;
}

export type BProjectTestType = 'teleop' | 'autonomous' | 'endgame' | 'mechanical';

export interface BProjectTest {
  id: string;
  testName: string;
  evaluatedSystem: string;
  testType: BProjectTestType;
  objective: string;
  metric: string;
  attempts: BProjectTestAttempt[];
  improvementWorked?: 'yes' | 'partially' | 'no';
  nextAction?: 'keep' | 'adjust' | 'redo' | 'discard';
  createdAt: string;
  updatedAt: string;
}

export type BProjectStatus = 'planning' | 'building' | 'programming' | 'testing' | 'completed' | 'archived';

export interface BProjectItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  milestones: BProjectMilestone[];
  gameRules: BProjectGameRule[];
  strategyDecisions: BProjectStrategyDecision[];
  technicalChoices: BProjectTechnicalChoice[];
  teamOrganization: BProjectTeamRole[];
  schedule: BProjectScheduleStage[];
  tests: BProjectTest[];
  status: BProjectStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Forms / Registros de Formulários Types ─────────────────────────────────

export interface MemberSkillScore {
  username: string;
  realmScores: Partial<Record<Realm, number>>;
  totalXp: number;
  feedback?: string;
}

export interface ActivityEvaluation {
  id: string;
  evaluatedBy: string; // Username do técnico avaliador (ex: 'Jonas')
  evaluatedAt: string; // ISO string
  memberScores: Record<string, MemberSkillScore>; // username -> MemberSkillScore
  generalNotes?: string;
}

export type FormType = 'autonomous_dev' | 'collective_evolution';

export interface AutonomousDevForm {
  id: string;
  type: 'autonomous_dev';
  date: string;                  // YYYY-MM-DD
  workloadHours: number;         // Carga horária em horas
  courseName: string;            // Nome do curso
  courseUrl?: string;            // Link do curso / plataforma
  certificateUrl?: string;       // Link do certificado / comprovação
  participants: string[];        // Membros participantes (usernames)
  courseObjectives: string;      // Objetivos do curso
  courseSyllabus: string;        // Ementa do curso
  keyLearnings: string;          // Principais pontos aprendidos
  createdBy: string;             // Username do criador
  createdAt: string;             // ISO string
  updatedAt: string;             // ISO string
  evaluation?: ActivityEvaluation; // Avaliação e pontuação atribuída pelos técnicos
}

export interface CollectiveEvolutionForm {
  id: string;
  type: 'collective_evolution';
  date: string;                  // YYYY-MM-DD
  workloadHours: number;         // Carga horária da reunião em horas
  invitedTeam: string;           // Equipe convidada / parceira
  participants: string[];        // Membros participantes da nossa equipe (usernames)
  meetingObjectives: string;     // Objetivos da reunião
  solutionsFound: string;        // Soluções encontradas
  nextSteps: string;             // Próximos passos
  createdBy: string;             // Username do criador
  createdAt: string;             // ISO string
  updatedAt: string;             // ISO string
  evaluation?: ActivityEvaluation; // Avaliação e pontuação atribuída pelos técnicos
}

export type FormRecord = AutonomousDevForm | CollectiveEvolutionForm;




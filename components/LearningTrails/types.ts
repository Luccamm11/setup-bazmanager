export type TrailCategory = 'Programming' | 'Engineering' | 'CAD' | 'Management' | 'Marketing';
export type PillarType = 'Mentoria Estratégica' | 'Desenvolvimento Autônomo' | 'Aprendizagem Coletiva';
export type ProgressStatus = 'pending' | 'in_progress' | 'review' | 'completed';

export interface Competency {
  id: string;
  title: string;
  description: string;
  pillar: PillarType;
  evaluationMethod: string;
  xpReward: number; // Suggested XP for completing this competency
}

export interface TrailStage {
  id: string;
  level: string; // e.g. "Iniciante", "Intermediário", "Avançado"
  competencies: Competency[];
}

export interface LearningTrail {
  id: TrailCategory;
  title: string;
  description: string;
  stages: TrailStage[];
}

export interface MemberCompetencyProgress {
  competencyId: string;
  status: ProgressStatus;
  updatedAt: string;
}

export interface MemberTrailData {
  username: string;
  trailId: TrailCategory;
  activeStageId: string;
  progress: Record<string, MemberCompetencyProgress>; // Map of competencyId -> Progress
  assignedBy?: string;
  assignedAt: string;
}

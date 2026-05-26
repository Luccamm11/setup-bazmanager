export type PillarType = 'Mentoria Estratégica' | 'Desenvolvimento Autônomo' | 'Aprendizagem Coletiva';
export type ProgressStatus = 'pending' | 'in_progress' | 'review' | 'completed';

export interface Competency {
  id: string;
  title: string;
  description: string;
  pillar: PillarType;
  evaluationMethod: string;
  xpReward: number; 
}

export interface TrailStage {
  id: string;
  level: string; 
  competencies: Competency[];
}

export interface LearningTrail {
  id: string;
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
  trailId: string;
  activeStageId: string;
  progress: Record<string, MemberCompetencyProgress>; // Map of competencyId -> Progress
  assignedBy?: string;
  assignedAt: string;
  isArchived?: boolean; // For when the trail is deleted but we want to keep the record
}

export interface LearningTrailsData {
  definitions: LearningTrail[];
  progress: MemberTrailData[];
}

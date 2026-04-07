// data/awardProfiles.ts — Perfis de desenvolvimento por prêmio FIRST
import { AwardType } from './members';

export interface DefaultSkillDef {
  name: string;
  realm: string; // mapped to Realm enum in constants
  priority: number;
  xpScale: number;
}

export interface DefaultTopicDef {
  name: string;
  skillName: string; // reference by name, resolved at init
  difficulty: string; // 'Easy' | 'Medium' | 'Hard'
}

export interface DefaultGoalDef {
  title: string;
  description: string;
  type: 'Siege' | 'Forge' | 'Gauntlet';
  xp_reward: number;
  credit_reward: number;
  deadlineDaysFromNow: number;
}

export interface DefaultQuestDef {
  title: string;
  description: string;
  realm: string;
  xp_reward: number;
  credit_reward: number;
  difficulty: string;
  duration_est_min: number;
}

export interface AwardProfile {
  id: AwardType;
  name: string;
  namePtBR: string;
  description: string;
  descriptionPtBR: string;
  focusAreas: string[];
  attributes: string[];       // 6 attributes for radar chart
  attributesPtBR: string[];   // 6 attributes in PT-BR
  defaultSkills: DefaultSkillDef[];
  defaultTopics: DefaultTopicDef[];
  defaultGoals: DefaultGoalDef[];
  defaultQuests: DefaultQuestDef[];
}

// --------------------------------
// SUSTENTABILIDADE
// --------------------------------
const SUSTENTABILIDADE: AwardProfile = {
  id: 'Sustentabilidade',
  name: 'Sustainability',
  namePtBR: 'Sustentabilidade',
  description: 'Team planning, scheduling, financial sustainability, internal organization, goal monitoring, and team continuity.',
  descriptionPtBR: 'Planejamento da equipe, cronograma, sustentabilidade financeira, organização interna, monitoramento de metas e continuidade.',
  focusAreas: [
    'Planejamento da equipe', 'Cronograma', 'Sustentabilidade financeira',
    'Organização interna', 'Monitoramento de metas', 'Continuidade da equipe'
  ],
  attributes: ['Planning', 'Management', 'Responsibility', 'Strategic Vision', 'Organization', 'Decision Making'],
  attributesPtBR: ['Planejamento', 'Gestão', 'Responsabilidade', 'Visão Estratégica', 'Organização', 'Tomada de Decisão'],
  defaultSkills: [
    { name: 'Gestão de Projetos', realm: 'Mind', priority: 5, xpScale: 1.0 },
    { name: 'Planejamento Estratégico', realm: 'Mind', priority: 4, xpScale: 1.0 },
    { name: 'Gestão Financeira', realm: 'Mind', priority: 4, xpScale: 1.2 },
    { name: 'Organização Interna', realm: 'Spirit', priority: 3, xpScale: 0.8 },
    { name: 'Liderança Operacional', realm: 'Spirit', priority: 3, xpScale: 1.0 },
    { name: 'Captação de Recursos', realm: 'Creation', priority: 3, xpScale: 1.2 },
  ],
  defaultTopics: [
    { name: 'Planejamento de projetos FTC', skillName: 'Gestão de Projetos', difficulty: 'Medium' },
    { name: 'Gestão financeira de equipe', skillName: 'Gestão Financeira', difficulty: 'Medium' },
    { name: 'Cronograma operacional', skillName: 'Planejamento Estratégico', difficulty: 'Easy' },
    { name: 'Documentação de processos', skillName: 'Organização Interna', difficulty: 'Easy' },
    { name: 'Estratégias de captação de patrocínios', skillName: 'Captação de Recursos', difficulty: 'Hard' },
  ],
  defaultGoals: [
    { title: 'Orçamento da Temporada', description: 'Criar e aprovar o orçamento detalhado para toda a temporada FTC', type: 'Forge', xp_reward: 500, credit_reward: 200, deadlineDaysFromNow: 30 },
    { title: 'Cronograma de Atividades', description: 'Publicar cronograma semanal de treinos, reuniões e entregas para toda a equipe', type: 'Forge', xp_reward: 400, credit_reward: 150, deadlineDaysFromNow: 21 },
    { title: 'Plano de Captação de Recursos', description: 'Definir e documentar estratégias para captação de patrocínio e apoio financeiro', type: 'Siege', xp_reward: 600, credit_reward: 250, deadlineDaysFromNow: 45 },
  ],
  defaultQuests: [
    { title: 'Listar todas as despesas previstas', description: 'Levantar custos de materiais, inscrição, viagem e equipamentos para a temporada', realm: 'Mind', xp_reward: 80, credit_reward: 30, difficulty: 'Easy', duration_est_min: 45 },
    { title: 'Criar cronograma semanal', description: 'Montar o cronograma de atividades da equipe para as próximas 4 semanas', realm: 'Mind', xp_reward: 100, credit_reward: 40, difficulty: 'Medium', duration_est_min: 60 },
    { title: 'Mapear potenciais patrocinadores', description: 'Pesquisar empresas e instituições da região que possam apoiar a equipe', realm: 'Creation', xp_reward: 120, credit_reward: 50, difficulty: 'Medium', duration_est_min: 90 },
    { title: 'Documentar estrutura da equipe', description: 'Criar documento descrevendo papéis, responsabilidades e organograma da Bazinga!', realm: 'Spirit', xp_reward: 80, credit_reward: 30, difficulty: 'Easy', duration_est_min: 40 },
  ],
};

// --------------------------------
// PENSAMENTO CRIATIVO
// --------------------------------
const PENSAMENTO_CRIATIVO: AwardProfile = {
  id: 'PensamentoCriativo',
  name: 'Think Award',
  namePtBR: 'Pensamento Criativo',
  description: 'Technical documentation, engineering process, trade-off analysis, lessons learned, communication clarity, portfolio organization.',
  descriptionPtBR: 'Documentação técnica, processo de engenharia, análise de trade-offs, lições aprendidas, clareza de comunicação e portfólio.',
  focusAreas: [
    'Documentação técnica', 'Processo de engenharia', 'Análise de trade-offs',
    'Lições aprendidas', 'Clareza de comunicação', 'Organização de portfólio'
  ],
  attributes: ['Organization', 'Technical Writing', 'Analysis', 'Engineering Process', 'Communication Clarity', 'Continuous Learning'],
  attributesPtBR: ['Organização', 'Escrita Técnica', 'Análise', 'Processo de Engenharia', 'Clareza de Comunicação', 'Aprendizado Contínuo'],
  defaultSkills: [
    { name: 'Documentação Técnica', realm: 'Mind', priority: 5, xpScale: 1.0 },
    { name: 'Processo de Engenharia', realm: 'Creation', priority: 5, xpScale: 1.0 },
    { name: 'Análise Crítica', realm: 'Mind', priority: 4, xpScale: 1.2 },
    { name: 'Comunicação Escrita', realm: 'Spirit', priority: 4, xpScale: 0.8 },
    { name: 'Portfólio de Engenharia', realm: 'Creation', priority: 3, xpScale: 1.0 },
    { name: 'Pesquisa e Referências', realm: 'Mind', priority: 3, xpScale: 1.0 },
  ],
  defaultTopics: [
    { name: 'Estrutura do Engineering Portfolio', skillName: 'Portfólio de Engenharia', difficulty: 'Medium' },
    { name: 'Registro de ciclos de engenharia', skillName: 'Processo de Engenharia', difficulty: 'Medium' },
    { name: 'Análise de trade-offs em design', skillName: 'Análise Crítica', difficulty: 'Hard' },
    { name: 'Redação técnica clara e objetiva', skillName: 'Comunicação Escrita', difficulty: 'Medium' },
    { name: 'Documentação de lições aprendidas', skillName: 'Documentação Técnica', difficulty: 'Easy' },
  ],
  defaultGoals: [
    { title: 'Engineering Portfolio v1', description: 'Estruturar e preencher as seções principais do Engineering Portfolio da equipe', type: 'Forge', xp_reward: 600, credit_reward: 250, deadlineDaysFromNow: 45 },
    { title: 'Registro de 5 Ciclos de Engenharia', description: 'Documentar pelo menos 5 ciclos completos de design-build-test-iterate', type: 'Siege', xp_reward: 500, credit_reward: 200, deadlineDaysFromNow: 60 },
    { title: 'Análise de Trade-offs do Robô', description: 'Criar análise comparativa formal de pelo menos 3 decisões de design com trade-offs documentados', type: 'Forge', xp_reward: 400, credit_reward: 150, deadlineDaysFromNow: 30 },
  ],
  defaultQuests: [
    { title: 'Definir estrutura do portfólio', description: 'Criar índice e template para cada seção do Engineering Portfolio', realm: 'Mind', xp_reward: 100, credit_reward: 40, difficulty: 'Medium', duration_est_min: 60 },
    { title: 'Documentar primeiro ciclo de engenharia', description: 'Registrar um ciclo completo: problema → brainstorm → design → build → test → aprendizados', realm: 'Creation', xp_reward: 120, credit_reward: 50, difficulty: 'Medium', duration_est_min: 90 },
    { title: 'Fotografar processo de montagem', description: 'Tirar fotos documentando cada etapa da montagem atual do robô', realm: 'Creation', xp_reward: 60, credit_reward: 20, difficulty: 'Easy', duration_est_min: 30 },
    { title: 'Escrever resumo de lições aprendidas', description: 'Listar 3 principais aprendizados da última sessão de trabalho', realm: 'Spirit', xp_reward: 80, credit_reward: 30, difficulty: 'Easy', duration_est_min: 30 },
  ],
};

// --------------------------------
// CONEXÃO
// --------------------------------
const CONEXAO: AwardProfile = {
  id: 'Conexao',
  name: 'Connect Award',
  namePtBR: 'Conexão',
  description: 'Business/university relationships, networking, mentors, institutional communication, team development plan, team presentation.',
  descriptionPtBR: 'Relacionamento com empresas/universidades, networking, mentores, comunicação institucional e apresentação da equipe.',
  focusAreas: [
    'Relacionamento com empresas/universidades', 'Networking', 'Mentores',
    'Comunicação institucional', 'Plano de desenvolvimento da equipe', 'Apresentação da equipe'
  ],
  attributes: ['Communication', 'Networking', 'Professional Posture', 'Planning', 'Persuasion', 'Proactivity'],
  attributesPtBR: ['Comunicação', 'Networking', 'Postura Profissional', 'Planejamento', 'Persuasão', 'Proatividade'],
  defaultSkills: [
    { name: 'Comunicação Institucional', realm: 'Spirit', priority: 5, xpScale: 1.0 },
    { name: 'Networking', realm: 'Spirit', priority: 5, xpScale: 1.0 },
    { name: 'Apresentação e Pitch', realm: 'Spirit', priority: 4, xpScale: 1.0 },
    { name: 'Planejamento de Parcerias', realm: 'Mind', priority: 4, xpScale: 1.2 },
    { name: 'Marketing da Equipe', realm: 'Creation', priority: 3, xpScale: 0.8 },
    { name: 'Relações Públicas', realm: 'Spirit', priority: 3, xpScale: 1.0 },
  ],
  defaultTopics: [
    { name: 'Como abordar uma empresa para parceria', skillName: 'Networking', difficulty: 'Medium' },
    { name: 'Preparação de pitch de equipe', skillName: 'Apresentação e Pitch', difficulty: 'Medium' },
    { name: 'Escrita de e-mails profissionais', skillName: 'Comunicação Institucional', difficulty: 'Easy' },
    { name: 'Plano de desenvolvimento da equipe (Team Development Plan)', skillName: 'Planejamento de Parcerias', difficulty: 'Hard' },
    { name: 'Criação de material de apresentação', skillName: 'Marketing da Equipe', difficulty: 'Medium' },
  ],
  defaultGoals: [
    { title: 'Mapa de Parceiros v1', description: 'Mapear e contatar pelo menos 10 potenciais parceiros (empresas, universidades, profissionais)', type: 'Forge', xp_reward: 500, credit_reward: 200, deadlineDaysFromNow: 30 },
    { title: 'Pitch Deck da Bazinga!', description: 'Criar uma apresentação profissional de 5 minutos sobre a equipe para uso em networking', type: 'Forge', xp_reward: 400, credit_reward: 150, deadlineDaysFromNow: 21 },
    { title: '3 Parcerias Ativas', description: 'Formalizar pelo menos 3 parcerias com empresas ou instituições', type: 'Siege', xp_reward: 700, credit_reward: 300, deadlineDaysFromNow: 75 },
  ],
  defaultQuests: [
    { title: 'Pesquisar empresas de tecnologia na região', description: 'Listar 10 empresas que poderiam se interessar por apoiar a equipe', realm: 'Mind', xp_reward: 80, credit_reward: 30, difficulty: 'Easy', duration_est_min: 45 },
    { title: 'Preparar e-mail modelo de contato', description: 'Escrever um template de e-mail profissional para primeiro contato com parceiros', realm: 'Spirit', xp_reward: 100, credit_reward: 40, difficulty: 'Medium', duration_est_min: 40 },
    { title: 'Criar one-pager da equipe', description: 'Montar um documento visual de 1 página com informações-chave da Bazinga!', realm: 'Creation', xp_reward: 120, credit_reward: 50, difficulty: 'Medium', duration_est_min: 60 },
    { title: 'Agendar primeira visita/reunião de networking', description: 'Contatar e agendar ao menos uma reunião com um potencial parceiro', realm: 'Spirit', xp_reward: 150, credit_reward: 60, difficulty: 'Hard', duration_est_min: 30 },
  ],
};

// --------------------------------
// ALCANCE
// --------------------------------
const ALCANCE: AwardProfile = {
  id: 'Alcance',
  name: 'Motivate Award',
  namePtBR: 'Alcance',
  description: 'FIRST outreach, social impact, workshops and events, new participant recruitment, community actions, creative outreach materials.',
  descriptionPtBR: 'Divulgação da FIRST, impacto social, oficinas e eventos, recrutamento, ações comunitárias e materiais criativos.',
  focusAreas: [
    'Divulgação da FIRST', 'Impacto social', 'Oficinas e eventos',
    'Recrutamento de novos participantes', 'Ações com comunidade', 'Materiais criativos de outreach'
  ],
  attributes: ['Public Speaking', 'Leadership', 'Creativity', 'Engagement', 'Event Organization', 'Social Impact'],
  attributesPtBR: ['Oratória', 'Liderança', 'Criatividade', 'Engajamento', 'Organização de Eventos', 'Impacto Social'],
  defaultSkills: [
    { name: 'Oratória e Apresentação', realm: 'Spirit', priority: 5, xpScale: 1.0 },
    { name: 'Organização de Eventos', realm: 'Creation', priority: 5, xpScale: 1.0 },
    { name: 'Criação de Conteúdo', realm: 'Creation', priority: 4, xpScale: 0.8 },
    { name: 'Impacto Social', realm: 'Spirit', priority: 4, xpScale: 1.2 },
    { name: 'Recrutamento e Engajamento', realm: 'Spirit', priority: 3, xpScale: 1.0 },
    { name: 'Divulgação da FIRST', realm: 'Mind', priority: 3, xpScale: 1.0 },
  ],
  defaultTopics: [
    { name: 'Valores e missão da FIRST', skillName: 'Divulgação da FIRST', difficulty: 'Easy' },
    { name: 'Planejamento de oficinas de robótica', skillName: 'Organização de Eventos', difficulty: 'Medium' },
    { name: 'Criação de posts para redes sociais', skillName: 'Criação de Conteúdo', difficulty: 'Easy' },
    { name: 'Técnicas de apresentação em público', skillName: 'Oratória e Apresentação', difficulty: 'Medium' },
    { name: 'Medição de impacto social', skillName: 'Impacto Social', difficulty: 'Hard' },
  ],
  defaultGoals: [
    { title: 'Primeira Oficina Comunitária', description: 'Planejar e executar uma oficina aberta de robótica para a comunidade local', type: 'Gauntlet', xp_reward: 600, credit_reward: 250, deadlineDaysFromNow: 30 },
    { title: 'Presença Digital Ativa', description: 'Criar e manter perfil ativo nas redes sociais com pelo menos 2 posts semanais sobre a equipe', type: 'Forge', xp_reward: 400, credit_reward: 150, deadlineDaysFromNow: 45 },
    { title: '4 Ações de Outreach', description: 'Realizar pelo menos 4 ações de outreach distintas durante a temporada', type: 'Siege', xp_reward: 700, credit_reward: 300, deadlineDaysFromNow: 90 },
  ],
  defaultQuests: [
    { title: 'Criar post sobre a FIRST no Instagram', description: 'Produzir um post educativo explicando o que é a FIRST e como participar', realm: 'Creation', xp_reward: 80, credit_reward: 30, difficulty: 'Easy', duration_est_min: 40 },
    { title: 'Planejar roteiro da primeira oficina', description: 'Definir público-alvo, cronograma, materiais necessários e atividades para a oficina', realm: 'Mind', xp_reward: 120, credit_reward: 50, difficulty: 'Medium', duration_est_min: 60 },
    { title: 'Visitar escola para divulgar robótica', description: 'Preparar apresentação e visitar uma escola da comunidade para falar sobre FIRST', realm: 'Spirit', xp_reward: 150, credit_reward: 60, difficulty: 'Hard', duration_est_min: 120 },
    { title: 'Registrar impacto de ação realizada', description: 'Documentar com fotos, números e depoimentos o resultado de uma ação de outreach', realm: 'Spirit', xp_reward: 100, credit_reward: 40, difficulty: 'Medium', duration_est_min: 45 },
  ],
};

// --------------------------------
// CONTROLE
// --------------------------------
const CONTROLE: AwardProfile = {
  id: 'Controle',
  name: 'Control Award',
  namePtBR: 'Controle',
  description: 'FTC programming, Java, sensors, automations, autonomous mode, software and hardware reliability.',
  descriptionPtBR: 'Programação FTC, Java, sensores, automações, autônomo e confiabilidade de software/hardware.',
  focusAreas: [
    'Programação FTC', 'Java', 'Sensores',
    'Automações', 'Autônomo', 'Confiabilidade de software e hardware'
  ],
  attributes: ['Programming', 'Logic', 'Sensors', 'Autonomy', 'Debug', 'Reliability'],
  attributesPtBR: ['Programação', 'Lógica', 'Sensores', 'Autonomia', 'Debug', 'Confiabilidade'],
  defaultSkills: [
    { name: 'Programação Java/Kotlin', realm: 'Mind', priority: 5, xpScale: 1.0 },
    { name: 'Programação Autônoma', realm: 'Creation', priority: 5, xpScale: 1.2 },
    { name: 'Sensores e Eletrônica', realm: 'Creation', priority: 4, xpScale: 1.0 },
    { name: 'Debug e Testes', realm: 'Mind', priority: 4, xpScale: 0.8 },
    { name: 'Controle de Motores', realm: 'Creation', priority: 3, xpScale: 1.0 },
    { name: 'Versionamento (Git)', realm: 'Mind', priority: 3, xpScale: 0.8 },
  ],
  defaultTopics: [
    { name: 'Estrutura de projeto FTC (FtcRobotController)', skillName: 'Programação Java/Kotlin', difficulty: 'Medium' },
    { name: 'Leitura e calibração de sensores', skillName: 'Sensores e Eletrônica', difficulty: 'Medium' },
    { name: 'PID Control básico', skillName: 'Controle de Motores', difficulty: 'Hard' },
    { name: 'Programação de rotinas autônomas', skillName: 'Programação Autônoma', difficulty: 'Hard' },
    { name: 'Uso de Git para versionamento de código', skillName: 'Versionamento (Git)', difficulty: 'Easy' },
  ],
  defaultGoals: [
    { title: 'TeleOp Funcional', description: 'Implementar controle TeleOp completo com controle de drive, intake e scoring mecanismos', type: 'Forge', xp_reward: 500, credit_reward: 200, deadlineDaysFromNow: 30 },
    { title: 'Autônomo Básico', description: 'Desenvolver uma rotina autônoma que consiga navegar e pontuar de forma confiável', type: 'Siege', xp_reward: 700, credit_reward: 300, deadlineDaysFromNow: 60 },
    { title: 'Pipeline de Visão Computacional', description: 'Implementar detecção de objetos no campo usando a câmera do robô', type: 'Siege', xp_reward: 600, credit_reward: 250, deadlineDaysFromNow: 75 },
  ],
  defaultQuests: [
    { title: 'Configurar ambiente de desenvolvimento', description: 'Instalar Android Studio, clonar FtcRobotController e compilar com sucesso', realm: 'Mind', xp_reward: 80, credit_reward: 30, difficulty: 'Easy', duration_est_min: 60 },
    { title: 'Implementar drive básico', description: 'Programar controle de movimentação (tank drive ou mecanum) funcional no TeleOp', realm: 'Creation', xp_reward: 120, credit_reward: 50, difficulty: 'Medium', duration_est_min: 90 },
    { title: 'Testar leitura de sensor de distância', description: 'Conectar e ler valores do sensor de distância no robô, exibindo no telemetry', realm: 'Creation', xp_reward: 100, credit_reward: 40, difficulty: 'Medium', duration_est_min: 45 },
    { title: 'Documentar arquitetura do código', description: 'Criar diagrama simples mostrando a estrutura de classes do projeto do robô', realm: 'Mind', xp_reward: 80, credit_reward: 30, difficulty: 'Easy', duration_est_min: 40 },
  ],
};

// --------------------------------
// INOVAÇÃO
// --------------------------------
const INOVACAO: AwardProfile = {
  id: 'Inovacao',
  name: 'Innovate Award',
  namePtBR: 'Inovação',
  description: 'Pensamento imaginativo, ingenuidade, criatividade mecânica, mitigação de riscos e estabilidade em inovações mecânicas/visuais.',
  descriptionPtBR: 'Pensamento imaginativo, engenhosidade, criatividade mecânica e documentação de mitigação de riscos.',
  focusAreas: [
    'Pensamento imaginativo', 'Criatividade mecânica', 'Engenhosidade e invenção',
    'Mitigação de riscos', 'Robô ou Mecanismo Único', 'Estabilidade e robustez'
  ],
  attributes: ['Imagination', 'Ingenuity', 'Risk Mitigation', 'Creativity', 'Stability', 'Uniqueness'],
  attributesPtBR: ['Imaginação', 'Engenhosidade', 'Mitigação de Riscos', 'Criatividade', 'Estabilidade', 'Originalidade'],
  defaultSkills: [
    { name: 'Engenharia Criativa', realm: 'Creation', priority: 5, xpScale: 1.0 },
    { name: 'Gestão de Riscos Mecânicos', realm: 'Mind', priority: 5, xpScale: 1.0 },
    { name: 'Prototipagem Inovadora', realm: 'Creation', priority: 4, xpScale: 1.2 },
    { name: 'Validação de Robustez', realm: 'Body', priority: 4, xpScale: 0.8 },
    { name: 'Design "Out of the Box"', realm: 'Creation', priority: 3, xpScale: 1.0 },
    { name: 'Documentação de Soluções', realm: 'Mind', priority: 3, xpScale: 1.0 },
  ],
  defaultTopics: [
    { name: 'Técnicas de brainstorm avançado (SCAMPER/TRIZ)', skillName: 'Engenharia Criativa', difficulty: 'Hard' },
    { name: 'Plano de Mitigação de Riscos', skillName: 'Gestão de Riscos Mecânicos', difficulty: 'Medium' },
    { name: 'Testes de estabilidade e quebra', skillName: 'Validação de Robustez', difficulty: 'Medium' },
    { name: 'Estruturação de portfólio para Innovate', skillName: 'Documentação de Soluções', difficulty: 'Easy' },
  ],
  defaultGoals: [
    { title: 'Protótipo do Mecanismo Inovador', description: 'Idear e prototipar um mecanismo único para o desafio da temporada', type: 'Forge', xp_reward: 500, credit_reward: 200, deadlineDaysFromNow: 30 },
    { title: 'Matriz de Risco do Robô', description: 'Criar documento com as fraquezas e planos de contingência do projeto', type: 'Siege', xp_reward: 400, credit_reward: 150, deadlineDaysFromNow: 21 },
  ],
  defaultQuests: [
    { title: 'Sessão de Brainstorming', description: 'Participar ou liderar sessão para encontrar soluções únicas', realm: 'Creation', xp_reward: 100, credit_reward: 50, difficulty: 'Medium', duration_est_min: 60 },
    { title: 'Documentar a evolução do design', description: 'Escrever como chegamos na solução mecânica atual', realm: 'Mind', xp_reward: 80, credit_reward: 30, difficulty: 'Easy', duration_est_min: 45 },
  ],
};

// --------------------------------
// DESIGN
// --------------------------------
const DESIGN: AwardProfile = {
  id: 'Design',
  name: 'Design Award',
  namePtBR: 'Design Industrial',
  description: 'Equilíbrio entre forma, função e estética. Design eficiente, executável e prático de manter com base sólida de plano de jogo.',
  descriptionPtBR: 'Design industrial que equilibre estética, função, manutenção rápida e coerência com a estratégia.',
  focusAreas: [
    'Design industrial', 'Manutenção prática', 'Estética e função',
    'Eficiência / Simplicidade', 'Integração de estratégia', 'Modelagem 3D perfeita'
  ],
  attributes: ['Aesthetics', 'Maintainability', 'Efficiency', 'CAD Design', 'Form vs Function', 'Simplicity'],
  attributesPtBR: ['Estética', 'Manutenibilidade', 'Eficiência', 'Projeto CAD', 'Forma vs Função', 'Simplicidade'],
  defaultSkills: [
    { name: 'Modelagem CAD Onshape', realm: 'Creation', priority: 5, xpScale: 1.0 },
    { name: 'Design para Manutenção', realm: 'Mind', priority: 5, xpScale: 1.0 },
    { name: 'Design Industrial (Estética)', realm: 'Creation', priority: 4, xpScale: 1.2 },
    { name: 'Análise Estratégica Espacial', realm: 'Mind', priority: 4, xpScale: 0.8 },
    { name: 'Usinagem CNC/Impressão 3D', realm: 'Body', priority: 3, xpScale: 1.0 },
    { name: 'Estratégia Mecânica', realm: 'Mind', priority: 3, xpScale: 1.0 },
  ],
  defaultTopics: [
    { name: 'Regras de Ouro de Design FTC', skillName: 'Design para Manutenção', difficulty: 'Medium' },
    { name: 'Boas práticas no CAD Onshape', skillName: 'Modelagem CAD Onshape', difficulty: 'Hard' },
    { name: 'Otimização de materiais e peso', skillName: 'Estratégia Mecânica', difficulty: 'Medium' },
    { name: 'Padronização visual (Cores, Logos)', skillName: 'Design Industrial (Estética)', difficulty: 'Easy' },
  ],
  defaultGoals: [
    { title: 'Modelo Funcional CAD v1', description: 'Finalizar o chassi e componentes centrais perfeitamente modelados e restritos', type: 'Forge', xp_reward: 600, credit_reward: 250, deadlineDaysFromNow: 40 },
    { title: 'Guia de Montagem e Manutenção', description: 'Criar manual de como consertar rapidamente partes vitais do robô (Pit Stop)', type: 'Siege', xp_reward: 500, credit_reward: 200, deadlineDaysFromNow: 60 },
  ],
  defaultQuests: [
    { title: 'Revisar tolerâncias no CAD', description: 'Analisar e arrumar os mates e folgas do robô 3D', realm: 'Mind', xp_reward: 120, credit_reward: 50, difficulty: 'Hard', duration_est_min: 90 },
    { title: 'Desenhar suportes estéticos ou side-panels', description: 'Projeto de placas de acrílico/policarbonato para proteger e embelezar', realm: 'Creation', xp_reward: 80, credit_reward: 35, difficulty: 'Medium', duration_est_min: 60 },
  ],
};

// --- Registry ---
export const AWARD_PROFILES: Record<AwardType, AwardProfile> = {
  Sustentabilidade: SUSTENTABILIDADE,
  PensamentoCriativo: PENSAMENTO_CRIATIVO,
  Conexao: CONEXAO,
  Alcance: ALCANCE,
  Controle: CONTROLE,
  Inovacao: INOVACAO,
  Design: DESIGN,
};

export const getAwardProfile = (awardType: AwardType): AwardProfile =>
  AWARD_PROFILES[awardType];

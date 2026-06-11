// data/members.ts — Fonte centralizada de membros da Bazinga! 73 FTC

export type AwardType =
  | 'Sustentabilidade'
  | 'PensamentoCriativo'
  | 'Conexao'
  | 'Alcance'
  | 'Controle'
  | 'Inovacao'
  | 'Design';

export type TeamRole = 'member' | 'technician';

export interface MemberProfile {
  username: string;
  displayName: string;
  fullName?: string;
  role: TeamRole;
  grade?: string;
  seasons?: string[];
  entryDate?: string;
  birthDate?: string;
  bio?: string;
  awardFocus: AwardType | null; 
  coreMission: string;
  seasonGoal: string;
  shortTermGoal: string;
  active?: boolean;
}

// --- Technicians ---
const JONAS: MemberProfile = {
  username: 'Jonas',
  displayName: 'Jonas',
  fullName: 'Jonas Lemos',
  role: 'technician',
  grade: 'Técnico / Mentor',
  seasons: ['Centerstage', 'PowerPlay', 'Freight Frenzy'],
  entryDate: '15/05/2021',
  birthDate: '10/02/1990',
  bio: 'Mentor apaixonado por robótica e focado em desenvolver líderes na Bazinga! 73.',
  awardFocus: null,
  coreMission: 'Orientar o desenvolvimento técnico e humano dos membros da Bazinga!, garantindo alinhamento com a metodologia B-LEED',
  seasonGoal: 'Conduzir a equipe a uma performance competitiva e formativa durante toda a temporada FTC',
  shortTermGoal: 'Estruturar o plano de desenvolvimento individual de cada membro para os próximos 2 meses',
};

const RAMON: MemberProfile = {
  username: 'Ramon',
  displayName: 'Ramon Montorri',
  role: 'technician',
  awardFocus: null,
  coreMission: 'Orientar a excelência técnica e estratégica da equipe, focando na evolução constante dos membros.',
  seasonGoal: 'Garantir que a equipe atinja seu potencial máximo técnico e organizacional nesta temporada.',
  shortTermGoal: 'Avaliar o status atual dos projetos e definir as prioridades para o próximo ciclo de desenvolvimento.',
};

// --- Members ---
const LUCCA: MemberProfile = {
  username: 'Lucca',
  displayName: 'Lucca',
  fullName: 'Lucca Menezes Miranda',
  role: 'member',
  grade: '9º Ano Ensino Fundamental',
  seasons: ['Decode', 'Biobuzz'],
  entryDate: '16/04/2025',
  birthDate: '11/11/2011',
  bio: 'Focado em sustentabilidade e eficiência mecânica. Busco transformar problemas em soluções inovadoras.',
  awardFocus: 'Sustentabilidade',
  coreMission: 'Garantir a sustentabilidade operacional e financeira da Bazinga! ao longo de toda a temporada',
  seasonGoal: 'Implementar um sistema de organização interna e cronograma de atividades que funcione de forma autônoma',
  shortTermGoal: 'Definir e documentar o orçamento detalhado da equipe para os próximos 3 meses',
};

const CLARICE: MemberProfile = {
  username: 'Clarice',
  displayName: 'Clarice',
  role: 'member',
  awardFocus: 'PensamentoCriativo',
  coreMission: 'Documentar e comunicar o processo de engenharia da Bazinga! com clareza e qualidade técnica (AE)',
  seasonGoal: 'Produzir um Engineering Portfolio completo que demonstre o pensamento criativo da equipe',
  shortTermGoal: 'Organizar a estrutura base do portfólio e registrar os 3 primeiros ciclos de engenharia',
};

const ANA_CLARA: MemberProfile = {
  username: 'Ana Clara',
  displayName: 'Ana Clara',
  role: 'member',
  awardFocus: 'PensamentoCriativo',
  coreMission: 'Documentar inovações e soluções técnicas do robô com foco em análise crítica e melhoria contínua (MCI)',
  seasonGoal: 'Criar documentação técnica detalhada de cada subsistema do robô com trade-offs e lições aprendidas',
  shortTermGoal: 'Documentar o processo de design do chassi e sistema de intake com fotos e análise',
};

const BERNARDO: MemberProfile = {
  username: 'Bernardo',
  displayName: 'Bernardo',
  role: 'member',
  awardFocus: 'Conexao',
  coreMission: 'Fortalecer as conexões da Bazinga! com empresas, universidades e mentores da comunidade FIRST',
  seasonGoal: 'Estabelecer pelo menos 3 parcerias ativas e um plano de networking documentado',
  shortTermGoal: 'Mapear potenciais parceiros na região e preparar material de apresentação da equipe',
};



const ENZO_SOARES: MemberProfile = {
  username: 'Enzo Soares',
  displayName: 'Enzo Soares',
  role: 'member',
  awardFocus: 'Controle',
  coreMission: 'Garantir a confiabilidade e performance do software e hardware de controle do robô',
  seasonGoal: 'Desenvolver um sistema autônomo robusto e um TeleOp eficiente para a competição',
  shortTermGoal: 'Implementar e testar o controle básico de drive com odometria funcional',
};

const PEDRO: MemberProfile = {
  username: 'Pedro',
  displayName: 'Pedro',
  role: 'member',
  awardFocus: 'Controle',
  coreMission: 'Desenvolver soluções de software confiáveis e integradas para o robô da Bazinga!',
  seasonGoal: 'Criar uma arquitetura de código modular, testável e bem documentada para o robô',
  shortTermGoal: 'Configurar o ambiente de desenvolvimento e implementar as primeiras rotinas de sensor',
};

const YAN: MemberProfile = {
  username: 'Yan',
  displayName: 'Yan',
  role: 'member',
  awardFocus: 'Inovacao',
  coreMission: 'Projetar soluções mecânicas criativas e funcionais que destaquem o robô da Bazinga!',
  seasonGoal: 'Entregar um robô com design inovador, robusto e que atenda à estratégia de jogo da temporada',
  shortTermGoal: 'Finalizar o primeiro protótipo do mecanismo de intake em CAD e iniciar a fabricação',
};

const GUILHERME: MemberProfile = {
  username: 'Guilherme',
  displayName: 'Guilherme',
  role: 'member',
  awardFocus: 'Design',
  coreMission: 'Inovar na arquitetura mecânica do robô com foco em eficiência e modularidade',
  seasonGoal: 'Desenvolver subsistemas mecânicos que permitam manutenção rápida e adaptação durante torneios',
  shortTermGoal: 'Projetar e iterar sobre o sistema de elevação com pelo menos 2 variações no CAD',
};

const ENZO_RESENDE: MemberProfile = {
  username: 'Enzo Resende',
  displayName: 'Enzo Resende',
  role: 'member',
  awardFocus: 'Design',
  coreMission: 'Contribuir com soluções mecânicas criativas e robustas para os desafios de jogo da temporada',
  seasonGoal: 'Participar ativamente do design de pelo menos 2 subsistemas do robô com protótipos testados',
  shortTermGoal: 'Aprender os fundamentos de CAD/Onshape e projetar o primeiro componente do robô',
};

const SARA: MemberProfile = {
  username: 'Sara Galdino',
  displayName: 'Sara',
  role: 'member',
  awardFocus: 'Conexao',
  coreMission: 'Ampliar a rede de mentoria e parcerias estratégicas da equipe com profissionais do setor',
  seasonGoal: 'Conectar a equipe com novos mentores técnicos e patrocinadores para fortalecer a jornada B-LEED',
  shortTermGoal: 'Organizar o cronograma de visitas técnicas e reuniões com potenciais parceiros',
};

const INITIAL_MEMBERS: MemberProfile[] = [
  JONAS, RAMON,
  LUCCA, CLARICE, ANA_CLARA, BERNARDO,
  ENZO_SOARES, PEDRO, YAN, GUILHERME, ENZO_RESENDE,
  SARA,
];

INITIAL_MEMBERS.forEach(m => {
  if (m.active === undefined) m.active = true;
});

// --- Exports ---
export const ALL_MEMBERS: MemberProfile[] = [...INITIAL_MEMBERS];

export const TECHNICIAN_USERNAMES: string[] = ALL_MEMBERS
  .filter(m => m.role === 'technician')
  .map(m => m.username);

export const MEMBER_USERNAMES: string[] = ALL_MEMBERS
  .filter(m => m.role === 'member' && m.active !== false)
  .map(m => m.username);

export const ALL_USERNAMES: string[] = ALL_MEMBERS.map(m => m.username);

export const getMemberByUsername = (username: string): MemberProfile | undefined =>
  ALL_MEMBERS.find(m => m.username === username);

export function updateMembersList(newMembers: MemberProfile[]) {
  ALL_MEMBERS.length = 0;
  TECHNICIAN_USERNAMES.length = 0;
  MEMBER_USERNAMES.length = 0;
  ALL_USERNAMES.length = 0;

  ALL_MEMBERS.push(...newMembers);
  
  const techUsernames = ALL_MEMBERS
    .filter(m => m.role === 'technician')
    .map(m => m.username);
  TECHNICIAN_USERNAMES.push(...techUsernames);

  const memberUsernames = ALL_MEMBERS
    .filter(m => m.role === 'member' && m.active !== false)
    .map(m => m.username);
  MEMBER_USERNAMES.push(...memberUsernames);

  const allUsernames = ALL_MEMBERS.map(m => m.username);
  ALL_USERNAMES.push(...allUsernames);
}

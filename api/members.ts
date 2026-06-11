import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';

// Default initial list in case Redis is empty
const INITIAL_MEMBERS = [
  {
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
    active: true
  },
  {
    username: 'Ramon',
    displayName: 'Ramon',
    role: 'technician',
    awardFocus: null,
    coreMission: 'Orientar a excelência técnica e estratégica da equipe, focando na evolução constante dos membros.',
    seasonGoal: 'Garantir que a equipe atinja seu potencial máximo técnico e organizacional nesta temporada.',
    shortTermGoal: 'Avaliar o status atual dos projetos e definir as prioridades para o próximo ciclo de desenvolvimento.',
    active: true
  },
  {
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
    active: true
  },
  {
    username: 'Clarice',
    displayName: 'Clarice',
    role: 'member',
    awardFocus: 'PensamentoCriativo',
    coreMission: 'Documentar e comunicar o processo de engenharia da Bazinga! com clareza e qualidade técnica (AE)',
    seasonGoal: 'Produzir um Engineering Portfolio completo que demonstre o pensamento criativo da equipe',
    shortTermGoal: 'Organizar o estrutura base do portfólio e registrar os 3 primeiros ciclos de engenharia',
    active: true
  },
  {
    username: 'Ana Clara',
    displayName: 'Ana Clara',
    role: 'member',
    awardFocus: 'PensamentoCriativo',
    coreMission: 'Documentar inovações e soluções técnicas do robô com foco em análise crítica e melhoria contínua (MCI)',
    seasonGoal: 'Criar documentação técnica detalhada de cada subsistema do robô com trade-offs e lições aprendidas',
    shortTermGoal: 'Documentar o processo de design do chassi e sistema de intake com fotos e análise',
    active: true
  },
  {
    username: 'Bernardo',
    displayName: 'Bernardo',
    role: 'member',
    awardFocus: 'Conexao',
    coreMission: 'Fortalecer as conexões da Bazinga! com empresas, universidades e mentores da comunidade FIRST',
    seasonGoal: 'Estabelecer pelo menos 3 parcerias ativas e um plano de networking documentado',
    shortTermGoal: 'Mapear potenciais parceiros na região e preparar material de apresentação da equipe',
    active: true
  },
  {
    username: 'Enzo Soares',
    displayName: 'Enzo Soares',
    role: 'member',
    awardFocus: 'Controle',
    coreMission: 'Garantir a confiabilidade e performance do software e hardware de controle do robô',
    seasonGoal: 'Desenvolver um sistema autônomo robusto e um TeleOp eficiente para a competição',
    shortTermGoal: 'Implementar e testar o controle básico de drive com odometria funcional',
    active: true
  },
  {
    username: 'Pedro',
    displayName: 'Pedro',
    role: 'member',
    awardFocus: 'Controle',
    coreMission: 'Desenvolver soluções de software confiáveis e integradas para o robô da Bazinga!',
    seasonGoal: 'Criar uma arquitetura de código modular, testável e bem documentada para o robô',
    shortTermGoal: 'Configurar o ambiente de desenvolvimento e implementar as primeiras rotinas de sensor',
    active: true
  },
  {
    username: 'Yan',
    displayName: 'Yan',
    role: 'member',
    awardFocus: 'Inovacao',
    coreMission: 'Projetar soluções mecânicas criativas e funcionais que destaquem o robô da Bazinga!',
    seasonGoal: 'Entregar um robô com design inovador, robusto e que atenda à estratégia de jogo da temporada',
    shortTermGoal: 'Finalizar o primeiro protótipo do mecanismo de intake em CAD e iniciar a fabricação',
    active: true
  },
  {
    username: 'Guilherme',
    displayName: 'Guilherme',
    role: 'member',
    awardFocus: 'Design',
    coreMission: 'Inovar na arquitetura mecânica do robô com foco em eficiência e modularidade',
    seasonGoal: 'Desenvolver subsistemas mecânicos que permitam manutenção rápida e adaptação durante torneios',
    shortTermGoal: 'Projetar e iterar sobre o sistema de elevação com pelo menos 2 variações no CAD',
    active: true
  },
  {
    username: 'Enzo Resende',
    displayName: 'Enzo Resende',
    role: 'member',
    awardFocus: 'Design',
    coreMission: 'Contribuir com soluções mecânicas criativas e robustas para os desafios de jogo da temporada',
    seasonGoal: 'Participar ativamente do design de pelo menos 2 subsistemas do robô com protótipos testados',
    shortTermGoal: 'Aprender os fundamentos de CAD/Onshape e projetar o primeiro componente do robô',
    active: true
  },
  {
    username: 'Sara Galdino',
    displayName: 'Sara',
    role: 'member',
    awardFocus: 'Conexao',
    coreMission: 'Ampliar a rede de mentoria e parcerias estratégicas da equipe com profissionais do setor',
    seasonGoal: 'Conectar a equipe com novos mentores técnicos e patrocinadores para fortalecer a jornada B-LEED',
    shortTermGoal: 'Organizar o cronograma de visitas técnicas e reuniões com potenciais parceiros',
    active: true
  }
];

const REDIS_KEY = 'levelup_team_members_v2';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;

  if (method === 'GET') {
    try {
      const rawData = await redis.get(REDIS_KEY);
      let members = rawData ? JSON.parse(rawData) : null;
      
      if (!members) {
        members = INITIAL_MEMBERS;
        await redis.set(REDIS_KEY, JSON.stringify(members));
      }

      return res.status(200).json({ success: true, members });
    } catch (error: any) {
      console.error('Error fetching members list:', error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  if (method === 'POST') {
    const { action, member, username } = req.body;
    
    // Auth check - Jonas and Ramon are technicians
    const TECHNICIANS = ['Jonas', 'Ramon'];
    if (!username || !TECHNICIANS.includes(username)) {
      return res.status(403).json({ error: 'Apenas técnicos podem gerenciar membros.' });
    }

    try {
      const rawData = await redis.get(REDIS_KEY);
      let members = rawData ? JSON.parse(rawData) : INITIAL_MEMBERS;

      if (action === 'add') {
        const existingIdx = members.findIndex((m: any) => m.username.toLowerCase() === member.username.toLowerCase());
        if (existingIdx !== -1) {
          // If it was inactive, we reactivate it and overwrite details
          members[existingIdx] = { ...member, active: true };
        } else {
          members.push({ ...member, active: true });
        }
        
        // Also initialize their persistence save data in Redis if not already initialized
        const userKey = `levelup_user_${member.username}`;
        const userExists = await redis.get(userKey);
        if (!userExists) {
          // We can generate and save default initial data for this user
          // Using a simple template matching the initialData generator:
          const defaultUserData = {
            user: {
              name: member.displayName,
              fullName: member.fullName || member.displayName,
              role: member.role,
              grade: member.grade || '',
              entryDate: member.entryDate || new Date().toLocaleDateString('pt-BR'),
              birthDate: member.birthDate || '',
              bio: member.bio || '',
              awardFocus: member.awardFocus,
              rank: 'e_rank',
              level_overall: 1,
              xp_total: 0,
              xpToNextLevel: 130,
              stats: {
                Programming: 1,
                Engineering: 1,
                TechnicalWriting: 1,
                Networking: 1,
                Planning: 1,
                Oratory: 1,
                Creativity: 1,
                FirstCulture: 1,
              },
              wallet: { credits: 100, gems: 5 },
              skill_tree: {},
              knowledgeBase: {},
              streaks: { daily_streak: 0, lastQuestCompletionDate: null },
              activeArc: null,
              inventory: [],
              activeBuffs: [],
              questsCompleted: 0,
              bossQuestsCompleted: 0,
              unlockedBadges: [],
              staked_credits: 0,
              stakedBuffs: {},
              lastWeeklyBossDate: null,
              completedMajorGoals: [],
              activeTimedQuest: null,
              initialLevelsSet: false,
              state: {
                coreMission: member.coreMission || '',
                longTermGoals: member.seasonGoal || '',
                shortTermGoals: member.shortTermGoal || '',
                emergencyGoals: '',
                sideQuests: '',
              }
            },
            quests: [],
            majorGoals: [],
            storyLog: [
              {
                id: 'log_init',
                date: 'Semana 1',
                title: 'Início da Jornada',
                narrative: `${member.displayName} iniciou sua jornada na Bazinga! 73. É hora de construir, aprender e evoluir.`
              }
            ],
            journalEntries: [],
            weeklyProgress: [
              { day: 'Seg', xp: 0 }, { day: 'Ter', xp: 0 }, { day: 'Qua', xp: 0 },
              { day: 'Qui', xp: 0 }, { day: 'Sex', xp: 0 }, { day: 'Sáb', xp: 0 }, { day: 'Dom', xp: 0 }
            ],
            activityLog: [],
            systemMessages: [],
            integrations: [],
            chatHistory: []
          };
          await redis.set(userKey, JSON.stringify(defaultUserData));
        } else {
          // If user key exists, update their profile metadata
          const existingData = JSON.parse(userExists);
          if (existingData.user) {
            existingData.user.name = member.displayName;
            existingData.user.fullName = member.fullName || member.displayName;
            existingData.user.grade = member.grade || '';
            existingData.user.bio = member.bio || '';
            existingData.user.awardFocus = member.awardFocus;
            await redis.set(userKey, JSON.stringify(existingData));
          }
        }
      } else if (action === 'edit') {
        const idx = members.findIndex((m: any) => m.username === member.username);
        if (idx !== -1) {
          members[idx] = { ...members[idx], ...member };
          
          // Also update metadata in their user save data
          const userKey = `levelup_user_${member.username}`;
          const userExists = await redis.get(userKey);
          if (userExists) {
            const existingData = JSON.parse(userExists);
            if (existingData.user) {
              existingData.user.name = member.displayName;
              existingData.user.fullName = member.fullName || member.displayName;
              existingData.user.grade = member.grade || '';
              existingData.user.bio = member.bio || '';
              existingData.user.awardFocus = member.awardFocus;
              await redis.set(userKey, JSON.stringify(existingData));
            }
          }
        }
      } else if (action === 'remove') {
        const idx = members.findIndex((m: any) => m.username === member.username);
        if (idx !== -1) {
          // Inactivate the member (active = false) instead of deleting
          members[idx].active = false;
        }
      }

      await redis.set(REDIS_KEY, JSON.stringify(members));
      return res.status(200).json({ success: true, members });
    } catch (error: any) {
      console.error('Error updating members list:', error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';
import { GoogleGenAI } from '@google/genai';

const TECHNICIANS = ['Jonas', 'Gustavo'];
const ALL_MEMBERS = [
  'Jonas', 'Gustavo', 'Lucca', 'Clarice', 'Ana Clara', 'Bernardo', 
  'Ana Luisa', 'Enzo Soares', 'Pedro', 'Yan', 'Guilherme', 'Enzo Resende'
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, scope } = req.body;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required.' });
  }

  if (scope === 'team' && !TECHNICIANS.includes(username)) {
    return res.status(403).json({ error: 'Apenas técnicos podem gerar a jornada da equipe.' });
  }

  try {
    let contextData: any = {};
    const aiLog = [];

    if (scope === 'team') {
      const membersData = [];
      for (const member of ALL_MEMBERS) {
        if (TECHNICIANS.includes(member)) continue; // skip technicians in team review
        const rawData = await redis.get(`levelup_user_${member}`);
        if (rawData) {
          try {
            const userData = JSON.parse(rawData);
            if (userData.user) {
              membersData.push({
                member: member,
                awardFocus: userData.user.awardFocus || 'N/A',
                level: userData.user.level_overall || 1,
                rank: userData.user.rank || 'E-Rank',
                xpTotal: userData.user.xp_total || 0,
                skillsActive: Object.values(userData.user.skill_tree || {})
                                    .filter((s: any) => s.isActive)
                                    .map((s: any) => ({ name: s.name, level: s.level })),
                questsCompleted: userData.user.questsCompleted || 0,
                storyLog: userData.storyLog || [],
                activities: (userData.activityLog || []).length
              });
            }
          } catch(e) {}
        }
      }
      contextData = { team_journey: membersData, team_name: "Bazinga! 73" };
    } else {
      const rawData = await redis.get(`levelup_user_${username}`);
      if (!rawData) {
         return res.status(404).json({ error: 'Dados do usuário não encontrados.' });
      }
      const userData = JSON.parse(rawData);
      contextData = {
        member: username,
        profile: {
          awardFocus: userData.user?.awardFocus || 'N/A',
          level: userData.user?.level_overall || 1,
          rank: userData.user?.rank || 'E-Rank',
          xpTotal: userData.user?.xp_total || 0,
          coreMission: userData.user?.state?.coreMission || '',
          longTermGoals: userData.user?.state?.longTermGoals || '',
          streaks: userData.user?.streaks?.daily_streak || 0,
          questsCompleted: userData.user?.questsCompleted || 0,
        },
        skills: Object.values(userData.user?.skill_tree || {})
                  .map((s: any) => ({ name: s.name, level: s.level, realm: s.realm })),
        quests_history: (userData.quests || []).filter((q: any) => q.status === 'completed').map((q: any) => ({ title: q.title, realm: q.realm })),
        story_log: userData.storyLog || [],
        activity_log: userData.activityLog || []
      };
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("No GEMINI_API_KEY found, returning raw JSON instead");
      const fakeMarkdown = `# Relatório Não Processado
A chave de API GEMINI_API_KEY não foi configurada no servidor. 
Segue os dados puros para processamento manual por outra IA:

\`\`\`json
${JSON.stringify(contextData, null, 2)}
\`\`\`
`;
      return res.status(200).send(fakeMarkdown);
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Strict Anti-Hallucination Prompt
    const prompt = `Você é o Historiador Digital da Equipe Bazinga! 73 (FIRST Tech Challenge).
Sua missão é gerar um relatório de desenvolvimento (.md) estritamente factual com base nos dados JSON fornecidos.

ESTRUTURA DO RELATÓRIO:
1. Cabeçalho com Nome do Membro/Equipe e Rank Atual.
2. Sumário de Especialização: Destaque os reinos predominantes (Escrita Técnica, Networking, Oratória, Planejamento, Criatividade, Programação, Engenharia, Cultura FIRST).
3. Cronologia de Conquistas: Liste as missões e metas concluídas em ordem cronológica reversa, usando os dados do "story_log" e "quests_history".
4. Métricas de Desempenho: Nível, XP Total e Streaks.

REGRAS CRÍTICAS DE ANTI-ALUCINAÇÃO:
1. PROIBIDO inventar qualquer fato, data, nome de missão ou detalhe técnico que não esteja no JSON.
2. Seja pragmático e profissional. Use um tom de "Portfólio de Engenharia".
3. Se o JSON estiver incompleto para um membro, reporte apenas o que existe. NUNCA use dados de exemplo.
4. O arquivo deve estar pronto para ser importado em ferramentas de visualização de dados.

DADOS JSON DE ENTRADA:
${JSON.stringify(contextData)}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.0,
      }
    });

    const markdownText = response.text || '';
    
    // Remove markdown codeblock wrappers if Gemini added them
    let cleanMarkdown = markdownText;
    if (cleanMarkdown.startsWith('\`\`\`markdown')) {
      cleanMarkdown = cleanMarkdown.replace(/^\`\`\`markdown/, '').replace(/\`\`\`$/, '');
    } else if (cleanMarkdown.startsWith('\`\`\`')) {
      cleanMarkdown = cleanMarkdown.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '');
    }

    // Return plain text standard Markdown
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    return res.status(200).send(cleanMarkdown.trim());

  } catch (error: any) {
    console.error('Error generating journey:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

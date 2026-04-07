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
    const prompt = `Você é um gerador de relatórios técnicos de uma equipe de robótica da FIRST Tech Challenge (FTC).
Sua tarefa é gerar um documento Markdown (.md) detalhando a Jornada de Desenvolvimento com base EXCLUSIVAMENTE nos dados em formato JSON providos abaixo.

REGRAS CRÍTICAS DE ANTI-ALUCINAÇÃO:
1. NUNCA, JAMAIS invente qualquer nome de missão, história, detalhe de projeto, data ou habilidade.
2. NUNCA faça conexões emocionais ou narrativas criativas não presentes explicitamente nos dados JSON. Formato formal e pragmático.
3. Se algo estiver em branco ou vazio no JSON, NÃO mencione a categoria ou declare como "sem dados". NUNCA preencha lacunas com exemplos.
4. Para o formato Equipe, sumarize os avanços. Para Individual, crie um portfólio.
5. Retorne APENAS o código Markdown do documento. Não adicione textos explicativos no início ou no fim como "Aqui está o relatório".

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

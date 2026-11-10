import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';
import { GoogleGenAI } from '@google/genai';

const TECHNICIANS = ['Jonas', 'Ramon'];
const DEFAULT_MEMBERS = [
  'Jonas', 'Ramon', 'Lucca', 'Clarice', 'Ana Clara', 'Bernardo',
  'Enzo Soares', 'Pedro', 'Yan', 'Guilherme', 'Enzo Resende', 'Sara Galdino', 'Moisés'
];

const REALM_LABELS: Record<string, string> = {
  Engineering: 'Engenharia & Mecânica',
  Programming: 'Programação & Controle',
  TechnicalWriting: 'Escrita Técnica & Caderno de Engenharia',
  FirstCulture: 'Cultura FIRST & Gracious Professionalism',
  Planning: 'Planejamento & Gestão',
  Creativity: 'Criatividade & Design',
  Oratory: 'Oratória & Apresentação',
  Networking: 'Networking & Parcerias Estratégicas',
};

async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await redis.get(key);
    if (!raw) return fallback;
    return typeof raw === 'string' ? JSON.parse(raw) : (raw as T);
  } catch (err) {
    console.warn(`[generate-journey] Error parsing key "${key}":`, err);
    return fallback;
  }
}

function formatHours(h: number | string | undefined): string {
  const num = typeof h === 'number' ? h : parseFloat(String(h || 0));
  if (isNaN(num)) return '0.0h';
  return `${num.toFixed(1)}h`;
}

// ─── GERAÇÃO DETERMINÍSTICA DO RELATÓRIO INDIVIDUAL ───────────────────────────
function generateIndividualMarkdown(data: {
  username: string;
  fullName: string;
  role: string;
  grade: string;
  entryDate: string;
  awardFocus: string;
  level: number;
  rank: string;
  xpTotal: number;
  streaks: number;
  coreMission?: string;
  longTermGoals?: string;
  stats: Record<string, number>;
  skills: Array<{ name: string; level: number; realm: string; isActive: boolean }>;
  knowledgeTopics: Array<{ name: string; difficulty: string }>;
  autonForms: any[];
  coletForms: any[];
  mentRecords: any[];
  volunteerWorks: any[];
  teamMissions: any[];
  kanbanTasks: any[];
  bProjects: any[];
  storyLog: any[];
  badges: any[];
  majorGoals: any[];
  aiAnalysis?: string;
}): string {
  const hAuton = data.autonForms.reduce((acc, f) => acc + (parseFloat(f.workloadHours) || 0), 0);
  const hColet = data.coletForms.reduce((acc, f) => acc + (parseFloat(f.workloadHours) || 0), 0);
  const hMent = data.mentRecords.reduce((acc, m) => acc + (parseFloat(m.workloadHours) || 0), 0);
  const hTotal = hAuton + hColet + hMent;

  const lines: string[] = [];

  // Cabeçalho
  lines.push(`# Jornada de Desenvolvimento B-LEED — ${data.fullName || data.username}`);
  lines.push(`**Equipe:** Bazinga! 73 (#21083) | FIRST Tech Challenge`);
  lines.push(`**Metodologia Oficial:** B-LEED (Liderança, Educação, Evolução e Desenvolvimento)`);
  lines.push(`**Temporada:** 2026/2027 — Biobuzz | **Emissão:** ${new Date().toLocaleDateString('pt-BR')}\n`);
  lines.push(`---`);

  // Análise da IA se disponível
  if (data.aiAnalysis) {
    lines.push(`## 🧠 Parecer Analítico do Historiador Digital`);
    lines.push(data.aiAnalysis.trim());
    lines.push(`\n---\n`);
  }

  // 1. Identificação
  lines.push(`## 1. Identificação do Membro & Foco na FIRST`);
  lines.push(`- **Nome Completo:** ${data.fullName || data.username} (@${data.username})`);
  lines.push(`- **Papel na Equipe:** ${data.role}`);
  lines.push(`- **Escolaridade:** ${data.grade || 'Não informada'}`);
  lines.push(`- **Data de Ingresso:** ${data.entryDate || '2026'}`);
  lines.push(`- **Foco de Prêmio FIRST:** ${data.awardFocus}`);
  lines.push(`- **Nível Geral:** Nível ${data.level} | **Rank:** ${data.rank.toUpperCase()} | **XP Total:** ${data.xpTotal} XP`);
  lines.push(`- **Sequência de Atividade (Streaks):** ${data.streaks} dias consecutivos`);
  if (data.coreMission) {
    lines.push(`- **Missão Principal (Core Mission):**\n  > *"${data.coreMission}"*`);
  }
  if (data.longTermGoals) {
    lines.push(`- **Objetivos de Longo Prazo:**\n  > *"${data.longTermGoals}"*`);
  }
  lines.push(``);

  // 2. Resumo da Carga Horária B-LEED
  lines.push(`## 2. Quadro Resumo da Carga Horária B-LEED`);
  lines.push(`A Metodologia B-LEED estrutura a evolução contínua dos membros através de 3 pilares práticos e auditáveis:`);
  lines.push(``);
  lines.push(`| Pilar Metodológico B-LEED | Quantidade de Registros | Carga Horária Dedicada | Status de Validação |`);
  lines.push(`|---|:---:|:---:|:---:|`);
  lines.push(`| **Pilar 1: Desenvolvimento Autônomo** | ${data.autonForms.length} cursos / estudos | ${formatHours(hAuton)} | Validado por Técnicos |`);
  lines.push(`| **Pilar 2: Mentorias Estratégicas** | ${data.mentRecords.length} sessões técnicas | ${formatHours(hMent)} | Validado com Especialistas |`);
  lines.push(`| **Pilar 3: Evolução Coletiva** | ${data.coletForms.length} encontros inter-equipes | ${formatHours(hColet)} | Intercâmbio FIRST |`);
  lines.push(`| **TOTAL CONSOLIDADO B-LEED** | **${data.autonForms.length + data.mentRecords.length + data.coletForms.length} atividades** | **${formatHours(hTotal)}** | **Concluído e Registrado** |`);
  lines.push(``);

  // 3. Pilar 1: Desenvolvimento Autônomo
  lines.push(`## 3. Pilar 1: Desenvolvimento Autônomo`);
  lines.push(`*O membro assume a liderança do seu aprendizado através de estudos direcionados, cursos livres, leitura de documentações e certificações técnicas.*`);
  lines.push(``);
  if (data.autonForms.length === 0) {
    lines.push(`*Nenhum curso ou estudo autônomo registrado no banco de dados até o momento.*`);
  } else {
    data.autonForms.forEach((f, idx) => {
      lines.push(`### 📘 ${idx + 1}. ${f.courseName || 'Estudo Autônomo'}`);
      lines.push(`- **Data:** ${f.date || 'N/A'} | **Carga Horária:** ${formatHours(f.workloadHours)}`);
      if (f.courseUrl) lines.push(`- **Link do Curso / Plataforma:** [Acessar Link](${f.courseUrl})`);
      if (f.certificateUrl) lines.push(`- **Comprovante / Certificado:** [Visualizar Certificado](${f.certificateUrl})`);
      if (f.courseObjectives) {
        lines.push(`- **Objetivos de Aprendizagem:**\n  > ${f.courseObjectives.trim()}`);
      }
      if (f.courseSyllabus) {
        lines.push(`- **Ementa e Conteúdo Programático:**\n  > ${f.courseSyllabus.trim().replace(/\n/g, '\n  > ')}`);
      }
      if (f.keyLearnings) {
        lines.push(`- **Principais Aprendizados e Aplicações Práticas:**\n  > ${f.keyLearnings.trim().replace(/\n/g, '\n  > ')}`);
      }
      const evalItem = f.evaluation?.memberScores?.[data.username];
      if (evalItem) {
        lines.push(`- **Avaliação do Treinador:** Avaliado por **${f.evaluation.evaluatedBy || 'Técnico'}** com **+${evalItem.totalXp || 0} XP**`);
        if (evalItem.feedback) lines.push(`  - *Feedback:* "${evalItem.feedback}"`);
        if (evalItem.realmScores && Object.keys(evalItem.realmScores).length > 0) {
          const scoresStr = Object.entries(evalItem.realmScores).map(([k, v]) => `${REALM_LABELS[k] || k}: +${v}XP`).join(', ');
          lines.push(`  - *Distribuição:* ${scoresStr}`);
        }
      }
      lines.push(``);
    });
  }

  // 4. Pilar 2: Mentorias Estratégicas
  lines.push(`## 4. Pilar 2: Mentorias Estratégicas`);
  lines.push(`*Troca direta de conhecimento com engenheiros, acadêmicos, ex-membros e profissionais do mercado para acelerar o aprendizado e solucionar problemas críticos.*`);
  lines.push(``);
  if (data.mentRecords.length === 0) {
    lines.push(`*Nenhuma mentoria estratégica registrada até o momento.*`);
  } else {
    data.mentRecords.forEach((m, idx) => {
      lines.push(`### 🤝 ${idx + 1}. Mentoria com ${m.mentorName || 'Especialista Convidado'}`);
      lines.push(`- **Data:** ${m.date || 'N/A'} | **Área:** ${m.area || 'Mentoria B-LEED'} | **Carga Horária:** ${formatHours(m.workloadHours)}`);
      if (m.objectives) {
        lines.push(`- **Objetivos da Mentoria:**\n  > ${m.objectives.trim()}`);
      }
      if (m.solutions) {
        lines.push(`- **Soluções Técnicas & Decisões Tomadas:**\n  > ${m.solutions.trim().replace(/\n/g, '\n  > ')}`);
      }
      if (m.nextSteps) {
        lines.push(`- **Próximos Passos & Aplicação na Equipe:**\n  > ${m.nextSteps.trim().replace(/\n/g, '\n  > ')}`);
      }
      lines.push(``);
    });
  }

  // 5. Pilar 3: Evolução Coletiva
  lines.push(`## 5. Pilar 3: Evolução Coletiva`);
  lines.push(`*Vivência do Gracious Professionalism e Coopertition através de reuniões técnicas, estudos conjuntos e alianças com outras equipes da comunidade FIRST.*`);
  lines.push(``);
  if (data.coletForms.length === 0) {
    lines.push(`*Nenhum encontro de evolução coletiva registrado até o momento.*`);
  } else {
    data.coletForms.forEach((c, idx) => {
      lines.push(`### 🌐 ${idx + 1}. Intercâmbio Técnico com a Equipe ${c.invitedTeam || 'Parceira'}`);
      lines.push(`- **Data:** ${c.date || 'N/A'} | **Carga Horária:** ${formatHours(c.workloadHours)}`);
      if (c.meetingObjectives) {
        lines.push(`- **Objetivos da Sessão Inter-Equipes:**\n  > ${c.meetingObjectives.trim()}`);
      }
      if (c.solutionsFound) {
        lines.push(`- **Aprendizados Compartilhados & Soluções Conjuntas:**\n  > ${c.solutionsFound.trim().replace(/\n/g, '\n  > ')}`);
      }
      if (c.nextSteps) {
        lines.push(`- **Desdobramentos & Próximos Passos:**\n  > ${c.nextSteps.trim().replace(/\n/g, '\n  > ')}`);
      }
      const evalItem = c.evaluation?.memberScores?.[data.username];
      if (evalItem) {
        lines.push(`- **Avaliação Técnica:** Avaliado por **${c.evaluation.evaluatedBy || 'Técnico'}** com **+${evalItem.totalXp || 0} XP**`);
      }
      lines.push(``);
    });
  }

  // 6. Projetos de Engenharia & Protótipos (B-Projects)
  lines.push(`## 6. Projetos de Engenharia (B-Projects) & Protótipos`);
  if (data.bProjects.length === 0) {
    lines.push(`*Nenhum projeto de engenharia com cronograma registrado no momento.*`);
  } else {
    data.bProjects.forEach((p) => {
      lines.push(`### ⚙️ ${p.name || 'Projeto de Engenharia'} (Status: ${p.status || 'Ativo'})`);
      if (p.endDate) lines.push(`- **Prazo Previsto:** ${p.endDate}`);
      if (p.schedule && Array.isArray(p.schedule) && p.schedule.length > 0) {
        lines.push(`- **Etapas e Entregáveis do Cronograma:**`);
        p.schedule.forEach((s: any) => {
          const statusIcon = s.completed ? '✅' : '⏳';
          lines.push(`  - ${statusIcon} **${s.stageName || 'Etapa'}**: ${s.deliverables || 'Entregável'} (Responsável: ${(s.responsible || []).join(', ')})`);
        });
      }
      lines.push(``);
    });
  }

  // 7. Missões de Equipe & Kanban
  lines.push(`## 7. Missões de Equipe & Produção no Kanban`);
  const completedMissions = data.teamMissions.filter(m => (m.completedBy || []).includes(data.username));
  lines.push(`### Missões Oficiais de Equipe Concluídas (${completedMissions.length})`);
  if (completedMissions.length === 0) {
    lines.push(`*Nenhuma missão oficial de equipe concluída ainda.*`);
  } else {
    completedMissions.forEach((m) => {
      lines.push(`- [x] **${m.title}** (Nível ${m.missionLevel || 1} • Evidência: ${m.evidenceType || 'Conclusão'}) — ${m.description || ''}`);
    });
  }
  lines.push(``);

  lines.push(`### Entregas Práticas no Kanban da Oficina (${data.kanbanTasks.length} tarefas atribuídas)`);
  const doneTasks = data.kanbanTasks.filter(t => t.status === 'done');
  const inProgTasks = data.kanbanTasks.filter(t => t.status === 'in_progress');
  const todoTasks = data.kanbanTasks.filter(t => t.status === 'todo');

  lines.push(`- **Entregas Concluídas (${doneTasks.length}):**`);
  if (doneTasks.length === 0) lines.push(`  *(Nenhuma tarefa concluída)*`);
  else {
    doneTasks.slice(0, 30).forEach(t => lines.push(`  - [x] **${t.title}**${t.description ? `: ${t.description}` : ''}`));
  }

  if (inProgTasks.length > 0) {
    lines.push(`- **Em Andamento (${inProgTasks.length}):**`);
    inProgTasks.forEach(t => lines.push(`  - [/] **${t.title}**${t.description ? `: ${t.description}` : ''}`));
  }

  if (todoTasks.length > 0) {
    lines.push(`- **Backlog / A Realizar (${todoTasks.length}):**`);
    todoTasks.slice(0, 15).forEach(t => lines.push(`  - [ ] **${t.title}**${t.description ? `: ${t.description}` : ''}`));
  }
  lines.push(``);

  // 8. Competências & Radar de Habilidades
  lines.push(`## 8. Matriz de Competências & Árvore de Habilidades`);
  lines.push(`| Reino FTC | Pontuação de Maestria |`);
  lines.push(`|---|:---:|`);
  Object.entries(data.stats).forEach(([realm, score]) => {
    lines.push(`| **${REALM_LABELS[realm] || realm}** | ${score.toFixed(1)} |`);
  });
  lines.push(``);

  if (data.skills.length > 0) {
    lines.push(`### Habilidades Dominadas na Árvore`);
    data.skills.forEach(s => {
      lines.push(`- **${s.name}** (Nível ${s.level} • ${REALM_LABELS[s.realm] || s.realm})`);
    });
    lines.push(``);
  }

  // 9. Conquistas & Linha do Tempo
  if (data.badges.length > 0) {
    lines.push(`## 9. Conquistas & Insígnias Desbloqueadas`);
    data.badges.forEach(b => {
      lines.push(`- 🏅 **${b.name}**: ${b.description || ''}`);
    });
    lines.push(``);
  }

  if (data.storyLog && data.storyLog.length > 0) {
    lines.push(`## 10. Cronologia de Marcos & Narrativa da Temporada`);
    data.storyLog.slice(0, 15).forEach(log => {
      lines.push(`- **${log.date || 'Semana'}** — **${log.title}**: ${log.narrative || ''}`);
    });
    lines.push(``);
  }

  // 11. Alinhamento com a Metodologia B-LEED e ODS 4
  lines.push(`## 11. Fundamentação Metodológica B-LEED & Alinhamento com a ODS 4`);
  lines.push(`O desenvolvimento de **${data.fullName || data.username}** cumpre os preceitos fundamentais da Metodologia B-LEED:`);
  lines.push(`1. **Autonomia Guiada:** O membro desenvolve pensamento crítico investigativo, buscando ativamente referências teóricas e capacitação técnica.`);
  lines.push(`2. **Intercâmbio e Mentoria:** A conexão com mentores valida as escolhas de engenharia e amplia o repertório de soluções.`);
  lines.push(`3. **Multiplicação Coletiva:** Todo aprendizado adquirido é documentado e compartilhado com os demais integrantes da Bazinga! 73.`);
  lines.push(`4. **ODS 4 (Educação de Qualidade - ONU):** Acesso inclusivo à ciência aplicada, robótica de alto nível e formação cidadã continuada.`);
  lines.push(``);
  lines.push(`---`);
  lines.push(`*Relatório oficial emitido pelo Sistema Operacional BazManager • Equipe Bazinga! 73 • FIRST Tech Challenge.*`);

  return lines.join('\n');
}

// ─── GERAÇÃO DETERMINÍSTICA DO RELATÓRIO DA EQUIPE ────────────────────────────
function generateTeamMarkdown(data: {
  teamName: string;
  membersSummary: any[];
  autonForms: any[];
  coletForms: any[];
  mentRecords: any[];
  volunteerWorks: any[];
  teamMissions: any[];
  kanbanTasks: any[];
  bProjects: any[];
  aiAnalysis?: string;
}): string {
  const totalHAuton = data.autonForms.reduce((acc, f) => acc + (parseFloat(f.workloadHours) || 0), 0);
  const totalHColet = data.coletForms.reduce((acc, f) => acc + (parseFloat(f.workloadHours) || 0), 0);
  const totalHMent = data.mentRecords.reduce((acc, m) => acc + (parseFloat(m.workloadHours) || 0), 0);
  const totalH = totalHAuton + totalHColet + totalHMent;

  const lines: string[] = [];

  // Cabeçalho Geral
  lines.push(`# Relatório Geral da Jornada B-LEED — ${data.teamName}`);
  lines.push(`**FIRST Tech Challenge (#21083) | Temporada Oficial 2026/2027 — Biobuzz**`);
  lines.push(`**Metodologia:** B-LEED (Bazinga – Liderança, Educação, Evolução e Desenvolvimento)`);
  lines.push(`**Data de Consolidação:** ${new Date().toLocaleDateString('pt-BR')}\n`);
  lines.push(`---`);

  // Análise da IA se disponível
  if (data.aiAnalysis) {
    lines.push(`## 🧠 Parecer Analítico Global da Equipe`);
    lines.push(data.aiAnalysis.trim());
    lines.push(`\n---\n`);
  }

  // 1. Painel Executivo
  lines.push(`## 1. Painel Executivo de Indicadores B-LEED`);
  lines.push(`Visão consolidada da aplicação dos três pilares da Metodologia B-LEED na temporada:`);
  lines.push(``);
  lines.push(`| Métrica Estratégica B-LEED | Total Registrado | Carga Horária Acumulada | Indicador de Excelência |`);
  lines.push(`|---|:---:|:---:|:---:|`);
  lines.push(`| **Pilar 1: Desenvolvimento Autônomo** | ${data.autonForms.length} cursos certificados | ${formatHours(totalHAuton)} | Aprendizado Contínuo |`);
  lines.push(`| **Pilar 2: Mentorias Estratégicas** | ${data.mentRecords.length} sessões especializadas | ${formatHours(totalHMent)} | Validação Técnica Profissional |`);
  lines.push(`| **Pilar 3: Evolução Coletiva** | ${data.coletForms.length} conexões com equipes | ${formatHours(totalHColet)} | Gracious Professionalism |`);
  lines.push(`| **TOTAL GERAL B-LEED DA EQUIPE** | **${data.autonForms.length + data.mentRecords.length + data.coletForms.length} atividades auditadas** | **${formatHours(totalH)}** | **Crescimento Consolidado** |`);
  lines.push(``);
  lines.push(`- **Membros Ativos Cadastrados:** ${data.membersSummary.length} integrantes`);
  lines.push(`- **Missões Oficiais de Equipe:** ${data.teamMissions.length} missões homologadas`);
  lines.push(`- **Produção Técnica Prática (Kanban):** ${data.kanbanTasks.length} tarefas gerenciadas`);
  lines.push(`- **Projetos de Engenharia (B-Projects):** ${data.bProjects.length} frentes de projeto ativas`);
  lines.push(``);

  // 2. Quadro Geral de Membros
  lines.push(`## 2. Quadro Geral de Membros e Especializações`);
  lines.push(`| Membro | Cargo / Área | Rank | Nível | XP Total | Foco de Prêmio FIRST | Horas B-LEED |`);
  lines.push(`|---|---|:---:|:---:|:---:|---|:---:|`);
  data.membersSummary.forEach((m) => {
    lines.push(`| **${m.fullName || m.username}** | ${m.role} | ${m.rank.toUpperCase()} | Nív. ${m.level} | ${m.xpTotal} XP | ${m.awardFocus} | ${formatHours(m.bleedHours)} |`);
  });
  lines.push(``);

  // 3. Pilar 1: Inventário de Cursos
  lines.push(`## 3. Pilar 1: Inventário de Cursos e Estudos Autônomos`);
  data.autonForms.forEach((f, idx) => {
    const parts = (f.participants || []).join(', ');
    lines.push(`### 📘 ${idx + 1}. ${f.courseName} (${formatHours(f.workloadHours)})`);
    lines.push(`- **Data:** ${f.date || 'N/A'} | **Participantes:** ${parts || 'Equipe'}`);
    if (f.courseObjectives) lines.push(`- **Objetivos:** ${f.courseObjectives.trim()}`);
    if (f.courseSyllabus) lines.push(`- **Ementa:** ${f.courseSyllabus.trim()}`);
    if (f.keyLearnings) lines.push(`- **Aprendizados Principais:** ${f.keyLearnings.trim()}`);
    lines.push(``);
  });

  // 4. Pilar 2: Inventário de Mentorias
  lines.push(`## 4. Pilar 2: Inventário de Mentorias Estratégicas`);
  data.mentRecords.forEach((m, idx) => {
    const parts = (m.participants || []).join(', ');
    lines.push(`### 🤝 ${idx + 1}. Mentoria com ${m.mentorName} (${formatHours(m.workloadHours)})`);
    lines.push(`- **Data:** ${m.date || 'N/A'} | **Área:** ${m.area || 'Geral'} | **Membros Participantes:** ${parts}`);
    if (m.objectives) lines.push(`- **Objetivos da Orientação:** ${m.objectives.trim()}`);
    if (m.solutions) lines.push(`- **Soluções Técnicas & Decisões:** ${m.solutions.trim()}`);
    if (m.nextSteps) lines.push(`- **Próximos Passos:** ${m.nextSteps.trim()}`);
    lines.push(``);
  });

  // 5. Pilar 3: Conexões e Evolução Coletiva
  lines.push(`## 5. Pilar 3: Conexões da Comunidade FIRST (Evolução Coletiva)`);
  data.coletForms.forEach((c, idx) => {
    const parts = (c.participants || []).join(', ');
    lines.push(`### 🌐 ${idx + 1}. Encontro com a Equipe ${c.invitedTeam} (${formatHours(c.workloadHours)})`);
    lines.push(`- **Data:** ${c.date || 'N/A'} | **Integrantes Bazinga:** ${parts}`);
    if (c.meetingObjectives) lines.push(`- **Objetivos:** ${c.meetingObjectives.trim()}`);
    if (c.solutionsFound) lines.push(`- **Soluções & Conhecimento Compartilhado:** ${c.solutionsFound.trim()}`);
    if (c.nextSteps) lines.push(`- **Próximos Passos:** ${c.nextSteps.trim()}`);
    lines.push(``);
  });

  // 6. Projetos de Engenharia
  lines.push(`## 6. Frentes de Engenharia & Caderno de Projetos (B-Projects)`);
  data.bProjects.forEach((p) => {
    lines.push(`### ⚙️ ${p.name} (Status: ${p.status || 'Ativo'})`);
    if (p.schedule && Array.isArray(p.schedule)) {
      lines.push(`- **Marcos do Cronograma:**`);
      p.schedule.forEach((s: any) => {
        const icon = s.completed ? '✅' : '⏳';
        lines.push(`  - ${icon} **${s.stageName}**: ${s.deliverables} (Responsáveis: ${(s.responsible || []).join(', ')})`);
      });
    }
    lines.push(``);
  });

  // 7. Conclusão Metodológica & ODS 4
  lines.push(`## 7. Conclusão Metodológica & Alinhamento com a ODS 4`);
  lines.push(`A implementação do B-LEED na temporada 2026/2027 consolida a **Bazinga! 73** como uma equipe orientada a processos, dados factuais e autogestão de alta performance:`);
  lines.push(`- **Portfólio Vivo:** Todo avanço é sustentado por comprovações práticas, relatórios de mentoria e registros de código/CAD.`);
  lines.push(`- **Democratização do Conhecimento:** Cada veterano atua como mentor interno, assegurando que o conhecimento técnico permaneça na instituição.`);
  lines.push(`- **Compromisso Social e Educacional:** Alinhado à Meta 4 da ONU (Educação de Qualidade), formando não apenas competidores, mas líderes transformadores.`);
  lines.push(``);
  lines.push(`---`);
  lines.push(`*Relatório Executivo Geral • Metodologia B-LEED • Bazinga! 73 • FIRST Tech Challenge.*`);

  return lines.join('\n');
}

// ─── HANDLER PRINCIPAL ───────────────────────────────────────────────────────
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
    // 1. Carregar bases globais de dados B-LEED
    const [
      allForms,
      allMentorships,
      allVolunteerWorks,
      allTeamMissions,
      allKanbanTasks,
      allBProjects,
      membersRegistry,
    ] = await Promise.all([
      loadJson<any[]>('levelup_forms_records', []),
      loadJson<any[]>('levelup_mentorship_records', []),
      loadJson<any[]>('levelup_volunteer_works', []),
      loadJson<any[]>('levelup_team_missions', []),
      loadJson<any[]>('levelup_kanban_tasks', []),
      loadJson<any[]>('levelup_b_projects', []),
      loadJson<any[]>('levelup_members_registry', []),
    ]);

    // ─── SCOPE: EQUIPE ──────────────────────────────────────────────────────
    if (scope === 'team') {
      // Coletar todos os membros cadastrados
      const memberUsernames = new Set<string>();
      membersRegistry.forEach((m: any) => { if (m.username) memberUsernames.add(m.username); });
      TECHNICIANS.forEach(t => memberUsernames.add(t));
      DEFAULT_MEMBERS.forEach(m => memberUsernames.add(m));

      const membersSummary: any[] = [];

      for (const mName of Array.from(memberUsernames)) {
        const rawUser = await loadJson<any>(`levelup_user_${mName}`, null);
        const u = rawUser?.user || {};
        const regEntry = membersRegistry.find((r: any) => r.username === mName) || {};

        const mAuton = allForms.filter(f => f.type === 'autonomous_dev' && (f.participants || []).includes(mName));
        const mColet = allForms.filter(f => f.type === 'collective_evolution' && (f.participants || []).includes(mName));
        const mMent = allMentorships.filter(m => (m.participants || []).includes(mName));
        const bleedHours = mAuton.reduce((a, b) => a + (parseFloat(b.workloadHours) || 0), 0) +
                           mColet.reduce((a, b) => a + (parseFloat(b.workloadHours) || 0), 0) +
                           mMent.reduce((a, b) => a + (parseFloat(b.workloadHours) || 0), 0);

        membersSummary.push({
          username: mName,
          fullName: u.fullName || mName,
          role: u.role || regEntry.role || (TECHNICIANS.includes(mName) ? 'Técnico' : 'Membro'),
          rank: u.rank || 'E-Rank',
          level: u.level_overall || 1,
          xpTotal: u.xp_total || 0,
          awardFocus: u.awardFocus || regEntry.awardFocus || 'Multifoco',
          bleedHours,
        });
      }

      // Ordenar membros por horas B-LEED e nível
      membersSummary.sort((a, b) => b.bleedHours - a.bleedHours || b.level - a.level);

      let aiAnalysis = '';
      if (process.env.GEMINI_API_KEY) {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const prompt = `Você é o Historiador Digital e Mentor Estratégico da Equipe Bazinga! 73 (FIRST Tech Challenge #21083).
Analise os seguintes dados consolidados da Metodologia B-LEED da equipe:
- Total de Cursos de Desenvolvimento Autônomo: ${allForms.filter(f => f.type === 'autonomous_dev').length}
- Total de Mentorias Estratégicas com Especialistas: ${allMentorships.length}
- Total de Encontros de Evolução Coletiva com outras equipes: ${allForms.filter(f => f.type === 'collective_evolution').length}
- Total de Membros: ${membersSummary.length}
- Destaques de Horas B-LEED: ${membersSummary.slice(0, 5).map(m => `${m.fullName} (${m.bleedHours.toFixed(1)}h)`).join(', ')}

Escreva uma síntese executiva analítica (3 a 4 parágrafos objetivos e profissionais) para o Caderno de Engenharia da equipe, destacando:
1. O impacto dos três pilares na maturidade técnica da temporada 2026/2027 (Biobuzz).
2. A integração entre veteranos, técnicos e novos membros.
3. Como os dados comprovam a adesão aos valores FIRST (Gracious Professionalism, Coopertition) e à ODS 4 da ONU.
NÃO use cabeçalhos repetidos nem tabelas, apenas parágrafos analíticos de alto nível prontos para compor o documento.`;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.2 },
          });
          aiAnalysis = response.text || '';
        } catch (err: any) {
          console.warn('[generate-journey] Gemini AI enrichment failed for team:', err.message);
        }
      }

      const teamMarkdown = generateTeamMarkdown({
        teamName: 'Bazinga! 73',
        membersSummary,
        autonForms: allForms.filter(f => f.type === 'autonomous_dev'),
        coletForms: allForms.filter(f => f.type === 'collective_evolution'),
        mentRecords: allMentorships,
        volunteerWorks: allVolunteerWorks,
        teamMissions: allTeamMissions,
        kanbanTasks: allKanbanTasks,
        bProjects: allBProjects,
        aiAnalysis,
      });

      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      return res.status(200).send(teamMarkdown.trim());
    }

    // ─── SCOPE: INDIVIDUAL ──────────────────────────────────────────────────
    const userRaw = await loadJson<any>(`levelup_user_${username}`, null);
    if (!userRaw || !userRaw.user) {
      return res.status(404).json({ error: `Dados do membro "${username}" não encontrados.` });
    }

    const user = userRaw.user;
    const regEntry = membersRegistry.find((r: any) => r.username === username) || {};

    const autonForms = allForms.filter(
      (f: any) => f.type === 'autonomous_dev' && (
        (f.participants || []).includes(username) || f.createdBy === username
      )
    );

    const coletForms = allForms.filter(
      (f: any) => f.type === 'collective_evolution' && (
        (f.participants || []).includes(username) || f.createdBy === username
      )
    );

    const mentRecords = allMentorships.filter(
      (m: any) => (m.participants || []).includes(username)
    );

    const myVolunteerWorks = allVolunteerWorks.filter(
      (v: any) => (v.contributions || []).some((c: any) => c.username === username)
    );

    const myTeamMissions = allTeamMissions.filter(
      (m: any) => (m.completedBy || []).includes(username) || (m.assignedTo || []).includes(username)
    );

    const myKanbanTasks = allKanbanTasks.filter(
      (t: any) => t.assignee === username
    );

    const userStats: Record<string, number> = user.stats || {};
    const skillsList = Object.values(user.skill_tree || {}).map((s: any) => ({
      name: s.name,
      level: s.level,
      realm: s.realm,
      isActive: Boolean(s.isActive),
    }));

    const knowledgeTopics = Object.values(user.knowledgeBase || {}).map((t: any) => ({
      name: t.name,
      difficulty: t.difficulty,
    }));

    const badgesList = (user.unlockedBadges || []).map((bId: string) => {
      const bObj = userRaw.allBadges?.[bId] || {};
      return {
        id: bId,
        name: bObj.name || bId,
        description: bObj.description || '',
      };
    });

    let aiAnalysis = '';
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const hAuton = autonForms.reduce((acc: number, f: any) => acc + (parseFloat(f.workloadHours) || 0), 0);
        const hColet = coletForms.reduce((acc: number, f: any) => acc + (parseFloat(f.workloadHours) || 0), 0);
        const hMent = mentRecords.reduce((acc: number, m: any) => acc + (parseFloat(m.workloadHours) || 0), 0);

        const prompt = `Você é o Historiador Digital e Mentor Estratégico da Equipe Bazinga! 73 (FIRST Tech Challenge #21083).
Analise o perfil e o desenvolvimento do membro a seguir na Metodologia B-LEED:
- Nome: ${user.fullName || username} (@${username})
- Papel: ${user.role || regEntry.role || 'Membro'} | Nível: ${user.level_overall || 1} | Rank: ${user.rank || 'E-Rank'}
- Foco de Prêmio FIRST: ${user.awardFocus || regEntry.awardFocus || 'Multifoco'}
- Carga Horária B-LEED: ${hAuton.toFixed(1)}h em Cursos Autônomos, ${hMent.toFixed(1)}h em Mentorias, ${hColet.toFixed(1)}h em Evolução Coletiva (Total: ${(hAuton + hMent + hColet).toFixed(1)}h)
- Cursos Concluídos: ${autonForms.map((f: any) => f.courseName).join('; ') || 'Nenhum'}
- Mentorias Recebidas: ${mentRecords.map((m: any) => `${m.mentorName} (${m.area || 'Geral'})`).join('; ') || 'Nenhuma'}
- Reuniões com Equipes FIRST: ${coletForms.map((c: any) => c.invitedTeam).join('; ') || 'Nenhuma'}
- Tarefas Técnicas no Kanban: ${myKanbanTasks.filter((t: any) => t.status === 'done').length} concluídas de ${myKanbanTasks.length}

Redija um parecer analítico oficial (2 a 3 parágrafos concisos, tom de Engenharia e Portfólio FIRST) sintetizando:
1. Como o membro aplicou a autonomia investigativa e o suporte dos mentores no seu crescimento.
2. Como suas competências e foco de prêmio impulsionam os objetivos da Bazinga! 73 na temporada Biobuzz.
3. Alinhamento prático com o Gracious Professionalism da FIRST.
NÃO use cabeçalhos repetidos nem listas com marcadores; forneça parágrafos contínuos e profundos.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { temperature: 0.2 },
        });
        aiAnalysis = response.text || '';
      } catch (err: any) {
        console.warn(`[generate-journey] Gemini AI enrichment failed for ${username}:`, err.message);
      }
    }

    const memberMarkdown = generateIndividualMarkdown({
      username,
      fullName: user.fullName || username,
      role: user.role || regEntry.role || (TECHNICIANS.includes(username) ? 'Técnico' : 'Membro Integrante'),
      grade: user.grade || regEntry.grade || '',
      entryDate: user.entryDate || regEntry.entryDate || '2026',
      awardFocus: user.awardFocus || regEntry.awardFocus || 'Geral / Multifoco',
      level: user.level_overall || 1,
      rank: user.rank || 'E-Rank',
      xpTotal: user.xp_total || 0,
      streaks: user.streaks?.daily_streak || 0,
      coreMission: user.state?.coreMission,
      longTermGoals: user.state?.longTermGoals,
      stats: userStats,
      skills: skillsList,
      knowledgeTopics,
      autonForms,
      coletForms,
      mentRecords,
      volunteerWorks: myVolunteerWorks,
      teamMissions: myTeamMissions,
      kanbanTasks: myKanbanTasks,
      bProjects: allBProjects,
      storyLog: userRaw.storyLog || [],
      badges: badgesList,
      majorGoals: user.completedMajorGoals || [],
      aiAnalysis,
    });

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    return res.status(200).send(memberMarkdown.trim());

  } catch (error: any) {
    console.error('Error generating journey:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

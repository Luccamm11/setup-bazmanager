# BazManager — Bazinga! 73 FTC

> Plataforma de desenvolvimento de membros para a equipe de robótica **Bazinga! 73** (FIRST Tech Challenge), baseada na metodologia **B-LEAD**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/LuccaHP/Bazinga-LevelUp)

---

## 📋 Sobre o Projeto

O **BazManager** é uma plataforma gamificada de desenvolvimento individual e coletivo para membros da equipe de robótica Bazinga! 73 FTC. Cada membro possui um perfil com habilidades, metas e missões pré-configuradas de acordo com seu **prêmio foco FIRST** (Sustentabilidade, Pensamento Criativo, Conexão, Alcance, Controle ou Design e Inovação).

### Origem

Este projeto foi adaptado do **LevelUp: AI Awakening** (criado por [Oniondas](https://github.com/Oniondas)), um sistema gamificado de produtividade pessoal. A base foi refatorada para atender às necessidades específicas de uma equipe FTC, com foco em:

- Desenvolvimento de competências por prêmio FIRST
- Missões individuais e coletivas da equipe
- Painel do técnico para atribuição de tarefas
- Perfis pré-configurados para cada membro

---

## 🏗️ Arquitetura

```
setup-bazmanager/
├── api/                   # Vercel Serverless Functions
│   ├── login.ts           # Autenticação de membros (senha compartilhada)
│   ├── load.ts            # Carrega estado do membro (Redis/Vercel KV)
│   ├── save.ts            # Salva estado do membro
│   └── team-missions.ts   # CRUD de missões da equipe
├── data/                  # Dados centralizados da equipe
│   ├── members.ts         # Lista de membros com perfis e prêmios foco
│   ├── awardProfiles.ts   # Perfis por prêmio FIRST (skills, topics, goals, quests)
│   └── initialData.ts     # Factory de dados iniciais para primeiro login
├── components/            # Componentes React
│   ├── LoginModal.tsx      # Tela de login com seletor de membros
│   ├── Dashboard.tsx       # Dashboard principal do membro
│   ├── SkillTree.tsx       # Árvore de habilidades com radar chart
│   ├── MyState.tsx         # Missão, metas e objetivos do membro
│   ├── TeamMissions.tsx    # Missões atribuídas pela equipe
│   ├── TechDashboard.tsx   # Painel exclusivo do técnico
│   ├── CreateTeamMissionModal.tsx  # Criar missões para a equipe
│   ├── Menu.tsx            # Menu de navegação expandido
│   └── ...                 # Outros componentes (Store, Badges, Timer, etc.)
├── locales/               # Traduções (PT-BR e EN)
│   ├── en/
│   └── pt-BR/
├── services/              # Serviços externos
│   └── geminiService.ts   # Integração com Google Gemini AI
├── constants.ts           # Constantes globais e dados iniciais
├── types.ts               # TypeScript interfaces e enums
├── App.tsx                # Componente raiz
└── index.html             # Entry point
```

---

## 👥 Membros da Equipe

| Membro | Prêmio Foco | Área |
|--------|-------------|------|
| **Lucca** | 🌱 Sustentabilidade | Planejamento, organização, gestão financeira |
| **Clarice** | 💡 Pensamento Criativo (AE) | Documentação, Engineering Portfolio |
| **Ana Clara** | 💡 Pensamento Criativo (MCI) | Documentação técnica, análise crítica |
| **Bernardo** | 🤝 Conexão | Networking, parcerias, comunicação institucional |
| **Ana Luisa** | 📢 Alcance | Outreach, impacto social, eventos |
| **Enzo Soares** | 🤖 Controle | Programação FTC, sensores, autônomo |
| **Pedro** | 🤖 Controle | Software, arquitetura de código |
| **Yan** | 🔧 Design e Inovação | CAD, projeto mecânico, prototipagem |
| **Guilherme** | 🔧 Design e Inovação | Arquitetura mecânica, modularidade |
| **Enzo Resende** | 🔧 Design e Inovação | Design mecânico, prototipagem |

### Técnicos
| Nome | Função |
|------|--------|
| **Jonas** | Orientador técnico e pedagógico |
| **Gustavo** | Apoio ao desenvolvimento e gestão |

---

## 🏆 Prêmios FIRST e Atributos

Cada prêmio foco possui **6 atributos** que formam o radar chart do membro:

### 🌱 Sustentabilidade
Planejamento · Gestão · Responsabilidade · Visão Estratégica · Organização · Tomada de Decisão

### 💡 Pensamento Criativo
Organização · Escrita Técnica · Análise · Processo de Engenharia · Clareza de Comunicação · Aprendizado Contínuo

### 🤝 Conexão
Comunicação · Networking · Postura Profissional · Planejamento · Persuasão · Proatividade

### 📢 Alcance
Oratória · Liderança · Criatividade · Engajamento · Organização de Eventos · Impacto Social

### 🤖 Controle
Programação · Lógica · Sensores · Autonomia · Debug · Confiabilidade

### 🔧 Design e Inovação
Criatividade Técnica · CAD / Projeto · Prototipagem · Resolução de Problemas · Robustez de Solução · Iteração

---

## ⚙️ Stack Tecnológica

| Tecnologia | Uso |
|------------|-----|
| **React 18** + **TypeScript** | Frontend SPA |
| **Vite** | Build tool e dev server |
| **Tailwind CSS** | Estilização |
| **Framer Motion** | Animações e transições |
| **i18next** | Internacionalização (PT-BR / EN) |
| **Recharts** | Gráficos e radar charts |
| **Vercel** | Hosting e serverless functions |
| **Vercel KV (Redis)** | Persistência de dados por membro |
| **Google Gemini AI** | Geração de quests, recomendações, mentor IA |

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta Vercel (para KV/Redis)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/LuccaHP/Bazinga-LevelUp.git
cd Bazinga-LevelUp/setup-bazmanager

# Instale dependências
npm install

# Configure variáveis de ambiente
# Crie um arquivo .env.local com:
# KV_REST_API_URL=sua_url_redis
# KV_REST_API_TOKEN=seu_token_redis

# Rode o dev server
npm run dev
```

### Deploy no Vercel

1. Faça fork do repositório
2. Conecte ao Vercel
3. Configure as variáveis de ambiente (`KV_REST_API_URL`, `KV_REST_API_TOKEN`)
4. Deploy automático a cada push

---

## 🔐 Autenticação

O sistema utiliza autenticação simples:
- **Seletor de membro:** dropdown com todos os membros cadastrados
- **Senha compartilhada:** todos usam a mesma senha
- **Roles:** `member` (membros) e `technician` (Jonas, Gustavo)

> **Nota:** Este sistema de autenticação é adequado para uso interno da equipe. Não é recomendado para produção com dados sensíveis.

---

## 📱 Funcionalidades

### Para Membros
- **Dashboard** — Visão geral do progresso, quests ativas e metas
- **Árvore de Habilidades** — Skills com radar chart dos 6 atributos do prêmio foco
- **Quests** — Missões individuais (manuais ou geradas por IA)
- **Major Goals** — Metas de médio/longo prazo com deadline
- **Missões da Equipe** — Tarefas atribuídas pelos técnicos
- **Diário** — Reflexão e aprendizado após quests
- **Mentor IA** — Chat com Gemini para orientação
- **Timer** — Foco cronometrado para quests
- **Loja** — Itens e buffs adquiríveis com créditos
- **Conquistas** — Badges desbloqueáveis
- **Analytics** — Gráficos de progresso

### Para Técnicos
- **Painel do Técnico** — Criar e gerenciar missões para a equipe
- **Atribuição** — Missões para toda a equipe ou membros específicos
- **Acompanhamento** — Ver progresso e conclusão das missões

---

## 🔄 Primeiro Login

Quando um membro faz login pela primeira vez:
1. O sistema identifica o membro pelo username
2. Busca o perfil no `data/members.ts`
3. Gera automaticamente via `data/initialData.ts`:
   - 6 skills pré-configuradas (baseadas no prêmio foco)
   - 5 tópicos de estudo iniciais
   - 3 major goals com deadlines
   - 4 quests iniciais
   - Missão principal, objetivo da temporada e meta de curto prazo
4. Salva tudo no Redis para persistência

---

## 🗓️ Adaptação para Novas Temporadas

Para adaptar o sistema para uma nova temporada FTC:

1. **Atualizar membros:** Edite `data/members.ts` com novos membros e prêmios foco
2. **Atualizar perfis:** Ajuste `data/awardProfiles.ts` com skills e metas relevantes
3. **Atualizar arcos:** Edite os arcos em `constants.ts` (Kickoff, Competition Sprint, etc.)
4. **Atualizar login API:** Sincronize `api/login.ts` com a nova lista de membros
5. **Limpar dados:** Opcionalmente, limpe as chaves Redis para resetar o progresso

---

## 📄 Licença

Este projeto é uma adaptação do [LevelUp: AI Awakening](https://github.com/Oniondas) para uso exclusivo da equipe **Bazinga! 73 FTC**.

---

## 🙏 Créditos

- **Base original:** [Oniondas](https://github.com/Oniondas) — LevelUp: AI Awakening
- **Adaptação Bazinga!:** [LuccaHP](https://github.com/LuccaHP)
- **Equipe:** Bazinga! 73 — FIRST Tech Challenge

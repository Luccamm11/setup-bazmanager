# BazManager — Bazinga! 73 FTC

> Plataforma de desenvolvimento de membros para a equipe de robótica **Bazinga! 73** (FIRST Tech Challenge), baseada na metodologia **B-LEED**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/LuccaHP/Bazinga-LevelUp)

---

## 📋 Sobre o Projeto

O **BazManager** é uma plataforma gamificada de desenvolvimento individual e coletivo para membros da equipe de robótica Bazinga! 73 FTC. Cada membro possui um perfil com habilidades, metas e missões pré-configuradas de acordo com seu **prêmio foco FIRST** (Sustentabilidade, Pensamento Criativo, Conexão, Alcance, Controle ou Design e Inovação).

### Origem

Este projeto foi adaptado do **LevelUp: AI Awakening** (criado por [Oniondas](https://github.com/Oniondas)), um sistema gamificado de produtividade pessoal. A base foi refatorada para atender às necessidades específicas de uma equipe FTC, com foco em:

- Desenvolvimento de competências por prêmio FIRST
- Missões individuais e coletivas da equipe
- Painel do técnico para atribuição de tarefas
- Perfis pré-configurados para cada membro (B-LEED)

---

## 🏗️ Arquitetura

```
setup-bazmanager/
├── api/                   # Vercel Serverless Functions (Supabase / CRUD / Auth)
│   ├── login.ts           # Autenticação de membros (senha compartilhada)
│   ├── persistence.ts     # Carregamento e salvamento de estado do membro (Supabase key_value_store)
│   ├── crud.ts            # CRUD centralizado (5W2H, Kanban, Finanças, Frequência, Backup Cron)
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

| **Enzo Soares** | 🤖 Controle | Programação FTC, sensores, autônomo |
| **Pedro** | 🤖 Controle | Software, arquitetura de código |
| **Yan** | 🔧 Design e Inovação | CAD, projeto mecânico, prototipagem |
| **Guilherme** | 🔧 Design e Inovação | Arquitetura mecânica, modularidade |
| **Enzo Resende** | 🔧 Design e Inovação | Design mecânico, prototipagem |

### Técnicos
| Nome | Função |
|------|--------|
| **Jonas** | Orientador técnico e pedagógico |
| **Ramon Montorri** | Orientador técnico e estratégico |

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
| **Supabase (PostgreSQL)** | Banco de dados principal e persistência de dados (tabela `key_value_store`) |
| **GitHub REST API + Cron** | Backup diário automático versionado no repositório |
| **Google Gemini AI** | Geração de quests, recomendações, mentor IA |
| **Redis Cloud (Legado)** | Cópia congelada de segurança do momento da migração (não ativo) |

---

## 🗄️ Modelo de Dados & Persistência

O sistema utiliza o **Supabase (PostgreSQL)** como fonte de verdade ativa.

### Tabela `key_value_store`
Para compatibilidade e flexibilidade com a estrutura de documentos do sistema, os dados são armazenados na tabela `key_value_store`:
- **`key`** (`TEXT PRIMARY KEY`): Identificador único da entidade/registro.
- **`value`** (`JSONB`): Carga útil do registro em formato JSON estruturado.
- **`updated_at`** (`TIMESTAMPTZ`): Data e hora da última atualização.

### Taxonomia de Chaves
Mesma taxonomia herdada e padronizada:
- `levelup_user_{username}`: Estado completo do membro (perfil, atributos, skills, missões, inventário).
- `levelup_notifications_{username}`: Notificações direcionadas ao membro.
- `levelup_members_registry`: Lista cadastral de membros e cargos.
- `levelup_team_missions`: Missões coletivas e individuais da equipe.
- `levelup_5w2h_plans`: Planos de ação 5W2H da equipe.
- `levelup_printer_queue`: Fila de impressão 3D.
- `levelup_team_legacy`: Registros de histórico e legado da equipe.
- `levelup_mentors` e `levelup_mentorship_records`: Cadastro e registros de mentorias.
- `levelup_attendance_records`: Frequência e presença dos membros.
- `levelup_finance_records`: Registros e transações financeiras.
- `levelup_kanban_tasks`: Tarefas do quadro Kanban.
- `levelup_learning_trails_data`: Trilhas de aprendizagem B-LEED.
- `levelup_chat_data`: Mensagens e interações do chat da equipe.

---

## 🛡️ Mecanismo de Backup Automatizado

- **Frequência:** Executado diariamente às 06:00 UTC via Vercel Cron Job (`vercel.json` -> `/api/crud?action=backup`).
- **Origem dos Dados:** Supabase (`key_value_store`).
- **Destino:** Repositório do GitHub, gravado em `backups/backup-YYYY-MM-DD.json`.
- **Autenticação:** Protegido via token Bearer validado com a variável `CRON_SECRET`.
- **Garantia de Integridade:** Exportação determinística e ordenada por chave, com hash de integridade e commit automático via GitHub REST API.

---

## 🔑 Variáveis de Ambiente

### Variáveis Ativas (Necessárias)
| Variável | Descrição | Exemplo / Uso |
|----------|-----------|---------------|
| `SUPABASE_URL` | URL base da instância Supabase | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (backend) com permissões na `key_value_store` | `eyJhbGciOi...` |
| `USE_SUPABASE` | Flag indicando uso do Supabase como backend ativo | `true` |
| `CRON_SECRET` | Secret de autenticação Bearer para o cron job de backup e rotas admin | String aleatória segura |
| `GITHUB_BACKUP_TOKEN` | Personal Access Token do GitHub com permissão de escrita em repositório | `github_pat_...` / `ghp_...` |
| `GITHUB_BACKUP_REPO` | Repositório alvo do GitHub onde os arquivos de backup são comitados | `usuario/repo` (ex: `LuccaHP/Bazinga-LevelUp`) |
| `VITE_GEMINI_API_KEY` / `GEMINI_API_KEY` | Chave de API do Google Gemini para as funções de IA e Mentor | `AIzaSy...` |

### Variáveis Legadas / Desativadas
| Variável | Status | Motivo |
|----------|--------|--------|
| `REDIS_URL` | ⚠️ **Legado / Inativo** | Mantida apenas como referência histórica da cópia congelada do Redis Cloud no momento da migração. Não é mais utilizada para leitura/escrita em produção. |
| `KV_REST_API_URL` | ❌ **Descontinuado** | Variável do Vercel KV legado. |
| `KV_REST_API_TOKEN` | ❌ **Descontinuado** | Variável do Vercel KV legado. |

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Projeto Supabase configurado com a tabela `key_value_store`

### Instalação

```bash
# Clone o repositório
git clone https://github.com/LuccaHP/Bazinga-LevelUp.git
cd Bazinga-LevelUp/setup-bazmanager

# Instale dependências
npm install

# Configure variáveis de ambiente (.env.local)
# SUPABASE_URL=https://seu-projeto.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
# USE_SUPABASE=true
# VITE_GEMINI_API_KEY=sua_chave_gemini

# Rode o dev server
npm run dev
```

### Deploy no Vercel

1. Faça fork / push para o repositório
2. Conecte o projeto na Vercel
3. Configure as variáveis de ambiente de Produção:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `USE_SUPABASE=true`
   - `CRON_SECRET`
   - `GITHUB_BACKUP_TOKEN`
   - `GITHUB_BACKUP_REPO`
   - `VITE_GEMINI_API_KEY`
4. Deploy automático a cada push no branch principal

---

## 🔐 Autenticação

O sistema utiliza autenticação simples:
- **Seletor de membro:** dropdown com todos os membros cadastrados
- **Senha compartilhada:** todos usam a mesma senha
- **Roles:** `member` (membros) e `technician` (Jonas, Ramon)

> **Nota:** Este sistema de autenticação é adequado para uso interno da equipe. Não é recomendado para produção com dados sensíveis de acesso público.

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
4. Salva tudo no Supabase (`key_value_store`) para persistência ativa

---

## 🗓️ Adaptação para Novas Temporadas

Para adaptar o sistema para uma nova temporada FTC:

1. **Atualizar membros:** Edite `data/members.ts` com novos membros e prêmios foco
2. **Perfis B-LEED Granulares:** Edite `data/awardProfiles.ts` com a nova base técnica
3. **Atualizar arcos:** Edite os arcos em `constants.ts` (Kickoff, Competition Sprint, etc.)
4. **Atualizar login API:** Sincronize `api/login.ts` com a nova lista de membros
5. **Limpar / Resetar dados:** Se necessário, limpe registros específicos no Supabase (`key_value_store`) para resetar o progresso dos membros mantendo backups históricos seguros

---

## 📄 Licença

Este projeto é uma adaptação do [LevelUp: AI Awakening](https://github.com/Oniondas) para uso exclusivo da equipe **Bazinga! 73 FTC**.

---

## 🙏 Créditos

- **Base original:** [Oniondas](https://github.com/Oniondas) — LevelUp: AI Awakening
- **Adaptação Bazinga!:** [LuccaHP](https://github.com/LuccaHP)
- **Equipe:** Bazinga! 73 — FIRST Tech Challenge

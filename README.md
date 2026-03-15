# 🎮 LevelUp: AI Awakening

> **Turn your real life into an RPG.** LevelUp is a gamified productivity system powered by Gemini AI that transforms your goals, skills, and daily habits into quests, XP, and character progression.

## 🌟 What is LevelUp?

LevelUp is a **free, open-source, browser-based productivity app** that treats your real life like an RPG video game. Set your goals, define your skills, and let an AI Mentor (powered by Google Gemini) generate personalized daily quests, track your streaks, reward you with XP and loot, and keep you accountable — all without any backend or data collection.

Everything runs **entirely in your browser**. Your data never leaves your device.

> [!NOTE]
> **You can try LevelUp without an API key.** The app fully works for manual quest creation, XP tracking, skill trees, badges, analytics, and all core RPG features. An API key is only needed to unlock AI-powered features like auto-generated quests and the AI Mentor chat.

> [!IMPORTANT]
> **We do not collect your API key or any personal data.** Your Gemini API key is stored only in your browser's `localStorage` on your own machine. It is never transmitted to us or any third-party server. We have zero capability to collect, view, or store your API key, progress data, or any personal information.

---

## 📖 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [Directory Structure](#-directory-structure)
- [Application Flow](#-application-flow)
- [AI Integration Flow](#-ai-integration-flow)
- [Data Model](#-data-model)
- [Component Map](#-component-map)
- [Getting Started](#-getting-started)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **AI Quest Generation** | Gemini AI generates personalized daily quests based on your skills, goals, and calendar events |
| 📈 **Skill Tree** | Track skills across 6 Realms: Mind, Body, Creation, Spirit, Social, Meta |
| 🗺️ **Major Goals** | Define long-term milestones (Exams, Projects, Gauntlets) with deadlines and XP rewards |
| 💬 **AI Mentor Chat** | Conversational AI that takes real-time actions (add quests, update goals, buy items) |
| 🎯 **My State** | Define your Core Mission, Long-Term, Short-Term, and Emergency Goals to guide the AI |
| 🔥 **Streak System** | Daily streak bonuses that scale XP and lootbox rewards |
| 🎁 **Daily Lootbox** | Randomized drops: Credits, XP, Gems, or consumable items |
| 🏆 **Badges & Achievements** | Unlockable badges for reaching milestones (Level 10, Boss Kills, Realm Mastery) |
| 🧵 **Story Arcs** | Thematic event overlays that modify gameplay (e.g., "Exam Week" arc boosts Study XP) |
| 🧾 **Journal & AAR** | After-Action-Review system that generates improvement quests from your reflections |
| 📊 **Analytics** | Visualize XP history, activity heatmaps, and skill radar charts |
| 💰 **Economy & Staking** | In-game credit economy with consumable buffs and a credit staking system |
| 🔌 **Integrations** | Google Calendar (quest prep), GitHub activity (code quests) |
| ⏱️ **Timed Quests** | Focus timer with time-bonus XP rewards for finishing early |
| 📦 **Backup & Restore** | Full JSON export/import of your entire save state |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 6 |
| **Animations** | Framer Motion 12 |
| **Charts** | Recharts 3 |
| **Icons** | Lucide React |
| **AI Engine** | Google Gemini API (`@google/genai`) — Model: `gemini-2.5-flash` |
| **Auth** | Google OAuth 2.0 (via `auth/googleAuth.ts`) |
| **Integrations** | Google Calendar API, GitHub REST API |
| **Styling** | Vanilla CSS + Tailwind CSS utility classes |
| **Deployment** | Firebase Hosting |

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    subgraph "Browser / Client"
        A[index.html] --> B[index.tsx]
        B --> C[App.tsx\nGlobal State & Handlers]
        C --> D[Header.tsx]
        C --> E[View Router\nDashboard / SkillTree / Chat / ...]
        C --> F[Modals Layer]
        C --> G[LevelUpAnimation.tsx]
        C --> H[RewardToast.tsx]
    end

    subgraph "Services Layer"
        C -->|AI Calls| I[geminiService.ts\nGemini 2.5 Flash]
        C -->|Google OAuth| J[auth/googleAuth.ts]
        C -->|Calendar Events| K[googleCalendarService.ts]
        C -->|Repo Activity| L[githubService.ts]
    end

    subgraph "External APIs"
        I <-->|Tool Calling + JSON Schema| M[(Google Gemini API)]
        J <-->|OAuth 2.0| N[(Google Identity)]
        K <-->|REST| O[(Google Calendar API)]
        L <-->|REST| P[(GitHub API)]
    end

    subgraph "Persistence"
        C -->|JSON serialize| Q[(localStorage)]
        Q -->|Hydrate on load| C
    end
```

---

## 📁 Directory Structure

```
levelup/
├── App.tsx                   # Root component — all global state, handlers, and routing
├── index.tsx                 # React entry point
├── index.html                # HTML shell
├── types.ts                  # All TypeScript interfaces and enums
├── constants.ts              # Default data (badges, store items, initial user state)
│
├── auth/
│   └── googleAuth.ts         # Google OAuth 2.0 token management
│
├── services/
│   ├── geminiService.ts      # All Gemini AI calls (quests, chat, goals, topics...)
│   ├── googleCalendarService.ts  # Fetch upcoming events
│   ├── githubService.ts      # Fetch recent commit/PR activity
│   └── googleDriveService.ts # (Placeholder) Drive backup integration
│
└── components/
    ├── Dashboard.tsx         # Main quest board, XP overview, major goals
    ├── Header.tsx            # User profile, XP bar, navigation
    ├── Chatbot.tsx           # AI Mentor chat + Journal mode
    ├── SkillTree.tsx         # Skill grid + Realm Radar chart
    ├── MajorGoals.tsx        # List of long-term goal milestones
    ├── Analytics.tsx         # XP history, activity heatmap
    ├── Store.tsx             # Shop for consumable buffs
    ├── Inventory.tsx         # Owned items + activation
    ├── Staking.tsx           # Credit staking system
    ├── Journal.tsx           # Post-goal reflection and AAR
    ├── Badges.tsx            # Achievement gallery
    ├── StoryLog.tsx          # Story arc narrative log
    ├── SystemLog.tsx         # System event messages
    ├── MyState.tsx           # Core mission and goal editor
    ├── Timer.tsx             # Focus timer for timed quests
    ├── LevelUpAnimation.tsx  # Full-screen generative art level-up celebration
    ├── QuestCard.tsx         # Individual quest item card
    ├── QuestBoard.tsx        # Quest grid wrapper
    ├── XpBar.tsx             # Reusable XP progress bar
    ├── ActiveBuffs.tsx       # Display of active XP/Credit buffs
    ├── RewardToast.tsx       # Pop-up XP/credit gain notifications
    ├── SettingsModal.tsx     # App settings (theme, API key, backup)
    ├── TestingPanel.tsx      # Dev panel for simulating XP, time, errors
    └── [... Modal components for each entity type]
```

---

## 🔄 Application Flow

```mermaid
flowchart TD
    Start([App Launch]) --> AuthCheck{Is Authenticated?}
    AuthCheck -- No --> LoginModal[LoginModal / File Restore]
    LoginModal --> GoogleOAuth[Google OAuth]
    GoogleOAuth --> LoadState
    LoginModal --> FileRestore[Load from JSON Backup]
    FileRestore --> LoadState

    AuthCheck -- Yes --> LoadState[Load State from localStorage]
    LoadState --> App[App.tsx — Main Loop]

    App --> GenerateQuests[AI: Generate Daily Quests]
    GenerateQuests --> QuestBoard[Dashboard: Quest Board]

    QuestBoard --> CompleteQuest[User Completes Quest]
    CompleteQuest --> GrantReward[handleGrantReward]
    GrantReward --> CalcXP[Calculate XP + Buffs + Streak Bonus]
    CalcXP --> CheckLevel{Level Up?}
    CheckLevel -- Yes --> LevelUpFX[Level-Up Animation + Sound]
    CheckLevel -- No --> UpdateState[Update User State]
    LevelUpFX --> UpdateState
    UpdateState --> PersistLS[(localStorage)]

    App --> Chat[Chatbot — AI Mentor]
    Chat --> AIAction{AI Calls Tool?}
    AIAction -- Yes --> ExecuteAction["App.tsx handler (addQuest, updateUserState, etc.)"]
    AIAction -- No --> TextReply[Display AI Text Reply]
    ExecuteAction --> UpdateState
```

---

## 🤖 AI Integration Flow

All AI calls are handled in `services/geminiService.ts` and orchestrated from `App.tsx`.

```mermaid
sequenceDiagram
    participant U as User
    participant App as App.tsx
    participant GS as geminiService.ts
    participant Gemini as Gemini 2.5 Flash

    U->>App: Opens app / requests quests
    App->>GS: generateDailyQuests(user, calendar, chatHistory)
    GS->>Gemini: Prompt with user profile + JSON schema
    Gemini-->>GS: Structured JSON array of quests
    GS-->>App: Quest[]
    App->>App: setQuests(newQuests)

    U->>App: Sends chat message
    App->>GS: getAiChatResponseAndActions(user, history, message)
    GS->>Gemini: Multi-turn with Tool Declarations
    Gemini-->>GS: Text + Function Call(s)
    GS-->>App: { text, functionCalls }
    App->>App: Execute function calls (addQuest, updateUserState, etc.)
    App->>App: Append AI reply to chatHistory

    U->>App: Updates topic difficulty
    App->>App: Recalculate XP + skill levels
    App->>App: useEffect detects level_overall change
    App->>App: Trigger LevelUpAnimation
```

---

## 📦 Data Model

```mermaid
erDiagram
    USER {
        string name
        string rank
        int level_overall
        int xp_total
        int xpToNextLevel
        UserState state
        SkillTree skill_tree
        KnowledgeBase knowledgeBase
        Wallet wallet
        Streaks streaks
        ActiveTimedQuest activeTimedQuest
        Arc activeArc
    }

    USER ||--o{ QUEST : "has active"
    USER ||--o{ MAJOR_GOAL : "has"
    USER ||--o{ SKILL : "trains"
    USER ||--o{ KNOWLEDGE_TOPIC : "studies via"
    USER ||--o{ BADGE : "unlocks"
    USER ||--o{ STORE_ITEM : "owns in inventory"
    USER ||--o| ARC : "has active arc"

    SKILL {
        string id
        string name
        Realm realm
        int level
        int xp
        int priority
    }

    KNOWLEDGE_TOPIC {
        string id
        string name
        string skillId
        TopicDifficulty difficulty
    }

    QUEST {
        string id
        string title
        Realm realm
        QuestStatus status
        int xp_reward
        int credit_reward
        bool isBossQuest
        bool isWeeklyBoss
        Penalty penalty
    }

    MAJOR_GOAL {
        string id
        string title
        string type
        string deadline
        int xp_reward
    }

    USER_STATE {
        string coreMission
        string longTermGoals
        string shortTermGoals
        string emergencyGoals
        string sideQuests
    }

    USER ||--|| USER_STATE : "reflects"
```

---

## 🧩 Component Map

```mermaid
graph LR
    App --> Header
    App --> LevelUpAnimation
    App --> RewardToast
    App --> router{View Router}

    router --> Dashboard
    router --> SkillTree
    router --> MajorGoals
    router --> Chatbot
    router --> Store
    router --> Inventory
    router --> Staking
    router --> Analytics
    router --> Badges
    router --> Journal
    router --> StoryLog
    router --> SystemLog
    router --> MyState
    router --> Timer

    Dashboard --> QuestBoard
    QuestBoard --> QuestCard
    Dashboard --> ActiveBuffs
    Dashboard --> XpBar
    SkillTree --> RadarChart["Realm Radar Chart (recharts)"]
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)
- (Optional) A Google Cloud project with Calendar API enabled for calendar sync

### Setup

```bash
# Clone the repository
git clone https://github.com/oniondas/levelup.git
cd levelup

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

On first launch, you will be prompted to:
1. **Sign in** with your Google account, or load from a backup file.
2. **Enter your Gemini API key** — or **skip this step entirely**.

### ⚡ Skipping the API Key

You can click **"Skip"** on the API key prompt and use LevelUp straight away. You will have full access to:
- Manual quest creation & completion
- XP, levels, and skill tree progression
- Badges, streaks, lootboxes & the in-game economy
- Analytics, journal, story log, and all other views

AI features (auto-generated quests, AI Mentor chat, AAR analysis) will be disabled until you add a key later via **Settings → API Key**.

> [!IMPORTANT]
> **Privacy guarantee:** We do not have any capability to collect your API key, your name, your progress, or any other data. Everything is stored locally in your browser only.

### Build for Production

```bash
npm run build
```

Outputs a static bundle to `/dist`. Deploy with Firebase Hosting or any static host.

---

## 🔐 Privacy

- Your Gemini API key is stored only in your browser's `localStorage`.
- All user progress data is persisted locally. No data is sent to any backend server.
- Google Calendar / GitHub integrations use OAuth tokens stored in memory only.

---

## 📜 License

This project is open source under the MIT License. See `LICENSE` for details.

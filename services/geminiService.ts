import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
// FIX: Imported MajorGoal type to resolve definition errors.
import { User, Quest, Realm, Difficulty, QuestStatus, ChatMessage, Skill, KnowledgeTopic, MajorGoal, Arc, Badge, StoreItem, AiRecommendations, TopicDifficulty } from '../types';
import { ICON_MAP } from "../constants";

function getSanitizedUserForPrompt(user: User) {
    const { name, level_overall, rank, stats, knowledgeBase, skill_tree, state } = user;
    
    const activeSkillIds = new Set(Object.values(skill_tree).filter((s: Skill) => s.isActive).map((s: Skill) => s.id));

    const skills = Object.values(skill_tree)
        .filter((s: Skill) => s.isActive)
        .map((s: Skill) => ({ id: s.id, name: s.name, level: s.level, priority: s.priority }));

    const topics = Object.values(knowledgeBase)
        .filter((t: KnowledgeTopic) => activeSkillIds.has(t.skillId))
        .map((t: KnowledgeTopic) => ({ 
            topic_id: t.id,
            topic_name: t.name, 
            difficulty: t.difficulty,
            skill: skill_tree[t.skillId]?.name 
        }));

    return { name, rank, level: level_overall, stats, state, skills, knowledge_topics: topics };
}

export const generateDailyQuests = async (user: User, contextualData: { [key: string]: string }, chatHistory: ChatMessage[], shouldGenerateWeeklyBoss: boolean): Promise<any[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const userProfile = getSanitizedUserForPrompt(user);

    const formattedHistory = chatHistory.length > 2
        ? `USER'S RECENT CHAT WITH AI MENTOR (Use this to understand their immediate focus):\n${chatHistory.slice(-4).map(msg => `${msg.sender === 'user' ? 'User' : 'AI Mentor'}: ${msg.text}`).join('\n')}\n`
        : '';

    const weeklyBossInstructions = shouldGenerateWeeklyBoss
        ? `
        **SPECIAL EVENT: WEEKLY MEGA BOSS FIGHT!**
        It's time for the user's weekly challenge. You MUST generate ONE "Weekly Mega Boss" quest.
        - This quest must be a significant, multidisciplinary challenge that tests multiple skills by targeting topics from different skills.
        - It must be flagged with \`isWeeklyBoss: true\`.
        - **Critical Reward Scaling:** The \`xp_reward\` for this boss quest MUST be approximately 25% of the user's XP needed for the next level, which is ${Math.floor(user.xpToNextLevel * 0.25)} XP. Set the \`credit_reward\` to be high as well (around 100-250 credits).
        - Make the title and description epic and challenging. This is the main event of their week.
        `
        : '';
    
    const contextualDataString = Object.entries(contextualData)
        .map(([source, data]) => `--- START ${source.toUpperCase()} DATA ---\n${data}\n--- END ${source.toUpperCase()} DATA ---`)
        .join('\n\n');

    const prompt = `
        You are LevelUp's Quest System, an AI that generates personalized daily quests for a user in a real-life RPG app.
        
        USER PROFILE AND STATE:
        ${JSON.stringify(userProfile, null, 2)}
        
        ${contextualDataString}

        ${formattedHistory}
        
        ${user.activeArc ? `ACTIVE ARC: ${user.activeArc.title} - ${user.activeArc.description}` : ''}
        
        ${weeklyBossInstructions}

        INSTRUCTIONS:
        Generate 3-5 daily quests based on ALL the information provided. If generating a Weekly Mega Boss, it counts as one of these quests.
        Note: The user profile ONLY contains active skills and their topics. The "difficulty" on a topic represents the user's current assessment of it. 'Easy' or 'Medium' means they are still learning it.

        1.  **HIERARCHY OF PRIORITIES (MOST to LEAST important):**
            - **A) WEEKLY MEGA BOSS:** If instructed, this is top priority.
            - **B) RECENT CHAT:** The user's recent conversation reveals their immediate focus. This context is MORE IMPORTANT than their stored goals.
            - **C) MAJOR GOALS (Exams/Projects):** Next highest priority. Generate quests that are direct, actionable steps towards these goals by targeting specific knowledge topics from the relevant skills.
            - **D) SHORT-TERM GOALS (From User State):** Create quests aligned with their current 1-3 month objectives.
            - **E) LOW-DIFFICULTY TOPICS & HIGH PRIORITY SKILLS:** After addressing higher priorities, create quests specifically for topics the user has marked as 'Easy' or 'Medium' difficulty, as this indicates they are currently learning them. Prioritize topics belonging to high-priority skills (4-5).
            - **F) LONG-TERM GOALS & CORE MISSION:** If no other priorities exist, create quests that build foundational skills for their long-term vision.

        2.  **STRATEGIC QUEST DESIGN:**
            - **Link to Topics:** Each quest MUST be linked to one or more \`topic_id\`s from the user's profile in the \`knowledgeTopics\` array. This is how the user's skills level up.
            - **Chained Mini-Projects:** For larger topics, create a 2 or 3-part quest chain by populating the \`chain\` object. Only generate the first part.
            - **Boss Fights:** If a major exam is less than 3 days away, generate ONE "Boss Quest" flagged with "isBossQuest: true". This is different from the Weekly Mega Boss.
            - **Deadlines & Penalties:** Every quest MUST have a \`deadlineHours\` property (integer, hours from now). Unless it is a Mystery Quest, it MUST also have a \`penalty\` object with \`type: 'xp'\` and an \`amount\` (integer, roughly 25% of the xp_reward).

        3.  **PROGRESSION & BALANCE:**
            - **Balance:** Always include one 'Body' realm quest.
            - **Dynamic Difficulty:** Adjust difficulty and XP rewards based on user level (Levels 1-10: 10-50 XP; Levels 11-25: 40-100 XP; Levels 26+: 75-200 XP). Weekly Mega Boss rewards are an exception.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            realm: { type: Type.STRING, enum: Object.values(Realm) },
                            knowledgeTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
                            xp_reward: { type: Type.INTEGER },
                            credit_reward: { type: Type.INTEGER },
                            difficulty: { type: Type.STRING, enum: Object.values(Difficulty) },
                            duration_est_min: { type: Type.INTEGER },
                            isMystery: { type: Type.BOOLEAN },
                            isBossQuest: { type: Type.BOOLEAN },
                            isWeeklyBoss: { type: Type.BOOLEAN },
                            chain: { 
                                type: Type.OBJECT,
                                properties: {
                                    current: { type: Type.INTEGER },
                                    total: { type: Type.INTEGER }
                                }
                             },
                            deadlineHours: { type: Type.INTEGER },
                            penalty: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING, enum: ['xp', 'credits'] },
                                    amount: { type: Type.INTEGER }
                                },
                            },
                        },
                        required: ["title", "description", "realm", "knowledgeTopics", "xp_reward", "credit_reward", "difficulty", "duration_est_min"]
                    },
                },
            },
        });

        const jsonResponse = JSON.parse(response.text);
        
        if (!Array.isArray(jsonResponse)) {
            console.error("Gemini API returned non-array response:", jsonResponse);
            throw new Error("Invalid response format from Gemini API.");
        }

        return jsonResponse.map((questData: any, index: number) => ({
            ...questData,
            id: `gemini-quest-${Date.now()}-${index}`,
            status: QuestStatus.Pending,
        }));
    } catch (error) {
        console.error("Error generating quests with Gemini:", error);
        if (error instanceof Error && error.message.includes('JSON')) {
             throw new Error("AI response was not valid JSON. Please try again.");
        }
        throw new Error("Failed to fetch quests from Gemini API.");
    }
};

const tools: FunctionDeclaration[] = [
    {
        name: "addQuest",
        description: "Adds a new personal quest to the user's daily quest list.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "The title of the quest." },
                description: { type: Type.STRING, description: "A brief description of the quest." },
                realm: { type: Type.STRING, enum: Object.values(Realm), description: "The realm this quest belongs to." },
                duration_est_min: { type: Type.INTEGER, description: "Estimated time in minutes to complete." },
                difficulty: { type: Type.STRING, enum: Object.values(Difficulty), description: "The difficulty of the quest." },
                xp_reward: { type: Type.INTEGER, description: "The XP reward for completing the quest." },
                credit_reward: { type: Type.INTEGER, description: "The credit reward for completing the quest." },
            },
            required: ["title", "description", "realm", "duration_est_min"],
        }
    },
    {
        name: "completeQuest",
        description: "Marks a quest as completed based on its title.",
        parameters: { type: Type.OBJECT, properties: { questTitle: { type: Type.STRING, description: "The title of the quest to complete." } }, required: ["questTitle"] }
    },
    {
        name: "addMajorGoal",
        description: "Adds a new major goal, like an exam or project.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "The title of the major goal." },
                description: { type: Type.STRING, description: "A brief description of the goal." },
                type: { type: Type.STRING, enum: ['Exam', 'Project', 'Hackathon'], description: "The type of goal." },
                deadlineDays: { type: Type.INTEGER, description: "Number of days from today until the deadline." },
                xp_reward: { type: Type.INTEGER, description: "The XP reward for completing the goal." },
                credit_reward: { type: Type.INTEGER, description: "The credit reward for completing the goal." },
                skillId: { type: Type.STRING, description: "The ID of the skill related to this goal, especially for exams." },
                syllabus: { type: Type.STRING, description: "Syllabus or key topics for an exam goal." },
            },
            required: ["title", "description", "type", "deadlineDays"],
        }
    },
    {
        name: "completeMajorGoal",
        description: "Marks a major goal as completed based on its title.",
        parameters: { type: Type.OBJECT, properties: { goalTitle: { type: Type.STRING, description: "The title of the major goal to complete." } }, required: ["goalTitle"] }
    },
    {
        name: "buyStoreItem",
        description: "Buys an item from the store.",
        parameters: { type: Type.OBJECT, properties: { itemName: { type: Type.STRING, description: "The name of the item to buy." } }, required: ["itemName"] }
    },
    {
        name: "useInventoryItem",
        description: "Uses an item from the user's inventory.",
        parameters: { type: Type.OBJECT, properties: { itemName: { type: Type.STRING, description: "The name of the item to use." } }, required: ["itemName"] }
    },
    {
        name: "updateUserState",
        description: "Updates the user's core mission or their long-term, short-term, emergency, or side quests/goals.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                coreMission: { type: Type.STRING, description: "The user's ultimate, high-level mission." },
                longTermGoals: { type: Type.STRING, description: "The user's goals for the next 6-12 months." },
                shortTermGoals: { type: Type.STRING, description: "The user's goals for the next 1-3 months." },
                emergencyGoals: { type: Type.STRING, description: "Contingency plans or urgent, unplanned goals." },
                sideQuests: { type: Type.STRING, description: "Secondary or fun tasks the user is interested in." },
            }
        }
    }
];

// FIX: Completed the function implementation to make the API call and return a response object, resolving errors in App.tsx.
export const getAiChatResponseAndActions = async (user: User, history: ChatMessage[], newMessage: string, quests: Quest[], majorGoals: MajorGoal[], storeItems: StoreItem[]): Promise<{ text: string, functionCalls: any[] | undefined }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const userProfile = getSanitizedUserForPrompt(user);

    const formattedHistory = history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));

    const systemInstruction = `You are the System, an AI Mentor for the LevelUp app. Your persona is a blend of a wise guide and a firm trainer (like J.A.R.V.I.S. or the Solo Leveling System). Refer to the user as "Awakened" or by name.
    
    You have access to a set of tools to directly modify the application state based on the user's commands.
    
    **CRITICAL INSTRUCTIONS:**
    1.  **ANALYZE INTENT:** First, determine if the user is asking a question, having a conversation, or giving a command.
    2.  **USE TOOLS FOR COMMANDS:** If it's a command (e.g., "add a quest", "I finished...", "set my goal to...", "buy an item"), you MUST call the appropriate function tool.
    3.  **SEEK CLARIFICATION:** If a command is ambiguous (e.g., "I finished the signals task"), ask for clarification (e.g., "Which signals quest did you complete?").
    4.  **PROVIDE CONVERSATIONAL RESPONSES:** For questions or general chat, respond naturally in your persona.
    5.  **COMBINE ACTIONS AND TEXT:** You can both call a function AND provide a text response in the same turn. For example, if the user says "Add a quest to read for 1 hour", you can call \`addQuest\` and also respond with "Consider it done. A new quest has been added to your log."
    6.  **CONTEXT IS KEY:** Use the provided user profile, active quests, and major goals to inform your responses and actions.
    
    USER PROFILE: ${JSON.stringify(userProfile, null, 2)}
    
    ACTIVE QUESTS:
    ${quests.map(q => `- ${q.title}`).join('\n')}
    
    ACTIVE MAJOR GOALS:
    ${majorGoals.map(g => `- ${g.title}`).join('\n')}
    
    AVAILABLE STORE ITEMS:
    ${storeItems.map(i => `- ${i.name}`).join('\n')}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [...formattedHistory, { role: 'user', parts: [{ text: newMessage }] }],
            config: {
                systemInstruction,
                tools: [{ functionDeclarations: tools }],
            }
        });

        return { text: response.text, functionCalls: response.functionCalls };
    } catch (error) {
        console.error("Error in getAiChatResponseAndActions:", error);
        // Return a user-friendly message and no function calls on error
        return { text: "An error occurred while communicating with the AI core. Please check the console.", functionCalls: undefined };
    }
};

// FIX: Implemented missing function to generate short text snippets for AI-assisted UI.
export const generateShortText = async (prompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Generate a very short, concise text based on this prompt. The response should be plain text, not JSON. PROMPT: "${prompt}"`,
    });
    return response.text.trim().replace(/"/g, ''); // Remove quotes if the model adds them
};

// FIX: Added devGenerateText as an alias for generateShortText.
export const devGenerateText = generateShortText;

// FIX: Implemented missing function to generate knowledge topics for a skill.
export const generateKnowledgeTopics = async (skill: Skill): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        Generate a list of 5-10 specific, beginner-friendly knowledge topics for the skill "${skill.name}".
        The topics should be actionable and represent concrete things to learn or practice.
        For example, for "Circuit Design", topics could be "Ohm's Law", "KVL/KCL", "Thevenin's Theorem".
    `;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    topics: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ["topics"]
            }
        }
    });
    const jsonResponse = JSON.parse(response.text);
    return jsonResponse.topics || [];
};

// FIX: Implemented missing function to break down a syllabus into knowledge topics.
export const generateTopicsFromSyllabus = async (syllabus: string, skill: Skill, existingTopics: KnowledgeTopic[]): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const existingTopicNames = existingTopics.map(t => t.name.toLowerCase());
    const prompt = `
        Analyze the following syllabus for the skill "${skill.name}":
        Syllabus: "${syllabus}"

        Existing topics for this skill: ${JSON.stringify(existingTopicNames)}

        Break down the syllabus into a list of specific, granular knowledge topics.
        - Each topic should be a distinct concept or subject from the syllabus.
        - EXCLUDE any topics that are already present in the "Existing topics" list (case-insensitive).
        - Return only the names of the NEW topics.
    `;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    new_topics: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ["new_topics"]
            }
        }
    });
    const jsonResponse = JSON.parse(response.text);
    return jsonResponse.new_topics || [];
};

// FIX: Implemented missing function to generate major goals from a user prompt.
export const generateMajorGoals = async (prompt: string, user: User, xpForNextSixLevels: number): Promise<Omit<MajorGoal, 'id'>[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const userProfile = getSanitizedUserForPrompt(user);

    const systemPrompt = `
        You are an AI that helps a user break down their high-level goals into structured "Major Goals" for their real-life RPG app.
        
        USER PROFILE: ${JSON.stringify(userProfile, null, 2)}
        
        USER'S REQUEST: "${prompt}"

        INSTRUCTIONS:
        1.  Analyze the user's request and profile.
        2.  Generate 1-3 Major Goals based on their request.
        3.  Each goal must be a significant milestone (an exam, a project, a personal challenge).
        4.  Set a realistic deadline (as an ISO 8601 date string) for each goal.
        5.  Assign appropriate XP and credit rewards. The total XP for all goals should be significant but not excessive. A good benchmark is that completing all goals might grant the user 1-2 levels. For reference, the total XP for the user to gain the next 6 levels is approximately ${xpForNextSixLevels}.
        6.  For exam-type goals ('Siege'), identify the most relevant 'skillId' from the user's skill list and create a concise 'syllabus'.
        7.  For project-type goals ('Forge'), leave 'skillId' and 'syllabus' empty.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: systemPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['Siege', 'Forge', 'Gauntlet'] },
                        deadline: { type: Type.STRING, description: "An ISO 8601 date string for the deadline." },
                        xp_reward: { type: Type.INTEGER },
                        credit_reward: { type: Type.INTEGER },
                        skillId: { type: Type.STRING },
                        syllabus: { type: Type.STRING },
                    },
                    required: ["title", "description", "type", "deadline", "xp_reward", "credit_reward"]
                }
            }
        }
    });

    return JSON.parse(response.text);
};

// FIX: Implemented missing function to generate story arcs.
export const generateArc = async (prompt: string): Promise<Omit<Arc, 'id' | 'isGenerated'>> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemPrompt = `
        Generate a story Arc for a real-life RPG app based on this user prompt: "${prompt}".
        An Arc is a high-level theme or event that affects the user's game, like a special event.
        It needs a title, description, type, and a list of 2-3 in-game effects.
        Effects should be concise, like "Study XP x1.5" or "Body quests appear more often".
    `;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: systemPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['Exam', 'Fitness', 'Cyber Dungeon'] },
                    effects: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["title", "description", "type", "effects"]
            }
        }
    });
    return JSON.parse(response.text);
};

// FIX: Implemented missing function to generate badges.
export const generateBadge = async (description: string): Promise<Omit<Badge, 'id' | 'isGenerated'>> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const availableIcons = Object.keys(ICON_MAP).join(', ');
    const prompt = `
        Generate a badge for a real-life RPG app based on the following achievement description: "${description}".
        The badge needs a short, catchy name, a concise description, and a suitable icon name.
        Choose the most fitting icon from this list: ${availableIcons}.
    `;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    icon: { type: Type.STRING, enum: Object.keys(ICON_MAP) },
                },
                required: ["name", "description", "icon"]
            }
        }
    });
    return JSON.parse(response.text);
};

// FIX: Implemented missing function to generate store items.
export const generateStoreItem = async (prompt: string, user: User): Promise<Omit<StoreItem, 'id'>> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemPrompt = `
        Design a new item for the store in a real-life RPG app based on this user prompt: "${prompt}".
        The user is level ${user.level_overall}.
        The item should be balanced for their level.
        - Give it a name, description, and category.
        - Assign a fair credit 'cost'. A good benchmark is that daily quests give 5-50 credits.
        - Define its 'effect' by choosing a 'type' and setting 'value', 'duration' (in hours), or 'realms' if applicable.
        - 'realms' should be an array of Realm names if the effect is specific to certain areas of life.
    `;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: systemPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    cost: { type: Type.INTEGER },
                    category: { type: Type.STRING, enum: ['Buff', 'Utility', 'Reward'] },
                    effect: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: ['XP_BOOST', 'STREAK_SAVER', 'QUEST_REROLL', 'INSTANT_STREAK', 'REAL_WORLD_REWARD'] },
                            value: { type: Type.NUMBER },
                            duration: { type: Type.INTEGER },
                            realms: { type: Type.ARRAY, items: { type: Type.STRING, enum: Object.values(Realm) } }
                        },
                        required: ['type']
                    }
                },
                required: ["name", "description", "cost", "category", "effect"]
            }
        }
    });
    return JSON.parse(response.text);
};

// FIX: Implemented missing function to generate skill and topic recommendations.
export const generateRecommendations = async (user: User, majorGoals: MajorGoal[]): Promise<AiRecommendations> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const userProfile = getSanitizedUserForPrompt(user);
    const prompt = `
        Analyze the user's profile and major goals to provide personalized recommendations for growth.
        USER PROFILE: ${JSON.stringify(userProfile, null, 2)}
        MAJOR GOALS: ${JSON.stringify(majorGoals.map(g => ({ title: g.title, description: g.description })), null, 2)}

        INSTRUCTIONS:
        1.  Suggest 2-3 NEW skills the user might be interested in, based on their existing skills and goals. For each skill, provide a 'name', 'realm', and a short 'reason'. Do not suggest skills they already have.
        2.  Suggest 3-5 NEW knowledge topics for their EXISTING skills. These topics should bridge gaps or directly support their major goals. For each topic, provide a 'name', the 'skillId' it belongs to, and a short 'reason'. Do not suggest topics they already have.
    `;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    skills: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                realm: { type: Type.STRING, enum: Object.values(Realm) },
                                reason: { type: Type.STRING }
                            },
                            required: ["name", "realm", "reason"]
                        }
                    },
                    topics: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                skillId: { type: Type.STRING },
                                reason: { type: Type.STRING }
                            },
                            required: ["name", "skillId", "reason"]
                        }
                    }
                },
                required: ["skills", "topics"]
            }
        }
    });
    return JSON.parse(response.text);
};
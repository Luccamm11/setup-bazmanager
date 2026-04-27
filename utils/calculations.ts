import { Skill, KnowledgeTopic, TopicDifficulty } from '../types';
import { getXpThresholdForSkillLevel, TOPIC_XP_MAP } from '../constants';

export const recalculateSkillTree = (
    currentSkillTree: { [id: string]: Skill }, 
    currentKnowledgeBase: { [id: string]: KnowledgeTopic }
): { [id: string]: Skill } => {
    const newSkillTree = JSON.parse(JSON.stringify(currentSkillTree)); // Deep copy
    
    // Group topics by skill
    const topicsBySkill = (Object.values(currentKnowledgeBase) as KnowledgeTopic[]).reduce((acc, topic) => {
        if (!acc[topic.skillId]) acc[topic.skillId] = [];
        acc[topic.skillId].push(topic);
        return acc;
    }, {} as Record<string, KnowledgeTopic[]>);

    for (const skillId in newSkillTree) {
        const skill = newSkillTree[skillId];
        const skillTopics = topicsBySkill[skillId] || [];
        
        // Calculate total XP from topics
        const totalXp = skillTopics.reduce((sum, topic) => sum + (TOPIC_XP_MAP[topic.difficulty] || 0), 0);
        
        let remainingXp = totalXp;
        let newLevel = 1;
        let xpForNextLevel = getXpThresholdForSkillLevel(1, skill.xpScale);

        while (remainingXp >= xpForNextLevel) {
            remainingXp -= xpForNextLevel;
            newLevel++;
            xpForNextLevel = getXpThresholdForSkillLevel(newLevel, skill.xpScale);
        }

        newSkillTree[skillId] = {
            ...skill,
            level: newLevel,
            xp: Math.floor(remainingXp),
            xpToNextLevel: xpForNextLevel,
        };
    }
    return newSkillTree;
};

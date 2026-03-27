import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';

const TECHNICIANS = ['Jonas', 'Gustavo'];
const REDIS_KEY = 'levelup_team_missions';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;

  // --- GET: List team missions ---
  if (method === 'GET') {
    try {
      const { member } = req.query;
      const rawData = await redis.get(REDIS_KEY);
      let missions = rawData ? JSON.parse(rawData) : [];

      // Filter by assigned member if specified
      if (member && typeof member === 'string') {
        missions = missions.filter((m: any) =>
          m.assignedTo.length === 0 || m.assignedTo.includes(member)
        );
      }

      return res.status(200).json({ success: true, missions });
    } catch (error: any) {
      console.error('Error fetching team missions:', error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // --- POST: Create a new team mission (technicians only) ---
  if (method === 'POST') {
    const { username, mission } = req.body;

    if (!username || !TECHNICIANS.includes(username)) {
      return res.status(403).json({ error: 'Apenas técnicos podem criar missões.' });
    }

    if (!mission) {
      return res.status(400).json({ error: 'Mission data is required.' });
    }

    try {
      const rawData = await redis.get(REDIS_KEY);
      const missions = rawData ? JSON.parse(rawData) : [];

      const newMission = {
        ...mission,
        id: `team-mission-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        createdBy: username,
        completedBy: [],
        createdAt: new Date().toISOString(),
      };

      missions.push(newMission);
      await redis.set(REDIS_KEY, JSON.stringify(missions));

      return res.status(201).json({ success: true, mission: newMission });
    } catch (error: any) {
      console.error('Error creating team mission:', error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // --- PUT: Update a team mission (complete or edit) ---
  if (method === 'PUT') {
    const { action, missionId, username } = req.body;

    if (!missionId || !username) {
      return res.status(400).json({ error: 'missionId and username are required.' });
    }

    try {
      const rawData = await redis.get(REDIS_KEY);
      const missions = rawData ? JSON.parse(rawData) : [];
      const missionIndex = missions.findIndex((m: any) => m.id === missionId);

      if (missionIndex === -1) {
        return res.status(404).json({ error: 'Mission not found.' });
      }

      if (action === 'complete') {
        // Mark mission as completed by this user
        if (!missions[missionIndex].completedBy.includes(username)) {
          missions[missionIndex].completedBy.push(username);
        }
      } else if (action === 'edit') {
        // Only technicians can edit
        if (!TECHNICIANS.includes(username)) {
          return res.status(403).json({ error: 'Apenas técnicos podem editar missões.' });
        }
        const { updatedMission } = req.body;
        missions[missionIndex] = { ...missions[missionIndex], ...updatedMission };
      }

      await redis.set(REDIS_KEY, JSON.stringify(missions));
      return res.status(200).json({ success: true, mission: missions[missionIndex] });
    } catch (error: any) {
      console.error('Error updating team mission:', error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // --- DELETE: Remove a team mission (technicians only) ---
  if (method === 'DELETE') {
    const { username, missionId } = req.body;

    if (!username || !TECHNICIANS.includes(username)) {
      return res.status(403).json({ error: 'Apenas técnicos podem deletar missões.' });
    }

    try {
      const rawData = await redis.get(REDIS_KEY);
      let missions = rawData ? JSON.parse(rawData) : [];
      missions = missions.filter((m: any) => m.id !== missionId);
      await redis.set(REDIS_KEY, JSON.stringify(missions));

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error deleting team mission:', error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';
import type { FiveW2HPlan } from '../types';

const TECHNICIANS = ['Jonas', 'Ramon'];
const REDIS_KEY = 'levelup_5w2h_plans';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const loadPlans = async (): Promise<FiveW2HPlan[]> => {
  const raw = await redis.get(REDIS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const savePlans = async (plans: FiveW2HPlan[]) => {
  await redis.set(REDIS_KEY, JSON.stringify(plans));
};

const isTech = (username: string) => TECHNICIANS.includes(username);

// A user can see a plan if:
//  - they created it
//  - they are in assignedTo
//  - they are a technician
const canSee = (plan: FiveW2HPlan, username: string): boolean =>
  isTech(username) ||
  plan.createdBy === username ||
  plan.assignedTo.includes(username);

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;

  // GET /api/5w2h?username=Lucca[&target=Bernardo]
  // - members: get plans visible to them
  // - technicians: with ?target=Username get that user's plans; without = all
  if (method === 'GET') {
    const { username, target } = req.query as Record<string, string>;
    if (!username) return res.status(400).json({ error: 'username required' });

    try {
      const all = await loadPlans();
      let visible: FiveW2HPlan[];

      if (isTech(username)) {
        // Technicians looking at a specific member's board
        visible = target
          ? all.filter(p => canSee(p, target))
          : all;
      } else {
        visible = all.filter(p => canSee(p, username));
      }

      // Sort: pending_review first, then by createdAt desc
      visible.sort((a, b) => {
        if (a.status === 'pending_review' && b.status !== 'pending_review') return -1;
        if (b.status === 'pending_review' && a.status !== 'pending_review') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      return res.status(200).json({ success: true, plans: visible });
    } catch (err: any) {
      console.error('5w2h GET error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // POST /api/5w2h — create plan
  if (method === 'POST') {
    const { username, plan } = req.body;
    if (!username || !plan) return res.status(400).json({ error: 'username and plan required' });

    try {
      const plans = await loadPlans();
      const now = new Date().toISOString();

      const newPlan: FiveW2HPlan = {
        ...plan,
        id: `5w2h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdBy: username,
        status: isTech(username) ? 'approved' : 'pending_review',
        realmRewards: plan.realmRewards ?? [],
        creditReward: plan.creditReward ?? 0,
        createdAt: now,
        updatedAt: now,
      };

      plans.push(newPlan);
      await savePlans(plans);
      return res.status(201).json({ success: true, plan: newPlan });
    } catch (err: any) {
      console.error('5w2h POST error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // PUT /api/5w2h — update status OR technician review OR member edit
  if (method === 'PUT') {
    const { username, planId, action, updates } = req.body;
    if (!username || !planId || !action) {
      return res.status(400).json({ error: 'username, planId and action required' });
    }

    try {
      const plans = await loadPlans();
      const idx = plans.findIndex(p => p.id === planId);
      if (idx === -1) return res.status(404).json({ error: 'Plan not found' });

      const plan = plans[idx];
      const now = new Date().toISOString();

      // action: 'review' — only technicians
      if (action === 'review') {
        if (!isTech(username)) {
          return res.status(403).json({ error: 'Apenas técnicos podem avaliar planos.' });
        }
        plans[idx] = {
          ...plan,
          realmRewards: updates.realmRewards ?? plan.realmRewards,
          creditReward: updates.creditReward ?? plan.creditReward,
          reviewNote: updates.reviewNote ?? '',
          reviewedBy: username,
          reviewedAt: now,
          status: 'approved',
          updatedAt: now,
        };
      }

      // action: 'status' — member progresses their own plan OR tech changes any
      else if (action === 'status') {
        if (!isTech(username) && plan.createdBy !== username) {
          return res.status(403).json({ error: 'Sem permissão.' });
        }
        plans[idx] = { ...plan, status: updates.status, updatedAt: now };
      }

      // action: 'edit' — creator or technician
      else if (action === 'edit') {
        if (!isTech(username) && plan.createdBy !== username) {
          return res.status(403).json({ error: 'Sem permissão.' });
        }
        plans[idx] = {
          ...plan,
          ...updates,
          // Re-send to review if member edits an approved plan
          status: isTech(username) ? plan.status : 'pending_review',
          updatedAt: now,
        };
      }

      else {
        return res.status(400).json({ error: `Unknown action: ${action}` });
      }

      await savePlans(plans);
      return res.status(200).json({ success: true, plan: plans[idx] });
    } catch (err: any) {
      console.error('5w2h PUT error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // DELETE /api/5w2h — creator or technician
  if (method === 'DELETE') {
    const { username, planId } = req.body;
    if (!username || !planId) return res.status(400).json({ error: 'username and planId required' });

    try {
      const plans = await loadPlans();
      const plan = plans.find(p => p.id === planId);
      if (!plan) return res.status(404).json({ error: 'Plan not found' });

      if (!isTech(username) && plan.createdBy !== username) {
        return res.status(403).json({ error: 'Sem permissão.' });
      }

      const filtered = plans.filter(p => p.id !== planId);
      await savePlans(filtered);
      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.error('5w2h DELETE error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}

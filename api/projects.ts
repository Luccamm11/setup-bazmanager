import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';

const TECHNICIANS = ['Jonas', 'Ramon'];
const PROTOTYPES_KEY = 'levelup_prototypes';
const LEGACY_PROJECTS_KEY = 'levelup_projects';
const B_PROJECTS_KEY = 'levelup_b_projects';

const isTech = (username: string) => TECHNICIANS.includes(username);

const getKeyForScope = (scope?: string) => {
  if (scope === 'b_project' || scope === 'b_projects') {
    return B_PROJECTS_KEY;
  }
  return PROTOTYPES_KEY;
};

const loadItems = async (key: string): Promise<any[]> => {
  let raw = await redis.get(key);
  // Fallback for prototypes if old key was used
  if (!raw && key === PROTOTYPES_KEY) {
    raw = await redis.get(LEGACY_PROJECTS_KEY);
  }
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error(`Error parsing data for ${key}:`, err);
    return [];
  }
};

const saveItems = async (key: string, items: any[]): Promise<void> => {
  await redis.set(key, JSON.stringify(items));
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;
  const { scope, type } = req.query as { scope?: string; type?: string };
  const currentScope = scope || type || 'prototype';
  const targetKey = getKeyForScope(currentScope);

  // ─── GET: Listar Itens ──────────────────────────────────────────────────────
  if (method === 'GET') {
    try {
      const items = await loadItems(targetKey);

      items.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      if (currentScope === 'b_project' || currentScope === 'b_projects') {
        return res.status(200).json({ success: true, projects: items });
      }
      return res.status(200).json({ success: true, prototypes: items, projects: items });
    } catch (err: any) {
      console.error(`GET error for ${targetKey}:`, err.message);
      return res.status(500).json({ success: false, error: 'Erro ao buscar dados.' });
    }
  }

  // ─── POST: Criar Item ───────────────────────────────────────────────────────
  if (method === 'POST') {
    const { username, project, prototype, item } = req.body;
    const payload = item || project || prototype;

    if (!username || !payload || (!payload.name && !payload.title)) {
      return res.status(400).json({ success: false, error: 'Dados insuficientes para criação.' });
    }

    try {
      const items = await loadItems(targetKey);
      const now = new Date().toISOString();

      let newItem: any;

      if (currentScope === 'b_project' || currentScope === 'b_projects') {
        newItem = {
          ...payload,
          id: payload.id || `bproj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: (payload.name || payload.title || '').trim(),
          startDate: payload.startDate || '',
          endDate: payload.endDate || '',
          milestones: Array.isArray(payload.milestones) ? payload.milestones : [],
          gameRules: Array.isArray(payload.gameRules) ? payload.gameRules : [],
          strategyDecisions: Array.isArray(payload.strategyDecisions) ? payload.strategyDecisions : [],
          technicalChoices: Array.isArray(payload.technicalChoices) ? payload.technicalChoices : [],
          teamOrganization: Array.isArray(payload.teamOrganization) ? payload.teamOrganization : [],
          schedule: Array.isArray(payload.schedule) ? payload.schedule : [],
          tests: Array.isArray(payload.tests) ? payload.tests : [],
          status: payload.status || 'planning',
          createdBy: username,
          createdAt: now,
          updatedAt: now,
        };
      } else {
        newItem = {
          ...payload,
          id: payload.id || `proto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: (payload.title || payload.name || '').trim(),
          projectType: payload.projectType || 'mechanics',
          objective: payload.objective || '',
          outcome: payload.outcome || 'testing',
          status: payload.status || 'in_progress',
          considerations: payload.considerations || '',
          photos: Array.isArray(payload.photos) ? payload.photos : [],
          members: Array.isArray(payload.members) ? payload.members : [username],
          createdBy: username,
          tags: Array.isArray(payload.tags) ? payload.tags : [],
          createdAt: now,
          updatedAt: now,
        };
      }

      items.push(newItem);
      await saveItems(targetKey, items);

      return res.status(201).json({ success: true, item: newItem, project: newItem, prototype: newItem });
    } catch (err: any) {
      console.error(`POST error for ${targetKey}:`, err.message);
      return res.status(500).json({ success: false, error: 'Erro ao salvar registro.' });
    }
  }

  // ─── PUT: Atualizar Item ────────────────────────────────────────────────────
  if (method === 'PUT') {
    const { username, projectId, prototypeId, itemId, project, prototype, item } = req.body;
    const targetId = itemId || projectId || prototypeId;
    const payload = item || project || prototype;

    if (!username || !targetId || !payload) {
      return res.status(400).json({ success: false, error: 'Dados insuficientes para atualização.' });
    }

    try {
      const items = await loadItems(targetKey);
      const index = items.findIndex(p => p.id === targetId);
      if (index === -1) {
        return res.status(404).json({ success: false, error: 'Registro não encontrado.' });
      }

      const current = items[index];

      // Permissão: Autor, membros envolvidos ou técnicos
      const isMember = Array.isArray(current.members) && current.members.includes(username);
      const isCreator = current.createdBy === username;
      if (!isTech(username) && !isCreator && !isMember) {
        return res.status(403).json({ success: false, error: 'Sem permissão para editar este registro.' });
      }

      const now = new Date().toISOString();
      const updatedItem = {
        ...current,
        ...payload,
        id: current.id,
        createdBy: current.createdBy,
        createdAt: current.createdAt,
        updatedAt: now,
      };

      items[index] = updatedItem;
      await saveItems(targetKey, items);

      return res.status(200).json({ success: true, item: updatedItem, project: updatedItem, prototype: updatedItem });
    } catch (err: any) {
      console.error(`PUT error for ${targetKey}:`, err.message);
      return res.status(500).json({ success: false, error: 'Erro ao atualizar registro.' });
    }
  }

  // ─── DELETE: Remover Item ───────────────────────────────────────────────────
  if (method === 'DELETE') {
    const { username, projectId, prototypeId, itemId } = req.body;
    const targetId = itemId || projectId || prototypeId;

    if (!username || !targetId) {
      return res.status(400).json({ success: false, error: 'Nome de usuário e ID são obrigatórios.' });
    }

    try {
      const items = await loadItems(targetKey);
      const target = items.find(p => p.id === targetId);
      if (!target) {
        return res.status(404).json({ success: false, error: 'Registro não encontrado.' });
      }

      if (!isTech(username) && target.createdBy !== username) {
        return res.status(403).json({ success: false, error: 'Apenas o autor ou técnicos podem excluir este registro.' });
      }

      const filtered = items.filter(p => p.id !== targetId);
      await saveItems(targetKey, filtered);

      return res.status(200).json({ success: true, message: 'Excluído com sucesso.' });
    } catch (err: any) {
      console.error(`DELETE error for ${targetKey}:`, err.message);
      return res.status(500).json({ success: false, error: 'Erro ao excluir registro.' });
    }
  }

  return res.status(405).json({ success: false, error: 'Método não permitido.' });
}

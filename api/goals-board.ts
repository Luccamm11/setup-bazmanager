import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';
import type { GoalsBoardData, GoalCellLog } from '../types.js';
import { INITIAL_GOALS_BOARD_DATA } from '../data/initialGoalsData.js';

const GOALS_BOARD_KEY = 'levelup_goals_board';
const TECHNICIANS = ['Jonas', 'Ramon'];

const isTech = (username: string) => TECHNICIANS.includes(username);

const loadGoalsBoard = async (): Promise<GoalsBoardData> => {
  const raw = await redis.get(GOALS_BOARD_KEY);
  if (!raw) return INITIAL_GOALS_BOARD_DATA;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.categories || !parsed.months) {
      return INITIAL_GOALS_BOARD_DATA;
    }
    return parsed as GoalsBoardData;
  } catch (err) {
    console.error('Error parsing goals board data from DB:', err);
    return INITIAL_GOALS_BOARD_DATA;
  }
};

const saveGoalsBoard = async (data: GoalsBoardData): Promise<void> => {
  await redis.set(GOALS_BOARD_KEY, JSON.stringify(data));
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;

  // GET /api/goals-board - Retorna o estado atual do quadro de metas
  if (method === 'GET') {
    try {
      const data = await loadGoalsBoard();
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      console.error('GoalsBoard GET error:', err.message);
      return res.status(500).json({ success: false, error: 'Erro ao buscar quadro de metas.' });
    }
  }

  // POST /api/goals-board - Atualizar célula ou quadro completo
  if (method === 'POST') {
    const { action, username, data, updateCell, resetToDefault } = req.body;

    if (!username) {
      return res.status(400).json({ success: false, error: 'Username é obrigatório.' });
    }

    try {
      // 1. Resetar para o padrão inicial (exclusivo técnicos)
      if (resetToDefault) {
        if (!isTech(username)) {
          return res.status(403).json({ success: false, error: 'Apenas técnicos podem resetar o quadro de metas.' });
        }
        const resetData: GoalsBoardData = {
          ...INITIAL_GOALS_BOARD_DATA,
          updatedAt: new Date().toISOString(),
          updatedBy: username,
        };
        await saveGoalsBoard(resetData);
        return res.status(200).json({ success: true, data: resetData, message: 'Quadro resetado para o padrão.' });
      }

      // 2. Atualizar célula individual (Previsto ou Realizado)
      if (action === 'updateCell' && updateCell) {
        const { monthId, columnId, fieldType, value, note } = updateCell;

        if (!monthId || !columnId || !fieldType) {
          return res.status(400).json({ success: false, error: 'monthId, columnId e fieldType são obrigatórios.' });
        }

        // Se for edição de "previsto" ou de categorias/metas macro, apenas técnicos
        if (fieldType === 'previsto' && !isTech(username)) {
          return res.status(403).json({ success: false, error: 'Apenas técnicos podem alterar metas previstas.' });
        }

        const current = await loadGoalsBoard();
        const monthIndex = current.months.findIndex(m => m.id === monthId);
        if (monthIndex === -1) {
          return res.status(404).json({ success: false, error: `Mês '${monthId}' não encontrado.` });
        }

        const month = current.months[monthIndex];
        const prevValue = fieldType === 'realizado' ? (month.realizado[columnId] ?? null) : (month.previsto[columnId] ?? null);
        const parsedValue = (value === null || value === '' || isNaN(Number(value))) ? null : Number(value);

        if (fieldType === 'realizado') {
          month.realizado[columnId] = parsedValue;
        } else {
          month.previsto[columnId] = parsedValue;
        }

        // Registrar log de auditoria
        if (!month.logs) month.logs = {};
        if (!month.logs[columnId]) month.logs[columnId] = [];

        const newLog: GoalCellLog = {
          id: `log-${Date.now()}`,
          username,
          previousValue: prevValue,
          newValue: parsedValue,
          timestamp: new Date().toISOString(),
          note: note ? String(note).trim() : undefined,
        };
        month.logs[columnId].unshift(newLog);

        current.months[monthIndex] = month;
        current.updatedAt = new Date().toISOString();
        current.updatedBy = username;

        await saveGoalsBoard(current);
        return res.status(200).json({ success: true, data: current });
      }

      // 3. Salvar quadro completo
      if (data && typeof data === 'object') {
        // Se for alterar estrutura de categorias ou metas macro, apenas técnicos
        if (!isTech(username)) {
          // Membros só podem enviar atualizações de dados de 'realizado'
          const current = await loadGoalsBoard();
          current.months = data.months || current.months;
          current.updatedAt = new Date().toISOString();
          current.updatedBy = username;
          await saveGoalsBoard(current);
          return res.status(200).json({ success: true, data: current });
        }

        const updatedData: GoalsBoardData = {
          ...data,
          updatedAt: new Date().toISOString(),
          updatedBy: username,
        };
        await saveGoalsBoard(updatedData);
        return res.status(200).json({ success: true, data: updatedData });
      }

      return res.status(400).json({ success: false, error: 'Ação ou payload inválido.' });
    } catch (err: any) {
      console.error('GoalsBoard POST error:', err.message);
      return res.status(500).json({ success: false, error: 'Erro ao salvar quadro de metas.', details: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}

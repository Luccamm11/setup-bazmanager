import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';
import type { CompetitionData, CompetitionEvent, MatchRecord } from '../types.js';
import { INITIAL_COMPETITIONS_DATA } from '../data/initialCompetitionsData.js';

const COMPETITIONS_KEY = 'levelup_competitions_data';

const loadCompetitionsData = async (): Promise<CompetitionData> => {
  const raw = await redis.get(COMPETITIONS_KEY);
  if (!raw) return INITIAL_COMPETITIONS_DATA;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.events)) {
      return INITIAL_COMPETITIONS_DATA;
    }
    return parsed as CompetitionData;
  } catch (err) {
    console.error('Error parsing competitions data from DB:', err);
    return INITIAL_COMPETITIONS_DATA;
  }
};

const saveCompetitionsData = async (data: CompetitionData): Promise<void> => {
  await redis.set(COMPETITIONS_KEY, JSON.stringify(data));
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;

  // GET /api/competitions - Retorna todos os eventos e checklists
  if (method === 'GET') {
    try {
      const data = await loadCompetitionsData();
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      console.error('Competitions GET error:', err.message);
      return res.status(500).json({ success: false, error: 'Erro ao buscar dados das competições.' });
    }
  }

  // POST /api/competitions - Modificações de eventos e checklists
  if (method === 'POST') {
    const { action, username, data, eventId, payload } = req.body;

    if (!username) {
      return res.status(400).json({ success: false, error: 'Username é obrigatório.' });
    }

    try {
      const current = await loadCompetitionsData();

      // 1. Salvar todo o estado
      if (action === 'save_all' && data) {
        const updatedData: CompetitionData = {
          ...data,
          updatedAt: new Date().toISOString(),
          updatedBy: username,
        };
        await saveCompetitionsData(updatedData);
        return res.status(200).json({ success: true, data: updatedData });
      }

      // 2. Definir evento ativo
      if (action === 'set_active_event' && eventId) {
        current.activeEventId = eventId;
        current.updatedAt = new Date().toISOString();
        current.updatedBy = username;
        await saveCompetitionsData(current);
        return res.status(200).json({ success: true, data: current });
      }

      // 3. Criar ou editar evento
      if (action === 'save_event' && payload) {
        const incomingEvent: CompetitionEvent = payload;
        const existingIndex = current.events.findIndex(e => e.id === incomingEvent.id);

        if (existingIndex >= 0) {
          current.events[existingIndex] = {
            ...current.events[existingIndex],
            ...incomingEvent,
            updatedAt: new Date().toISOString(),
          };
        } else {
          current.events.unshift({
            ...incomingEvent,
            createdAt: new Date().toISOString(),
            createdBy: username,
            updatedAt: new Date().toISOString(),
          });
          current.activeEventId = incomingEvent.id;
        }

        current.updatedAt = new Date().toISOString();
        current.updatedBy = username;
        await saveCompetitionsData(current);
        return res.status(200).json({ success: true, data: current });
      }

      // 4. Deletar evento
      if (action === 'delete_event' && eventId) {
        current.events = current.events.filter(e => e.id !== eventId);
        if (current.activeEventId === eventId) {
          current.activeEventId = current.events.length > 0 ? current.events[0].id : null;
        }
        current.updatedAt = new Date().toISOString();
        current.updatedBy = username;
        await saveCompetitionsData(current);
        return res.status(200).json({ success: true, data: current });
      }

      // Para ações internas no evento ativo
      const targetEventId = eventId || current.activeEventId;
      const targetEvent = current.events.find(e => e.id === targetEventId);

      if (!targetEvent) {
        return res.status(404).json({ success: false, error: 'Evento não encontrado.' });
      }

      // 5. Viagem Ida: alternar item
      if (action === 'toggle_departure_item') {
        const { itemId, packed } = payload;
        const item = targetEvent.travelChecklist.departureItems.find(i => i.id === itemId);
        if (item) {
          item.packed = packed !== undefined ? packed : !item.packed;
          item.packedBy = item.packed ? username : undefined;
          item.packedAt = item.packed ? new Date().toISOString() : undefined;
        }
      }

      // 6. Viagem Ida: adicionar item
      else if (action === 'add_departure_item') {
        const newItem = {
          ...payload,
          id: `dep-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          packed: false,
        };
        targetEvent.travelChecklist.departureItems.push(newItem);
        if (!targetEvent.travelChecklist.departureCategories.includes(newItem.category)) {
          targetEvent.travelChecklist.departureCategories.push(newItem.category);
        }
      }

      // 7. Viagem Ida: excluir item
      else if (action === 'delete_departure_item') {
        const { itemId } = payload;
        targetEvent.travelChecklist.departureItems = targetEvent.travelChecklist.departureItems.filter(i => i.id !== itemId);
      }

      // 8. Viagem Volta: Sincronizar da Ida
      else if (action === 'sync_return_from_departure') {
        // Pega todos os itens da ida que foram marcados ou todos os itens da ida
        const existingAcquired = targetEvent.travelChecklist.returnItems.filter(i => i.origin === 'acquired_at_event');
        const departureMapped = targetEvent.travelChecklist.departureItems.map(dep => {
          const existingReturn = targetEvent.travelChecklist.returnItems.find(r => r.name.toLowerCase() === dep.name.toLowerCase());
          return {
            id: existingReturn ? existingReturn.id : `ret-${dep.id}`,
            name: dep.name,
            category: dep.category,
            quantity: dep.quantity,
            origin: 'departure' as const,
            packed: existingReturn ? existingReturn.packed : false,
            packedBy: existingReturn ? existingReturn.packedBy : undefined,
            packedAt: existingReturn ? existingReturn.packedAt : undefined,
            notes: dep.notes,
          };
        });

        targetEvent.travelChecklist.returnItems = [...departureMapped, ...existingAcquired];
      }

      // 9. Viagem Volta: alternar item
      else if (action === 'toggle_return_item') {
        const { itemId, packed } = payload;
        const item = targetEvent.travelChecklist.returnItems.find(i => i.id === itemId);
        if (item) {
          item.packed = packed !== undefined ? packed : !item.packed;
          item.packedBy = item.packed ? username : undefined;
          item.packedAt = item.packed ? new Date().toISOString() : undefined;
        }
      }

      // 10. Viagem Volta: adicionar item (especialmente itens adquiridos lá)
      else if (action === 'add_return_item') {
        const newItem = {
          ...payload,
          id: `ret-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          origin: payload.origin || 'acquired_at_event',
          packed: false,
        };
        targetEvent.travelChecklist.returnItems.push(newItem);
      }

      // 11. Viagem Volta: excluir item
      else if (action === 'delete_return_item') {
        const { itemId } = payload;
        targetEvent.travelChecklist.returnItems = targetEvent.travelChecklist.returnItems.filter(i => i.id !== itemId);
      }

      // 12. Saída do Hotel: alternar item
      else if (action === 'toggle_hotel_item') {
        const { itemId, completed } = payload;
        const item = targetEvent.matchesChecklist.hotelDepartureChecklist.find(i => i.id === itemId);
        if (item) {
          item.completed = completed !== undefined ? completed : !item.completed;
          item.completedBy = item.completed ? username : undefined;
          item.completedAt = item.completed ? new Date().toISOString() : undefined;
        }
      }

      // 13. Saída do Hotel: adicionar item
      else if (action === 'add_hotel_item') {
        const newItem = {
          ...payload,
          id: `hotel-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          completed: false,
        };
        targetEvent.matchesChecklist.hotelDepartureChecklist.push(newItem);
      }

      // 14. Saída do Hotel: excluir item
      else if (action === 'delete_hotel_item') {
        const { itemId } = payload;
        targetEvent.matchesChecklist.hotelDepartureChecklist = targetEvent.matchesChecklist.hotelDepartureChecklist.filter(i => i.id !== itemId);
      }

      // 15. Partida: Salvar Match (Pré ou Pós-Match)
      else if (action === 'save_match') {
        const matchData: MatchRecord = payload;
        const matchIndex = targetEvent.matchesChecklist.matches.findIndex(m => m.id === matchData.id);
        if (matchIndex >= 0) {
          targetEvent.matchesChecklist.matches[matchIndex] = matchData;
        } else {
          targetEvent.matchesChecklist.matches.unshift({
            ...matchData,
            createdAt: new Date().toISOString(),
            createdBy: username,
          });
        }
      }

      // 16. Partida: Deletar Match
      else if (action === 'delete_match') {
        const { matchId } = payload;
        targetEvent.matchesChecklist.matches = targetEvent.matchesChecklist.matches.filter(m => m.id !== matchId);
      } else {
        return res.status(400).json({ success: false, error: `Ação desconhecida: ${action}` });
      }

      targetEvent.updatedAt = new Date().toISOString();
      current.updatedAt = new Date().toISOString();
      current.updatedBy = username;

      await saveCompetitionsData(current);
      return res.status(200).json({ success: true, data: current });
    } catch (err: any) {
      console.error('Competitions POST error:', err.message);
      return res.status(500).json({ success: false, error: 'Falha ao processar atualização da competição.' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

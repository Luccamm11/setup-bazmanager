import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';
import type { FormRecord, AutonomousDevForm, CollectiveEvolutionForm, ActivityEvaluation } from '../types.js';
import { notifyTechniciansOnActivityCreated, applyActivityEvaluation } from './_lib/evaluationHelper.js';

const FORMS_KEY = 'levelup_forms_records';
const TECHNICIANS = ['Jonas', 'Ramon'];

const isTech = (username: string) => TECHNICIANS.includes(username);

const loadForms = async (): Promise<FormRecord[]> => {
  const raw = await redis.get(FORMS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error parsing forms data:', err);
    return [];
  }
};

const saveForms = async (forms: FormRecord[]): Promise<void> => {
  await redis.set(FORMS_KEY, JSON.stringify(forms));
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;

  // GET /api/forms - Retorna todos os formulários ordenados por data mais recente
  if (method === 'GET') {
    try {
      const forms = await loadForms();

      // Ordenação decrescente por data ou data de criação
      forms.sort((a, b) => {
        const timeA = new Date(a.date || a.createdAt).getTime();
        const timeB = new Date(b.date || b.createdAt).getTime();
        return timeB - timeA;
      });

      return res.status(200).json({ success: true, forms });
    } catch (err: any) {
      console.error('Forms GET error:', err.message);
      return res.status(500).json({ success: false, error: 'Erro ao buscar formulários.' });
    }
  }

  // POST /api/forms - Criar novo formulário ou executar ações
  if (method === 'POST') {
    const { action, username, form, formId, evaluation } = req.body;

    // Se for ação de avaliação (exclusivo para técnicos)
    if (action === 'evaluateForm') {
      if (!username || !formId || !evaluation) {
        return res.status(400).json({ success: false, error: 'Usuário, ID do formulário e dados de avaliação são obrigatórios.' });
      }

      if (!isTech(username)) {
        return res.status(403).json({ success: false, error: 'Apenas técnicos podem avaliar formulários.' });
      }

      try {
        const forms = await loadForms();
        const index = forms.findIndex(f => f.id === formId);
        if (index === -1) {
          return res.status(404).json({ success: false, error: 'Formulário não encontrado.' });
        }

        const existing = forms[index];
        const prevEvaluation = existing.evaluation;

        const newEvaluation: ActivityEvaluation = {
          id: evaluation.id || `eval-${Date.now()}`,
          evaluatedBy: username,
          evaluatedAt: new Date().toISOString(),
          memberScores: evaluation.memberScores || {},
          generalNotes: evaluation.generalNotes ? evaluation.generalNotes.trim() : undefined,
        };

        existing.evaluation = newEvaluation;
        existing.updatedAt = new Date().toISOString();
        forms[index] = existing;

        await saveForms(forms);

        const activityTitle = existing.type === 'autonomous_dev' 
          ? (existing as AutonomousDevForm).courseName 
          : `Reunião c/ ${(existing as CollectiveEvolutionForm).invitedTeam}`;

        await applyActivityEvaluation({
          evaluation: newEvaluation,
          activityTitle,
          activityType: existing.type,
          previousEvaluation: prevEvaluation,
        });

        return res.status(200).json({ success: true, form: existing, evaluation: newEvaluation });
      } catch (err: any) {
        console.error('Forms EVALUATE error:', err.message);
        return res.status(500).json({ success: false, error: 'Erro ao processar avaliação.' });
      }
    }

    // Se for ação de delete via POST
    if (action === 'deleteForm') {
      if (!username || !formId) {
        return res.status(400).json({ success: false, error: 'Usuário e ID do formulário são obrigatórios.' });
      }

      try {
        const forms = await loadForms();
        const index = forms.findIndex(f => f.id === formId);
        if (index === -1) {
          return res.status(404).json({ success: false, error: 'Formulário não encontrado.' });
        }

        const existing = forms[index];
        if (existing.createdBy !== username && !isTech(username)) {
          return res.status(403).json({ success: false, error: 'Sem permissão para excluir este formulário.' });
        }

        forms.splice(index, 1);
        await saveForms(forms);

        return res.status(200).json({ success: true, message: 'Formulário excluído com sucesso.' });
      } catch (err: any) {
        console.error('Forms DELETE error:', err.message);
        return res.status(500).json({ success: false, error: 'Erro ao excluir formulário.' });
      }
    }

    // Se for ação de update via POST
    if (action === 'updateForm') {
      if (!username || !formId || !form) {
        return res.status(400).json({ success: false, error: 'Dados incompletos para atualização.' });
      }

      try {
        const forms = await loadForms();
        const index = forms.findIndex(f => f.id === formId);
        if (index === -1) {
          return res.status(404).json({ success: false, error: 'Formulário não encontrado.' });
        }

        const existing = forms[index];
        if (existing.createdBy !== username && !isTech(username)) {
          return res.status(403).json({ success: false, error: 'Sem permissão para editar este formulário.' });
        }

        const now = new Date().toISOString();
        const updatedForm: FormRecord = {
          ...existing,
          ...form,
          id: existing.id,
          type: existing.type,
          createdBy: existing.createdBy,
          createdAt: existing.createdAt,
          updatedAt: now,
        };

        forms[index] = updatedForm;
        await saveForms(forms);

        return res.status(200).json({ success: true, form: updatedForm });
      } catch (err: any) {
        console.error('Forms UPDATE error:', err.message);
        return res.status(500).json({ success: false, error: 'Erro ao atualizar formulário.' });
      }
    }

    // Criação padrão de formulário
    if (!username || !form || !form.type) {
      return res.status(400).json({ success: false, error: 'Nome de usuário e dados do formulário são obrigatórios.' });
    }

    try {
      const forms = await loadForms();
      const now = new Date().toISOString();
      const newId = `form-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      let newForm: FormRecord;
      let activityTitle = '';

      if (form.type === 'autonomous_dev') {
        activityTitle = (form.courseName || '').trim();
        const autoForm: AutonomousDevForm = {
          id: newId,
          type: 'autonomous_dev',
          date: form.date || now.split('T')[0],
          workloadHours: Number(form.workloadHours) || 0,
          courseName: activityTitle,
          courseUrl: (form.courseUrl || '').trim() || undefined,
          certificateUrl: (form.certificateUrl || '').trim() || undefined,
          participants: Array.isArray(form.participants) && form.participants.length > 0 ? form.participants : [username],
          courseObjectives: (form.courseObjectives || '').trim(),
          courseSyllabus: (form.courseSyllabus || '').trim(),
          keyLearnings: (form.keyLearnings || '').trim(),
          createdBy: username,
          createdAt: now,
          updatedAt: now,
        };
        newForm = autoForm;
      } else if (form.type === 'collective_evolution') {
        activityTitle = `Reunião c/ ${(form.invitedTeam || '').trim()}`;
        const collectiveForm: CollectiveEvolutionForm = {
          id: newId,
          type: 'collective_evolution',
          date: form.date || now.split('T')[0],
          workloadHours: Number(form.workloadHours) || 0,
          invitedTeam: (form.invitedTeam || '').trim(),
          participants: Array.isArray(form.participants) && form.participants.length > 0 ? form.participants : [username],
          meetingObjectives: (form.meetingObjectives || '').trim(),
          solutionsFound: (form.solutionsFound || '').trim(),
          nextSteps: (form.nextSteps || '').trim(),
          createdBy: username,
          createdAt: now,
          updatedAt: now,
        };
        newForm = collectiveForm;
      } else {
        return res.status(400).json({ success: false, error: 'Tipo de formulário inválido.' });
      }

      forms.push(newForm);
      await saveForms(forms);

      // Notificar técnicos sobre a nova atividade criada
      await notifyTechniciansOnActivityCreated({
        activityTitle,
        activityType: form.type,
        author: username,
        activityId: newId,
      });

      return res.status(201).json({ success: true, form: newForm });
    } catch (err: any) {
      console.error('Forms POST error:', err.message);
      return res.status(500).json({ success: false, error: 'Erro ao salvar formulário.' });
    }
  }

  // PUT /api/forms - Atualizar formulário
  if (method === 'PUT') {
    const { username, formId, form } = req.body;
    if (!username || !formId || !form) {
      return res.status(400).json({ success: false, error: 'Dados insuficientes para atualização.' });
    }

    try {
      const forms = await loadForms();
      const index = forms.findIndex(f => f.id === formId);
      if (index === -1) {
        return res.status(404).json({ success: false, error: 'Formulário não encontrado.' });
      }

      const existing = forms[index];
      if (existing.createdBy !== username && !isTech(username)) {
        return res.status(403).json({ success: false, error: 'Sem permissão para editar este formulário.' });
      }

      const now = new Date().toISOString();
      const updatedForm: FormRecord = {
        ...existing,
        ...form,
        id: existing.id,
        type: existing.type,
        createdBy: existing.createdBy,
        createdAt: existing.createdAt,
        updatedAt: now,
      };

      forms[index] = updatedForm;
      await saveForms(forms);

      return res.status(200).json({ success: true, form: updatedForm });
    } catch (err: any) {
      console.error('Forms PUT error:', err.message);
      return res.status(500).json({ success: false, error: 'Erro ao atualizar formulário.' });
    }
  }

  // DELETE /api/forms - Excluir formulário
  if (method === 'DELETE') {
    const { username, formId } = req.body || req.query;
    if (!username || !formId) {
      return res.status(400).json({ success: false, error: 'Usuário e ID do formulário são obrigatórios.' });
    }

    try {
      const forms = await loadForms();
      const index = forms.findIndex(f => f.id === formId);
      if (index === -1) {
        return res.status(404).json({ success: false, error: 'Formulário não encontrado.' });
      }

      const existing = forms[index];
      if (existing.createdBy !== username && !isTech(username)) {
        return res.status(403).json({ success: false, error: 'Sem permissão para excluir este formulário.' });
      }

      forms.splice(index, 1);
      await saveForms(forms);

      return res.status(200).json({ success: true, message: 'Formulário excluído com sucesso.' });
    } catch (err: any) {
      console.error('Forms DELETE error:', err.message);
      return res.status(500).json({ success: false, error: 'Erro ao excluir formulário.' });
    }
  }

  return res.status(405).json({ success: false, error: 'Método não permitido.' });
}

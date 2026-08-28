import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';
import { Mentor, MentorshipRecord, VolunteerWork, ActivityEvaluation } from '../types';
import { notifyTechniciansOnActivityCreated, applyActivityEvaluation } from './_lib/evaluationHelper.js';

const TECHNICIANS = ['Jonas', 'Ramon'];
const MENTORS_KEY = 'levelup_mentors';
const RECORDS_KEY = 'levelup_mentorship_records';
const VOLUNTEER_WORKS_KEY = 'levelup_volunteer_works';

async function getMentors(): Promise<Mentor[]> {
  const raw = await redis.get(MENTORS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveMentors(mentors: Mentor[]) {
  await redis.set(MENTORS_KEY, JSON.stringify(mentors));
}

async function getRecords(): Promise<MentorshipRecord[]> {
  const raw = await redis.get(RECORDS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveRecords(records: MentorshipRecord[]) {
  await redis.set(RECORDS_KEY, JSON.stringify(records));
}

async function getVolunteerWorks(): Promise<VolunteerWork[]> {
  const raw = await redis.get(VOLUNTEER_WORKS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveVolunteerWorks(works: VolunteerWork[]) {
  await redis.set(VOLUNTEER_WORKS_KEY, JSON.stringify(works));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET — Fetch all mentors, mentorship records, and volunteer works
  if (req.method === 'GET') {
    try {
      const mentors = await getMentors();
      const records = await getRecords();
      const volunteerWorks = await getVolunteerWorks();
      return res.status(200).json({ success: true, mentors, records, volunteerWorks });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST — Handle modifications (actions)
  if (req.method === 'POST') {
    const { action } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Ação não especificada.' });
    }

    try {
      if (action === 'addMentor') {
        const { name, area, organization, role } = req.body;
        if (!name || !area) {
          return res.status(400).json({ error: 'Nome e Área são obrigatórios.' });
        }
        const mentors = await getMentors();
        const newMentor: Mentor = {
          id: `mentor-${Date.now()}`,
          name: name.trim(),
          area: area.trim(),
          organization: organization ? organization.trim() : undefined,
          active: true,
          role: role || 'mentor',
        };
        mentors.push(newMentor);
        await saveMentors(mentors);
        return res.status(201).json({ success: true, mentor: newMentor });
      }

      if (action === 'editMentor') {
        const { id, name, area, organization, active, role } = req.body;
        if (!id) return res.status(400).json({ error: 'ID do mentor é obrigatório.' });

        const mentors = await getMentors();
        const idx = mentors.findIndex(m => m.id === id);
        if (idx === -1) return res.status(404).json({ error: 'Mentor não encontrado.' });

        if (name !== undefined) mentors[idx].name = name.trim();
        if (area !== undefined) mentors[idx].area = area.trim();
        if (organization !== undefined) mentors[idx].organization = organization ? organization.trim() : undefined;
        if (active !== undefined) mentors[idx].active = active;
        if (role !== undefined) mentors[idx].role = role;

        await saveMentors(mentors);
        return res.status(200).json({ success: true, mentor: mentors[idx] });
      }

      if (action === 'deleteMentor') {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'ID do mentor é obrigatório.' });

        const mentors = await getMentors();
        const updated = mentors.filter(m => m.id !== id);
        await saveMentors(updated);
        return res.status(200).json({ success: true });
      }

      if (action === 'addRecord') {
        const { mentorId, mentorName, date, workloadHours, participants, objectives, solutions, nextSteps, area, imageLinks, createdBy } = req.body;
        if (!date || !participants || participants.length === 0 || !objectives || !solutions || !nextSteps) {
          return res.status(400).json({ error: 'Dados obrigatórios do formulário de mentoria ausentes (data, participantes, objetivos, soluções e próximos passos).' });
        }
        const records = await getRecords();
        const mentors = await getMentors();
        let targetMentor = mentorId ? mentors.find(m => m.id === mentorId) : undefined;

        // Se foi passado mentorName mas não mentorId, tentar encontrar ou criar mentor
        let finalMentorId = mentorId;
        let finalMentorName = mentorName ? mentorName.trim() : (targetMentor ? targetMentor.name : 'Mentor Convidado');

        if (!targetMentor && mentorName && mentorName.trim()) {
          const existingByName = mentors.find(m => m.name.toLowerCase() === mentorName.trim().toLowerCase());
          if (existingByName) {
            targetMentor = existingByName;
            finalMentorId = existingByName.id;
            finalMentorName = existingByName.name;
          } else {
            // Criação automática do mentor se não existir
            const newMentor: Mentor = {
              id: `mentor-${Date.now()}`,
              name: mentorName.trim(),
              area: area ? area.trim() : 'Mentoria Técnica B-LEED',
              active: true,
              role: 'mentor',
            };
            mentors.push(newMentor);
            await saveMentors(mentors);
            targetMentor = newMentor;
            finalMentorId = newMentor.id;
          }
        }

        const now = new Date().toISOString();
        const newRecord: MentorshipRecord = {
          id: `record-${Date.now()}`,
          mentorId: finalMentorId,
          mentorName: finalMentorName,
          date,
          workloadHours: workloadHours ? Number(workloadHours) : 2,
          participants: Array.isArray(participants) ? participants : [participants],
          objectives: objectives.trim(),
          solutions: solutions.trim(),
          nextSteps: nextSteps.trim(),
          area: area ? area.trim() : (targetMentor?.area || 'Geral'),
          imageLinks: Array.isArray(imageLinks) ? imageLinks : [],
          createdAt: now,
          updatedAt: now,
          createdBy: createdBy || (Array.isArray(participants) && participants[0]) || 'Membro',
        };
        records.push(newRecord);
        await saveRecords(records);

        // Notificar técnicos sobre a nova mentoria cadastrada
        const author = createdBy || (Array.isArray(participants) && participants[0]) || 'Membro';
        const activityTitle = `Mentoria com ${finalMentorName}`;

        await notifyTechniciansOnActivityCreated({
          activityTitle,
          activityType: 'mentorship',
          author,
          activityId: newRecord.id,
        });

        return res.status(201).json({ success: true, record: newRecord });
      }

      if (action === 'evaluateRecord') {
        const { username, recordId, evaluation } = req.body;
        if (!username || !recordId || !evaluation) {
          return res.status(400).json({ error: 'Usuário, ID do registro e dados de avaliação são obrigatórios.' });
        }

        if (!TECHNICIANS.includes(username)) {
          return res.status(403).json({ error: 'Apenas técnicos podem avaliar mentorias.' });
        }

        const records = await getRecords();
        const idx = records.findIndex(r => r.id === recordId);
        if (idx === -1) return res.status(404).json({ error: 'Registro de mentoria não encontrado.' });

        const prevEvaluation = records[idx].evaluation;
        const newEvaluation: ActivityEvaluation = {
          id: evaluation.id || `eval-${Date.now()}`,
          evaluatedBy: username,
          evaluatedAt: new Date().toISOString(),
          memberScores: evaluation.memberScores || {},
          generalNotes: evaluation.generalNotes ? evaluation.generalNotes.trim() : undefined,
        };

        records[idx].evaluation = newEvaluation;
        records[idx].updatedAt = new Date().toISOString();
        await saveRecords(records);

        const activityTitle = `Mentoria com ${records[idx].mentorName || 'Mentor'}`;

        await applyActivityEvaluation({
          evaluation: newEvaluation,
          activityTitle,
          activityType: 'mentorship',
          previousEvaluation: prevEvaluation,
        });

        return res.status(200).json({ success: true, record: records[idx], evaluation: newEvaluation });
      }

      if (action === 'editRecord') {
        const { id, mentorId, mentorName, date, workloadHours, participants, objectives, solutions, nextSteps, area, imageLinks } = req.body;
        if (!id) return res.status(400).json({ error: 'ID do registro é obrigatório.' });

        const records = await getRecords();
        const idx = records.findIndex(r => r.id === id);
        if (idx === -1) return res.status(404).json({ error: 'Registro de mentoria não encontrado.' });

        if (mentorId !== undefined) records[idx].mentorId = mentorId;
        if (mentorName !== undefined) records[idx].mentorName = mentorName.trim();
        if (date !== undefined) records[idx].date = date;
        if (workloadHours !== undefined) records[idx].workloadHours = Number(workloadHours);
        if (participants !== undefined) records[idx].participants = participants;
        if (objectives !== undefined) records[idx].objectives = objectives.trim();
        if (solutions !== undefined) records[idx].solutions = solutions.trim();
        if (nextSteps !== undefined) records[idx].nextSteps = nextSteps.trim();
        if (area !== undefined) records[idx].area = area.trim();
        if (imageLinks !== undefined) records[idx].imageLinks = Array.isArray(imageLinks) ? imageLinks : [];
        records[idx].updatedAt = new Date().toISOString();

        await saveRecords(records);
        return res.status(200).json({ success: true, record: records[idx] });
      }

      if (action === 'deleteRecord') {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'ID do registro é obrigatório.' });

        const records = await getRecords();
        const updated = records.filter(r => r.id !== id);
        await saveRecords(updated);
        return res.status(200).json({ success: true });
      }

      // ─── Volunteer Works ────────────────────────────────────────────────────

      if (action === 'addVolunteerWork') {
        const { eventName, location, date, description, contributions, imageLinks } = req.body;
        if (!eventName || !date || !contributions || contributions.length === 0) {
          return res.status(400).json({ error: 'Evento, data e pelo menos um voluntário são obrigatórios.' });
        }
        const works = await getVolunteerWorks();
        const newWork: VolunteerWork = {
          id: `vwork-${Date.now()}`,
          eventName: eventName.trim(),
          location: location ? location.trim() : '',
          date,
          description: description ? description.trim() : '',
          contributions,
          imageLinks: Array.isArray(imageLinks) ? imageLinks : [],
        };
        works.push(newWork);
        await saveVolunteerWorks(works);
        return res.status(201).json({ success: true, work: newWork });
      }

      if (action === 'editVolunteerWork') {
        const { id, eventName, location, date, description, contributions, imageLinks } = req.body;
        if (!id) return res.status(400).json({ error: 'ID do trabalho é obrigatório.' });

        const works = await getVolunteerWorks();
        const idx = works.findIndex(w => w.id === id);
        if (idx === -1) return res.status(404).json({ error: 'Trabalho voluntário não encontrado.' });

        if (eventName !== undefined) works[idx].eventName = eventName.trim();
        if (location !== undefined) works[idx].location = location.trim();
        if (date !== undefined) works[idx].date = date;
        if (description !== undefined) works[idx].description = description.trim();
        if (contributions !== undefined) works[idx].contributions = contributions;
        if (imageLinks !== undefined) works[idx].imageLinks = Array.isArray(imageLinks) ? imageLinks : [];

        await saveVolunteerWorks(works);
        return res.status(200).json({ success: true, work: works[idx] });
      }

      if (action === 'deleteVolunteerWork') {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'ID do trabalho é obrigatório.' });

        const works = await getVolunteerWorks();
        const updated = works.filter(w => w.id !== id);
        await saveVolunteerWorks(updated);
        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: 'Ação inválida.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}

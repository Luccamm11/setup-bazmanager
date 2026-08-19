import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';
import type { ProjectItem } from '../types.js';

const TECHNICIANS = ['Jonas', 'Ramon'];
const PROJECTS_KEY = 'levelup_projects';

const isTech = (username: string) => TECHNICIANS.includes(username);

const loadProjects = async (): Promise<ProjectItem[]> => {
  const raw = await redis.get(PROJECTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error parsing projects data:', err);
    return [];
  }
};

const saveProjects = async (projects: ProjectItem[]): Promise<void> => {
  await redis.set(PROJECTS_KEY, JSON.stringify(projects));
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;

  // GET /api/projects - Lista todos os projetos ordenados por data
  if (method === 'GET') {
    try {
      const projects = await loadProjects();
      
      // Ordenação: mais recentes primeiro
      projects.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        return timeB - timeA;
      });

      return res.status(200).json({ success: true, projects });
    } catch (err: any) {
      console.error('Projects GET error:', err.message);
      return res.status(500).json({ success: false, error: 'Erro ao buscar projetos.' });
    }
  }

  // POST /api/projects - Criar novo projeto
  if (method === 'POST') {
    const { username, project } = req.body;
    if (!username || !project || !project.title) {
      return res.status(400).json({ success: false, error: 'Nome de usuário e dados do projeto são obrigatórios.' });
    }

    try {
      const projects = await loadProjects();
      const now = new Date().toISOString();

      const newProject: ProjectItem = {
        ...project,
        id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: project.title.trim(),
        projectType: project.projectType || 'mechanics',
        objective: project.objective || '',
        outcome: project.outcome || 'testing',
        status: project.status || 'in_progress',
        considerations: project.considerations || '',
        photos: Array.isArray(project.photos) ? project.photos : [],
        members: Array.isArray(project.members) ? project.members : [username],
        createdBy: username,
        tags: Array.isArray(project.tags) ? project.tags : [],
        createdAt: now,
        updatedAt: now,
      };

      projects.push(newProject);
      await saveProjects(projects);

      return res.status(201).json({ success: true, project: newProject });
    } catch (err: any) {
      console.error('Projects POST error:', err.message);
      return res.status(500).json({ success: false, error: 'Erro ao salvar projeto.' });
    }
  }

  // PUT /api/projects - Atualizar projeto existente
  if (method === 'PUT') {
    const { username, projectId, project } = req.body;
    if (!username || !projectId || !project) {
      return res.status(400).json({ success: false, error: 'Dados insuficientes para atualização.' });
    }

    try {
      const projects = await loadProjects();
      const index = projects.findIndex(p => p.id === projectId);
      if (index === -1) {
        return res.status(404).json({ success: false, error: 'Projeto não encontrado.' });
      }

      const current = projects[index];

      // Permissão: Autor, membros listados no projeto ou técnicos
      const isMember = Array.isArray(current.members) && current.members.includes(username);
      const isCreator = current.createdBy === username;
      if (!isTech(username) && !isCreator && !isMember) {
        return res.status(403).json({ success: false, error: 'Sem permissão para editar este projeto.' });
      }

      const now = new Date().toISOString();
      const updatedProject: ProjectItem = {
        ...current,
        ...project,
        id: current.id,
        createdBy: current.createdBy,
        createdAt: current.createdAt,
        updatedAt: now,
        photos: Array.isArray(project.photos) ? project.photos : current.photos,
        members: Array.isArray(project.members) ? project.members : current.members,
      };

      projects[index] = updatedProject;
      await saveProjects(projects);

      return res.status(200).json({ success: true, project: updatedProject });
    } catch (err: any) {
      console.error('Projects PUT error:', err.message);
      return res.status(500).json({ success: false, error: 'Erro ao atualizar projeto.' });
    }
  }

  // DELETE /api/projects - Remover projeto
  if (method === 'DELETE') {
    const { username, projectId } = req.body;
    if (!username || !projectId) {
      return res.status(400).json({ success: false, error: 'Nome de usuário e ID do projeto são obrigatórios.' });
    }

    try {
      const projects = await loadProjects();
      const target = projects.find(p => p.id === projectId);
      if (!target) {
        return res.status(404).json({ success: false, error: 'Projeto não encontrado.' });
      }

      if (!isTech(username) && target.createdBy !== username) {
        return res.status(403).json({ success: false, error: 'Apenas o autor ou técnicos podem excluir este projeto.' });
      }

      const filtered = projects.filter(p => p.id !== projectId);
      await saveProjects(filtered);

      return res.status(200).json({ success: true, message: 'Projeto excluído com sucesso.' });
    } catch (err: any) {
      console.error('Projects DELETE error:', err.message);
      return res.status(500).json({ success: false, error: 'Erro ao excluir projeto.' });
    }
  }

  return res.status(405).json({ success: false, error: 'Método não permitido.' });
}

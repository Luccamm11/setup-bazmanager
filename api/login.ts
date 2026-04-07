import type { VercelRequest, VercelResponse } from '@vercel/node';

// Centralized member data — single source of truth
const TECHNICIAN_USERNAMES = ['Jonas', 'Gustavo'];
const ALL_VALID_USERNAMES = [
  'Jonas', 'Gustavo',
  'Lucca', 'Clarice', 'Ana Clara', 'Bernardo', 'Ana Luisa',
  'Enzo Soares', 'Pedro', 'Yan', 'Guilherme', 'Enzo Resende',
];

// Award focus per member (for API response enrichment)
const AWARD_FOCUS: Record<string, string | null> = {
  'Jonas': null,
  'Gustavo': null,
  'Lucca': 'Sustentabilidade',
  'Clarice': 'PensamentoCriativo',
  'Ana Clara': 'PensamentoCriativo',
  'Bernardo': 'Conexao',
  'Ana Luisa': 'Alcance',
  'Enzo Soares': 'Controle',
  'Pedro': 'Controle',
  'Yan': 'Inovacao',
  'Guilherme': 'Design',
  'Enzo Resende': 'Design',
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, password } = req.body;

  if (!ALL_VALID_USERNAMES.includes(username)) {
    return res.status(401).json({ success: false, message: 'Usuário inválido.' });
  }

  if (password === '021083') {
    const role = TECHNICIAN_USERNAMES.includes(username) ? 'technician' : 'member';
    const awardFocus = AWARD_FOCUS[username] || null;
    return res.status(200).json({ success: true, username, role, awardFocus });
  }

  return res.status(401).json({ success: false, message: 'Senha incorreta.' });
}

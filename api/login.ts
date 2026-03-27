import type { VercelRequest, VercelResponse } from '@vercel/node';

const TECHNICIANS = ['Jonas', 'Gustavo'];

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, password } = req.body;
  const validUsers = ['Jonas', 'Gustavo', 'Lucca', 'Enzo', 'Guilherme', 'Anexo', 'Clarice'];

  if (!validUsers.includes(username)) {
    return res.status(401).json({ success: false, message: 'Usuário inválido.' });
  }

  if (password === '021083') {
    const role = TECHNICIANS.includes(username) ? 'technician' : 'member';
    return res.status(200).json({ success: true, username, role });
  }

  return res.status(401).json({ success: false, message: 'Senha incorreta.' });
}

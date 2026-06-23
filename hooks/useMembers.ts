import { useState, useEffect } from 'react';

export interface Member {
  username: string;
  displayName: string;
  fullName?: string;
  role: 'member' | 'technician';
  awardFocus: string | null;
  active: boolean;
}

export function useMembers(requester: string) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requester) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/members?requester=${encodeURIComponent(requester)}&includeInactive=true`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Falha ao buscar membros');
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          if (data.success && Array.isArray(data.members)) {
            // Map members and default details
            const mapped: Member[] = data.members.map((m: any) => ({
              username: m.username,
              displayName: m.displayName || m.username,
              fullName: m.fullName || m.displayName || m.username,
              role: m.role || (['Jonas', 'Ramon'].includes(m.username) ? 'technician' : 'member'),
              awardFocus: m.awardFocus || null,
              active: m.active !== false,
            }));
            setMembers(mapped);
          } else {
            throw new Error(data.error || 'Erro desconhecido');
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [requester]);

  return { members, loading, error };
}

export async function generateJourney(username: string, scope: 'individual' | 'team'): Promise<void> {
  const isTeam = scope === 'team';
  const url = '/api/generate-journey';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, scope }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao gerar jornada.');
  }

  const markdownContent = await response.text();

  const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
  const downloadUrl = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', isTeam ? 'jornada_equipe.md' : `jornada_${username.toLowerCase()}.md`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}

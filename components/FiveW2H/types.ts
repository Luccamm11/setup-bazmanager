// Re-exports and local helpers for 5W2H feature
import { Realm } from '../../types';

export const REALM_LABELS: Record<Realm, string> = {
  [Realm.TechnicalWriting]: 'Escrita Técnica',
  [Realm.Networking]: 'Networking',
  [Realm.Oratory]: 'Oratória',
  [Realm.Planning]: 'Planejamento',
  [Realm.Creativity]: 'Criatividade',
  [Realm.Programming]: 'Programação',
  [Realm.Engineering]: 'Engenharia',
  [Realm.FirstCulture]: 'FIRST Culture',
  [Realm.Meta]: 'Meta',
};

export const REALM_COLORS: Record<Realm, string> = {
  [Realm.TechnicalWriting]: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  [Realm.Networking]:       'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  [Realm.Oratory]:          'bg-orange-500/15 text-orange-400 border-orange-500/25',
  [Realm.Planning]:         'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  [Realm.Creativity]:       'bg-pink-500/15 text-pink-400 border-pink-500/25',
  [Realm.Programming]:      'bg-green-500/15 text-green-400 border-green-500/25',
  [Realm.Engineering]:      'bg-red-500/15 text-red-400 border-red-500/25',
  [Realm.FirstCulture]:     'bg-teal-500/15 text-teal-400 border-teal-500/25',
  [Realm.Meta]:             'bg-violet-500/15 text-violet-400 border-violet-500/25',
};

export const STATUS_META = {
  pending_review: { label: 'Aguardando Avaliação', color: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
  approved:       { label: 'Aprovado',             color: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  in_progress:    { label: 'Em Andamento',         color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25' },
  done:           { label: 'Concluído',            color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
} as const;

export const FIVE_W2H_FIELDS = [
  { key: 'what',    label: 'O quê?',        placeholder: 'O que será feito?' },
  { key: 'why',     label: 'Por quê?',      placeholder: 'Qual o motivo/objetivo?' },
  { key: 'who',     label: 'Quem?',         placeholder: 'Quem é responsável?' },
  { key: 'where',   label: 'Onde?',         placeholder: 'Onde será executado?' },
  { key: 'when',    label: 'Quando?',       placeholder: 'Ex: 2026-06-01' },
  { key: 'how',     label: 'Como?',         placeholder: 'Como será feito? (método)' },
  { key: 'howMuch', label: 'Quanto?',       placeholder: 'Custo, tempo ou recursos necessários' },
] as const;

import { CompetitionData } from '../types';

export const INITIAL_COMPETITIONS_DATA: CompetitionData = {
  activeEventId: 'event-regional-2026',
  updatedAt: new Date().toISOString(),
  updatedBy: 'Sistema',
  events: [
    {
      id: 'event-regional-2026',
      name: 'Torneio Regional FIRST 2026',
      location: 'Centro de Convenções Ulysses Guimarães',
      startDate: '2026-10-15',
      endDate: '2026-10-18',
      status: 'upcoming',
      description: 'Etapa Regional classificatória oficial da temporada FIRST.',
      createdAt: new Date().toISOString(),
      createdBy: 'Sistema',
      updatedAt: new Date().toISOString(),
      travelChecklist: {
        departureCategories: [
          'Robô & Mecânica',
          'Eletrônica & Baterias',
          'Ferramentas & Fixação',
          'Estrutura do Pit',
          'Documentação & Equipe',
        ],
        departureItems: [],
        returnItems: [],
      },
      matchesChecklist: {
        hotelDepartureChecklist: [],
        matches: [],
      },
      customChecklists: [],
      historyLogs: [],
    },
  ],
};

import type { MatchScoutEntry } from '../types';

export const BIOBUZZ_SCORING = {
  AUTO_LEAVE: 3,
  PARK: 5,
  HIVE_TIP: 20,
  CELL_REMAINING: 2,
  FLOWER_BOTTOM_NECTAR: 5,
  FLOWER_OWNED_PER_ELEMENT: 2,
  MINOR_FOUL_TO_OPPONENT: 5,
  MAJOR_FOUL_TO_OPPONENT: 20,
  POSSESSION_LIMIT: 4,
} as const;

export const BIOBUZZ_RP_THRESHOLDS = {
  SWARM_RP_AUTO_LEAVE_AND_PARK_POINTS: 16,
  POLLINATOR_1_HIVE_TIPS: 4,
  POLLINATOR_2_HIVE_TIPS: 7,
} as const;

export const BIOBUZZ_SYSTEM_KNOWLEDGE_BASE = `
=====================================================================
MANUAL OFICIAL & BASE DE CONHECIMENTO: FIRST® TECH CHALLENGE 2026–2027
JOGO: BIOBUZZ™ presented by RTX (Temporada FIRST® CANOPY™)
FONTE DE REFERÊNCIA: Competition Manual FIRST Inspires (Seções 9, 10 e 11)
=====================================================================

1. TEMÁTICA, ARENA & MEDIDAS OFICIAIS (SEÇÃO 9 — TOLERÂNCIA ±1" / ±2,5 cm)
- Campo Oficial: 144" × 144" (365,75 cm × 365,75 cm) internos às paredes do perímetro, com 36 placas de EVA (grade 6×6: colunas A–F da esquerda para direita, linhas 1–6 da Plateia/Audience para a Mesa/Scoring). Cada placa mede 24" × 24" × 0,59" (60,95 cm × 60,95 cm × 1,50 cm).
- Colunas A, B, C = Lado Aliança Vermelha | Colunas D, E, F = Lado Aliança Azul.
- HIVE CENTRAL (Colmeia): Estrutura biestável única ancorada no CENTRO do campo (placas C3, C4, D3, D4). Base de 49,46" × 38,95" (125,65 cm × 98,95 cm), eixo de pivô a 43,95" (111,65 cm) de altura. Abriga a Red HIVE (2 células) e a Blue HIVE (2 células). Começa com 3 Nectar em cada célula ativa voltada para cima.
- APRILTAGS (Família 36h11 — 3,25" × 3,25" / 8,25 cm): Organizados em clusters de 4 tags sob as células da Hive voltados para baixo:
  * Red Cell (lado Scoring/oposto à plateia): IDs 0, 1, 2, 3
  * Red Cell (lado Audience/plateia): IDs 4, 5, 6, 7
  * Blue Cell (lado Audience/plateia): IDs 38, 39, 40, 41
  * Blue Cell (lado Scoring/oposto à plateia): IDs 42, 43, 44, 45
- 4 FLOWERS (Flores no Perímetro): Montadas nas 4 paredes do perímetro (1 por parede, a 2 placas do canto). Abertura superior Ø 4,0" (10,15 cm) a 21,5" (54,6 cm) de altura, backstop de 1,25", abertura inferior de coleta 3,55" × 3,57", anel de piso 0,4" com furo Ø 2,79". Cada Flower inicia com 4 Pollen empilhados.
- LOADING ZONES (Zonas de Carga / Park): 23" × 11" (58,40 cm × 27,95 cm) — Red na placa A5 e Blue na placa F2.
- GARDENS (Jardins): 23" × 2" (58,40 cm × 5,10 cm) — Red Garden na borda da placa A1 (4 Pollen iniciais) e Blue Garden na borda da placa F6 (4 Pollen iniciais).
- Elementos de Pontuação (Scoring Elements):
  * POLLEN: Esferas amarelas Gopher ResisDent™ Ø ~2,8" (7,1 cm). Recurso compartilhado (8 nos Gardens + 16 nas Flowers).
  * NECTAR: Esferas vermelhas/azuis Ø ~3,6" (9,1 cm). Exclusivas de cada aliança; 3 iniciais por Hive ativa e mais liberadas a cada Hive Tip.

2. ESTRUTURA DA PARTIDA (2m38s totais)
- PERÍODO AUTÔNOMO (30 segundos): Robôs operam apenas com código pré-programado, sensores e leitura de AprilTags nas Hives. Foco em Leave (sair da zona inicial), coleta inicial de Pollen, lançamentos na Hive, Hive Tip e Park.
- TRANSIÇÃO (8 segundos): Pausa breve antes do controle pelos drivers.
- TELEOPERADO (2 minutos / 120 segundos):
  * Drivers assumem o controle para ciclos rápidos de Pollen/Nectar na Hive, acumulando Hive Tips (cada Tip dá pontos e libera mais Nectar).
  * ÚLTIMOS 60 SEGUNDOS (Endgame / Flowers): Foco estratégico máximo no preenchimento das 4 Flowers e no posicionamento de Park antes do zero do cronômetro.

3. TABELA 10-2: VALORES OFICIAIS DE PONTUAÇÃO BIOBUZZ™
- Leave (somente Autônomo - sair totalmente da zona inicial): 3 pts por robô.
- Park (Autônomo ou TeleOp/Endgame - estacionar nas zonas designadas): 5 pts por robô (pode pontuar no Auto e no TeleOp).
- Hive Tip (Autônomo ou TeleOp - inclinar/tombar com sucesso a Hive): 20 pts por Tip.
- Remaining Pollen/Nectar in Cell (final da partida, em célula voltada para cima): 2 pts por elemento.
- Flower - Bottom Nectar Bonus (TeleOp): 5 pts para a aliança cujo Nectar da própria cor for o elemento mais baixo válido naquela Flower.
- Flower - Ownership (Propriedade da Flor ao fim da partida): A aliança cujo Nectar estiver na posição MAIS ALTA (top-most) válida dentro de uma Flower se torna "dona" daquela Flower e ganha 2 pts por CADA Pollen e Nectar válido dentro daquela Flower (independentemente de quem colocou os outros elementos).

4. TABELA 10-3: RANKING POINTS (RP) OFICIAIS (Regionais / Ligas / Qualifiers)
- Vitória da Partida: 2 RP | Empate: 1 RP | Derrota: 0 RP.
- SWARM RP (+1 RP bônus): Alcançar >= 16 pontos combinados da aliança em tarefas de Autonomous LEAVE + PARK.
  (Exemplos práticos para 16 pts: 2 robôs com Leave no Auto [6 pts] + 2 robôs com Park [10 pts] = 16 pts; ou 1 Auto Leave [3] + 1 Auto Park [5] + 2 Endgame Parks [10] = 18 pts).
- POLLINATOR 1 RP (+1 RP bônus): Atingir >= 4 Hive Tips na partida.
- POLLINATOR 2 RP (+1 RP bônus): Atingir >= 7 Hive Tips na partida.
(Obs.: No FIRST Championship os limites podem receber ajustes via Team Updates).

5. REGRAS CRÍTICAS & PENALIDADES (SEÇÃO 11)
- Limite de Posse (Possession Limit - Regra G407): Máximo de 4 elementos de pontuação (Pollen e/ou Nectar somados) controlados simultaneamente por robô. Controlar >= 5 gera falta imediata!
- Dimensões do Robô: Deve caber no cubo padrão de 18" x 18" x 18" antes do início da partida e respeitar os limites de expansão permitidos em campo.
- Pinning (Imobilização): Proibido prender um robô adversário por mais de 3 segundos sem recuar pelo menos 2 pés (~60 cm) para liberar.
- Minor Foul (Falta Leve): +5 pontos para a aliança adversária (ex.: infrações leves de zona ou posse momentânea sem impacto severo).
- Major Foul (Falta Grave): +20 pontos para a aliança adversária (ex.: contato intencional/perigoso, pinning prolongado, reter além do limite de posse de forma vantajosa, bloqueio estratégico ilegal). Faltas graves ou repetidas escalam para Yellow Card e Red Card.

6. DIRETRIZES TÁTICAS PARA A EQUIPE BAZINGA! 73 (#21083)
- Em partidas classificatórias (Qualifications), garantir os 3 RPs bônus (Swarm RP + Pollinator 1 + Pollinator 2) muitas vezes vale mais no ranking do que apenas vencer por pequena margem.
- Nos últimos 15-20s do TeleOp, priorizar colocar um Nectar da própria cor no TOPO de Flowers já cheias de Pollen para "roubar" o Ownership (2 pts x todos os elementos internos!).
- Em seleção de alianças (Alliance Selection), combinar robôs complementares: um especialista em ciclos rápidos de Hive (para bater 4 e 7 Tips) + um robô consistente em Autônomo (Leave + AprilTags + Swarm RP) e controle final de Flowers.
`.trim();

export function calculateScoutEntryScore(entry: Omit<MatchScoutEntry, 'id' | 'calculatedContributionScore' | 'timestamp' | 'scoutedBy'>): number {
  const autoScore =
    (entry.autoLeftZone ? BIOBUZZ_SCORING.AUTO_LEAVE : 0) +
    (entry.autoParked ? BIOBUZZ_SCORING.PARK : 0) +
    (entry.autoHiveTips || 0) * BIOBUZZ_SCORING.HIVE_TIP;

  const teleopScore =
    (entry.teleopHiveTips || 0) * BIOBUZZ_SCORING.HIVE_TIP +
    (entry.teleopCellsRemaining || 0) * BIOBUZZ_SCORING.CELL_REMAINING +
    (entry.teleopFlowersBottomNectar || 0) * BIOBUZZ_SCORING.FLOWER_BOTTOM_NECTAR +
    (entry.teleopFlowerElementsCount || 0) * BIOBUZZ_SCORING.FLOWER_OWNED_PER_ELEMENT +
    (entry.endgameParked ? BIOBUZZ_SCORING.PARK : 0);

  return Math.max(0, autoScore + teleopScore);
}

export interface BioBuzzAllianceSimulationInput {
  autoLeaveCount: number; // 0..2
  autoParkCount: number; // 0..2
  autoHiveTips: number;
  teleopHiveTips: number;
  cellsRemaining: number;
  flowersBottomNectar: number; // 0..4
  ownedFlowersElements: number;
  endgameParkCount: number; // 0..2
  opponentMinorFouls: number;
  opponentMajorFouls: number;
}

export function simulateBioBuzzAllianceScore(input: BioBuzzAllianceSimulationInput) {
  const autoLeavePts = input.autoLeaveCount * BIOBUZZ_SCORING.AUTO_LEAVE;
  const autoParkPts = input.autoParkCount * BIOBUZZ_SCORING.PARK;
  const autoHivePts = input.autoHiveTips * BIOBUZZ_SCORING.HIVE_TIP;
  const autoTotal = autoLeavePts + autoParkPts + autoHivePts;

  const teleopHivePts = input.teleopHiveTips * BIOBUZZ_SCORING.HIVE_TIP;
  const cellsPts = input.cellsRemaining * BIOBUZZ_SCORING.CELL_REMAINING;
  const bottomNectarPts = input.flowersBottomNectar * BIOBUZZ_SCORING.FLOWER_BOTTOM_NECTAR;
  const flowerOwnershipPts = input.ownedFlowersElements * BIOBUZZ_SCORING.FLOWER_OWNED_PER_ELEMENT;
  const endgameParkPts = input.endgameParkCount * BIOBUZZ_SCORING.PARK;
  const teleopTotal = teleopHivePts + cellsPts + bottomNectarPts + flowerOwnershipPts + endgameParkPts;

  const penaltyPts =
    input.opponentMinorFouls * BIOBUZZ_SCORING.MINOR_FOUL_TO_OPPONENT +
    input.opponentMajorFouls * BIOBUZZ_SCORING.MAJOR_FOUL_TO_OPPONENT;

  const totalScore = autoTotal + teleopTotal + penaltyPts;

  const swarmPoints = autoLeavePts + autoParkPts + endgameParkPts;
  const totalHiveTips = input.autoHiveTips + input.teleopHiveTips;

  const swarmRp = swarmPoints >= BIOBUZZ_RP_THRESHOLDS.SWARM_RP_AUTO_LEAVE_AND_PARK_POINTS;
  const pollinator1Rp = totalHiveTips >= BIOBUZZ_RP_THRESHOLDS.POLLINATOR_1_HIVE_TIPS;
  const pollinator2Rp = totalHiveTips >= BIOBUZZ_RP_THRESHOLDS.POLLINATOR_2_HIVE_TIPS;

  return {
    autoTotal,
    teleopTotal,
    penaltyPts,
    totalScore,
    swarmPoints,
    totalHiveTips,
    swarmRp,
    pollinator1Rp,
    pollinator2Rp,
    bonusRps: (swarmRp ? 1 : 0) + (pollinator1Rp ? 1 : 0) + (pollinator2Rp ? 1 : 0),
  };
}

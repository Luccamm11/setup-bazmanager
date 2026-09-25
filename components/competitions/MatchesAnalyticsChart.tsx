import React, { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceLine
} from 'recharts';
import { MatchRecord } from '../../types';
import { BatteryCharging, Activity, Flame, ShieldAlert, CheckCircle2, TrendingDown } from 'lucide-react';

interface MatchesAnalyticsChartProps {
  matches: MatchRecord[];
}

export const MatchesAnalyticsChart: React.FC<MatchesAnalyticsChartProps> = ({ matches }) => {
  // Processamento de dados para os gráficos
  const chartData = useMemo(() => {
    // Ordena as partidas da mais antiga para a mais recente para o gráfico
    return [...matches].reverse().map((match, idx) => {
      // Extrair números de tensão (ex: "13.1V" -> 13.1)
      const parseVoltage = (str: string) => {
        if (!str) return null;
        const clean = str.replace(/[^\d.,]/g, '').replace(',', '.');
        const num = parseFloat(clean);
        return isNaN(num) ? null : num;
      };

      const preV = parseVoltage(match.preMatch.batteryVoltage);
      const postV = parseVoltage(match.postMatch.postBatteryVoltage);
      const deltaV = preV !== null && postV !== null ? Number((preV - postV).toFixed(2)) : null;

      // Score de condição do robô: 100 = Íntegro, 50 = Leve Folga, 10 = Quebrado
      const conditionScore = match.postMatch.robotCondition === 'perfect'
        ? 100
        : match.postMatch.robotCondition === 'minor_issue'
        ? 60
        : 20;

      return {
        id: match.id,
        name: match.matchNumber,
        shortName: `M${idx + 1}`,
        roundType: match.roundType,
        alliance: match.allianceColor,
        preVoltage: preV,
        postVoltage: postV,
        dropVoltage: deltaV,
        conditionScore,
        conditionText: match.postMatch.robotCondition === 'perfect'
          ? '100% Íntegro'
          : match.postMatch.robotCondition === 'minor_issue'
          ? 'Leve Folga/Ajuste'
          : 'Quebrou / Crítico',
        maintenanceUrgent: match.postMatch.urgentPitMaintenance ? 1 : 0,
      };
    });
  }, [matches]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const validDrops = chartData.filter(d => d.dropVoltage !== null).map(d => d.dropVoltage as number);
    const avgDrop = validDrops.length > 0
      ? (validDrops.reduce((a, b) => a + b, 0) / validDrops.length).toFixed(2)
      : '0.00';

    const damagedCount = matches.filter(m => m.postMatch.robotCondition === 'damaged').length;
    const maintenanceCount = matches.filter(m => m.postMatch.urgentPitMaintenance).length;
    const perfectCount = matches.filter(m => m.postMatch.robotCondition === 'perfect').length;

    return {
      avgDrop,
      damagedCount,
      maintenanceCount,
      perfectCount,
      total: matches.length,
    };
  }, [chartData, matches]);

  if (matches.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-primary/40 border border-white/5 text-center text-text-muted">
        <Activity size={32} className="mx-auto mb-2 opacity-40 text-blue-400" />
        <p className="text-sm">Cadastre partidas e preencha o Pré e Pós-Match para gerar os gráficos analíticos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Métricas Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/20">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BatteryCharging size={16} />
            <span>Consumo Médio (Drop V)</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.avgDrop} V</div>
          <p className="text-[10px] text-text-muted mt-1">Diferença média entre Pré e Pós-Match</p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <CheckCircle2 size={16} />
            <span>Robô Íntegro</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.perfectCount} <span className="text-sm font-normal text-text-muted">/ {stats.total}</span></div>
          <p className="text-[10px] text-text-muted mt-1">Partidas sem qualquer avaria</p>
        </div>

        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert size={16} />
            <span>Manutenções Pit</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.maintenanceCount}</div>
          <p className="text-[10px] text-text-muted mt-1">Chamados de reparo urgente no Pit</p>
        </div>

        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Flame size={16} />
            <span>Quebras Críticas</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.damagedCount}</div>
          <p className="text-[10px] text-text-muted mt-1">Partidas com avaria severa no robô</p>
        </div>
      </div>

      {/* Gráfico 1: Tensão da Bateria (Pré-Match vs Pós-Match) */}
      <div className="p-6 rounded-2xl bg-primary/40 border border-white/5 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <div>
            <h4 className="text-base font-black text-white flex items-center gap-2">
              <BatteryCharging size={18} className="text-blue-400" />
              <span>Comparativo de Tensão da Bateria: Antes vs Depois da Partida</span>
            </h4>
            <p className="text-xs text-text-secondary mt-0.5">
              Monitore a queda de tensão (Drop) por partida para evitar baterias viciadas ou quedas de rádio na arena.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              <span>Antes (Pré)</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-300">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
              <span>Depois (Pós)</span>
            </div>
          </div>
        </div>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis domain={[11.5, 13.8]} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="V" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                formatter={(value: any, name: string) => [
                  `${value} V`,
                  name === 'preVoltage' ? 'Tensão Antes (Pré)' : 'Tensão Depois (Pós)'
                ]}
              />
              <ReferenceLine y={12.4} stroke="#ef444480" strokeDasharray="4 4" label={{ value: 'Alerta < 12.4V', fill: '#ef4444', fontSize: 10 }} />
              <Bar dataKey="preVoltage" name="preVoltage" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={36} />
              <Bar dataKey="postVoltage" name="postVoltage" fill="#22d3ee" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico 2: Queda de Tensão (Drop) e Integridade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Curva de Consumo */}
        <div className="p-6 rounded-2xl bg-primary/40 border border-white/5 backdrop-blur-xl">
          <h4 className="text-base font-black text-white flex items-center gap-2 mb-2">
            <TrendingDown size={18} className="text-amber-400" />
            <span>Queda de Tensão por Partida (Drop V)</span>
          </h4>
          <p className="text-xs text-text-secondary mb-4">
            Volts consumidos em cada partida (Pré - Pós).
          </p>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="V" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val} V`, 'Queda de Tensão']}
                />
                <Line
                  type="monotone"
                  dataKey="dropVoltage"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ fill: '#f59e0b', r: 5 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela Resumo das Partidas */}
        <div className="p-6 rounded-2xl bg-primary/40 border border-white/5 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h4 className="text-base font-black text-white flex items-center gap-2 mb-2">
              <Activity size={18} className="text-emerald-400" />
              <span>Condição do Robô Pós-Partida</span>
            </h4>
            <p className="text-xs text-text-secondary mb-4">
              Status físico relatado logo após o término de cada match.
            </p>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[220px] custom-scrollbar pr-1">
            {matches.map(m => {
              const cond = m.postMatch.robotCondition;
              const condBg = cond === 'perfect'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : cond === 'minor_issue'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-red-500/10 border-red-500/30 text-red-400';

              return (
                <div key={m.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${m.allianceColor === 'blue' ? 'bg-blue-500' : 'bg-red-500'}`} />
                    <span className="font-bold text-white">{m.matchNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full border font-bold ${condBg}`}>
                      {cond === 'perfect' ? 'Íntegro' : cond === 'minor_issue' ? 'Folga' : 'Quebrou'}
                    </span>
                    {m.postMatch.urgentPitMaintenance && (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30 text-[10px]">
                        Pit Urgente!
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchesAnalyticsChart;

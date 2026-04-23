import React, { useState, useEffect } from 'react';
import { Calendar, CheckSquare, XSquare, BriefcaseMedical, Clock, Plane, Loader2, Save, ListTodo } from 'lucide-react';

type AttendanceStatus = 'Atestado Medico' | 'Itinerario' | 'Falta' | 'Presenca' | 'Ferias';

interface AttendanceRecord {
    [date: string]: {
        [username: string]: AttendanceStatus;
    };
}

const ALL_MEMBERS = [
  'Lucca', 'Clarice', 'Ana Clara', 'Bernardo', 
  'Ana Luisa', 'Enzo Soares', 'Pedro', 'Yan', 'Guilherme', 'Enzo Resende'
];

const AttendanceDashboard: React.FC = () => {
    const [attendance, setAttendance] = useState<AttendanceRecord>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    
    // Calendar View states
    const [viewMode, setViewMode] = useState<'daily' | 'calendar'>('daily');
    const [calendarMonth, setCalendarMonth] = useState(today.substring(0, 7)); // "YYYY-MM" format

    useEffect(() => {
        const fetchAttendance = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/attendance');
                const data = await res.json();
                if (data.success) {
                    setAttendance(data.records || {});
                }
            } catch (err) {
                console.error('Error fetching attendance:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, []);

    const handleStatusChange = (username: string, status: AttendanceStatus) => {
        setAttendance(prev => ({
            ...prev,
            [selectedDate]: {
                ...(prev[selectedDate] || {}),
                [username]: status
            }
        }));
    };

    const countStatusForMember = (username: string, targetStatus: string) => {
        let count = 0;
        Object.values(attendance).forEach(dateRecord => {
            if (dateRecord[username] === targetStatus) {
                count++;
            }
        });
        return count;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: attendance })
            });
        } catch (err) {
            console.error('Error saving attendance:', err);
        } finally {
            setSaving(false);
        }
    };

    const getDaysInMonth = (yearMonth: string) => {
        const [year, month] = yearMonth.split('-').map(Number);
        return new Date(year, month, 0).getDate();
    };

    const isWeekend = (yearMonth: string, day: number) => {
        const [year, month] = yearMonth.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6;
    };

    const calendarDays = getDaysInMonth(calendarMonth);
    const daysArray = Array.from({ length: calendarDays }, (_, i) => i + 1);

    const getStatusColor = (status?: AttendanceStatus) => {
        switch (status) {
            case 'Presenca': return 'bg-green-500';
            case 'Falta': return 'bg-red-500';
            case 'Atestado Medico': return 'bg-yellow-500';
            case 'Itinerario': return 'bg-orange-500';
            case 'Ferias': return 'bg-blue-500';
            default: return 'bg-white/5';
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-wider">Controle de Presença</h2>
                    <p className="text-text-secondary text-sm">Gerencie o histórico de presença e atividades externas dos membros.</p>
                </div>
                
                <div className="flex bg-primary/50 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setViewMode('daily')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${viewMode === 'daily' ? 'bg-accent-primary text-white shadow-lg' : 'text-text-secondary hover:text-white'}`}
                    >
                        <ListTodo size={16} /> Presença do Dia
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${viewMode === 'calendar' ? 'bg-accent-primary text-white shadow-lg' : 'text-text-secondary hover:text-white'}`}
                    >
                        <Calendar size={16} /> Ver Calendário
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-accent-primary" size={40} />
                </div>
            ) : viewMode === 'daily' ? (
                <div className="bg-primary/30 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-text-muted uppercase tracking-wider">Data do Registro:</span>
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-primary text-white border border-white/20 rounded-xl px-4 py-2 outline-none focus:border-accent-primary transition-colors font-mono"
                            />
                        </div>
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-accent-primary text-white font-bold py-2 px-6 rounded-xl shadow-glow-primary hover:bg-blue-500 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            Salvar Lista
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/5 border-b border-white/10 uppercase text-[10px] font-black tracking-widest text-text-muted">
                                <tr>
                                    <th className="p-4 pl-6 whitespace-nowrap">Membro</th>
                                    <th className="p-4 text-center whitespace-nowrap">Presenças</th>
                                    <th className="p-4 text-center whitespace-nowrap">Faltas</th>
                                    <th className="p-4 text-center whitespace-nowrap border-l border-white/10 bg-white/[0.02]">
                                        Definir Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {ALL_MEMBERS.map(member => {
                                    const currentStatus = attendance[selectedDate]?.[member];

                                    return (
                                        <tr key={member} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-4 pl-6 font-bold text-white whitespace-nowrap">{member}</td>
                                            <td className="p-4 text-center text-green-500 font-black">
                                                {countStatusForMember(member, 'Presenca')}
                                            </td>
                                            <td className="p-4 text-center text-red-500 font-black">
                                                {countStatusForMember(member, 'Falta')}
                                            </td>
                                            <td className="p-4 border-l border-white/10 bg-white/[0.01]">
                                                <div className="flex flex-wrap items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleStatusChange(member, 'Presenca')}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${currentStatus === 'Presenca' ? 'bg-green-500 text-white border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-transparent text-text-muted hover:text-white border-white/10 hover:border-white/30'}`}
                                                    >
                                                        <CheckSquare size={14} className="inline mr-1" /> Presença
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(member, 'Falta')}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${currentStatus === 'Falta' ? 'bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-transparent text-text-muted hover:text-white border-white/10 hover:border-white/30'}`}
                                                    >
                                                        <XSquare size={14} className="inline mr-1" /> Falta
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(member, 'Itinerario')}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${currentStatus === 'Itinerario' ? 'bg-orange-500 text-white border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-transparent text-text-muted hover:text-white border-white/10 hover:border-white/30'}`}
                                                    >
                                                        <Clock size={14} className="inline mr-1" /> Itinerário
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(member, 'Atestado Medico')}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${currentStatus === 'Atestado Medico' ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-transparent text-text-muted hover:text-white border-white/10 hover:border-white/30'}`}
                                                    >
                                                        <BriefcaseMedical size={14} className="inline mr-1" /> Atestado
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(member, 'Ferias')}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${currentStatus === 'Ferias' ? 'bg-blue-500 text-white border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-transparent text-text-muted hover:text-white border-white/10 hover:border-white/30'}`}
                                                    >
                                                        <Plane size={14} className="inline mr-1" /> Férias
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-primary/30 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-text-muted uppercase tracking-wider">Mês Base:</span>
                            <input 
                                type="month" 
                                value={calendarMonth}
                                onChange={(e) => setCalendarMonth(e.target.value)}
                                className="bg-primary text-white border border-white/20 rounded-xl px-4 py-2 outline-none focus:border-accent-primary transition-colors font-mono uppercase"
                            />
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> Presente</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Falta</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Atestado</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Itinerário</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Férias</div>
                        </div>
                    </div>

                    <div className="overflow-x-auto pb-4">
                        <table className="w-full text-left border-collapse table-auto">
                            <thead className="bg-white/5 border-b border-white/10 text-[10px] font-black text-text-muted">
                                <tr>
                                    <th className="p-3 whitespace-nowrap tracking-widest uppercase border-r border-white/5 w-40">Membros</th>
                                    {daysArray.map(day => (
                                        <th key={day} className="p-1 min-w-[28px] text-center">{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {ALL_MEMBERS.map(member => (
                                    <tr key={member} className="hover:bg-white/[0.02]">
                                        <td className="p-3 text-sm font-bold text-white whitespace-nowrap border-r border-white/5">{member}</td>
                                        {daysArray.map(day => {
                                            const dayString = day.toString().padStart(2, '0');
                                            const targetDate = `${calendarMonth}-${dayString}`;
                                            const status = attendance[targetDate]?.[member];
                                            const weekend = isWeekend(calendarMonth, day);
                                            
                                            return (
                                                <td key={day} className="p-1">
                                                    <div className="flex justify-center items-center h-full">
                                                        <div 
                                                            className={`w-5 h-5 rounded-md ${getStatusColor(status)} shadow-sm relative overflow-hidden`}
                                                            title={`${member} | ${targetDate}${status ? ` | ${status}` : ' | Sem registro'}${weekend ? ' | Final de Semana' : ''}`}
                                                        >
                                                            {weekend && (
                                                                <div className="absolute inset-0 flex items-center justify-center text-white/40 pointer-events-none">
                                                                    <div className="w-[1.5px] h-full bg-current rotate-45 transform origin-center"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceDashboard;

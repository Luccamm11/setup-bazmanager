import React, { useState, useEffect } from 'react';
import { Settings, Calendar, CheckSquare, XSquare, BriefcaseMedical, Clock, Loader2, Save } from 'lucide-react';

interface AttendanceRecord {
    [date: string]: {
        [username: string]: 'Atestado Medico' | 'Itinerario' | 'Falta' | 'Presenca';
    };
}

const ALL_MEMBERS = [
  'Jonas', 'Gustavo', 'Lucca', 'Clarice', 'Ana Clara', 'Bernardo', 
  'Ana Luisa', 'Enzo Soares', 'Pedro', 'Yan', 'Guilherme', 'Enzo Resende'
];

const AttendanceDashboard: React.FC = () => {
    const [attendance, setAttendance] = useState<AttendanceRecord>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);

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

    const handleStatusChange = (username: string, status: 'Atestado Medico' | 'Itinerario' | 'Falta' | 'Presenca') => {
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

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-wider">Controle de Presença</h2>
                    <p className="text-text-secondary text-sm">Gerencie o histórico de presença e atividades externas dos membros.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-primary/50 text-white border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-accent-primary transition-colors"
                    />
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-accent-primary text-white font-bold py-2 px-6 rounded-xl shadow-glow-primary hover:bg-blue-500 transition-colors flex items-center gap-2"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Salvar
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-accent-primary" size={40} />
                </div>
            ) : (
                <div className="bg-primary/30 border border-white/5 rounded-3xl overflow-hidden shadow-2xl overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 border-b border-white/10 uppercase text-[10px] font-black tracking-widest text-text-muted">
                            <tr>
                                <th className="p-4 pl-6 whitespace-nowrap">Membro</th>
                                <th className="p-4 text-center whitespace-nowrap">Presenças</th>
                                <th className="p-4 text-center whitespace-nowrap">Faltas</th>
                                <th className="p-4 text-center whitespace-nowrap">Itin.</th>
                                <th className="p-4 text-center whitespace-nowrap">Atest.</th>
                                <th className="p-4 text-center whitespace-nowrap border-l border-white/10 bg-white/[0.02]">
                                    Registro de Hoje ({selectedDate})
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {ALL_MEMBERS.map(member => {
                                const currentStatus = attendance[selectedDate]?.[member];

                                return (
                                    <tr key={member} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 pl-6 font-bold text-white whitespace-nowrap">{member}</td>
                                        <td className="p-4 text-center text-accent-primary font-black">
                                            {countStatusForMember(member, 'Presenca')}
                                        </td>
                                        <td className="p-4 text-center text-accent-red font-black">
                                            {countStatusForMember(member, 'Falta')}
                                        </td>
                                        <td className="p-4 text-center text-accent-tertiary font-black">
                                            {countStatusForMember(member, 'Itinerario')}
                                        </td>
                                        <td className="p-4 text-center text-orange-400 font-black">
                                            {countStatusForMember(member, 'Atestado Medico')}
                                        </td>
                                        <td className="p-4 border-l border-white/10 bg-white/[0.01]">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleStatusChange(member, 'Presenca')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${currentStatus === 'Presenca' ? 'bg-accent-primary text-white border-accent-primary shadow-glow-primary' : 'bg-transparent text-text-muted hover:text-white border-white/10 hover:border-white/30'}`}
                                                >
                                                    <CheckSquare size={14} className="inline mr-1" /> Presença
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(member, 'Falta')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${currentStatus === 'Falta' ? 'bg-accent-red text-white border-accent-red shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-transparent text-text-muted hover:text-white border-white/10 hover:border-white/30'}`}
                                                >
                                                    <XSquare size={14} className="inline mr-1" /> Falta
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(member, 'Itinerario')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${currentStatus === 'Itinerario' ? 'bg-accent-tertiary text-white border-accent-tertiary shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-transparent text-text-muted hover:text-white border-white/10 hover:border-white/30'}`}
                                                >
                                                    <Clock size={14} className="inline mr-1" /> Itin.
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(member, 'Atestado Medico')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${currentStatus === 'Atestado Medico' ? 'bg-orange-500 text-white border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-transparent text-text-muted hover:text-white border-white/10 hover:border-white/30'}`}
                                                >
                                                    <BriefcaseMedical size={14} className="inline mr-1" /> Atestado
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AttendanceDashboard;

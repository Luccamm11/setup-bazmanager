import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench, Package, Search, Filter, Cpu, HardHat,
  Plus, X, CheckCircle2, Circle, MapPin, ChevronDown,
  FlaskConical, AlertCircle, Save
} from 'lucide-react';
import baseInventoryData from '../data/robotics_inventory.json';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoboticsItem {
  id: string;
  category: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  acquiredByFIEMG: string;
  productCode: string;
}

interface ItemStatus {
  inUse: boolean;
  location: string;
}

type StatusMap = Record<string, ItemStatus>;

const STORAGE_KEY = 'robotics_inventory_status';
const CUSTOM_ITEMS_KEY = 'robotics_inventory_custom_items';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Ferramentas: <Wrench className="w-4 h-4 text-amber-400" />,
  Maquinas: <Cpu className="w-4 h-4 text-blue-400" />,
  EPIs: <HardHat className="w-4 h-4 text-sky-400" />,
  Insumos: <FlaskConical className="w-4 h-4 text-violet-400" />,
};

const CATEGORY_BADGE: Record<string, string> = {
  Ferramentas: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Maquinas: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  EPIs: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  Insumos: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

// ─── Empty form state ─────────────────────────────────────────────────────────

const EMPTY_FORM: Omit<RoboticsItem, 'id'> = {
  category: 'Insumos',
  name: '',
  quantity: 1,
  unitPrice: 0,
  subtotal: 0,
  acquiredByFIEMG: '',
  productCode: '',
};

// ─── Add Item Modal ───────────────────────────────────────────────────────────

interface AddItemModalProps {
  onClose: () => void;
  onAdd: (item: RoboticsItem) => void;
  existingCategories: string[];
}

const AddItemModal: React.FC<AddItemModalProps> = ({ onClose, onAdd, existingCategories }) => {
  const [form, setForm] = useState<Omit<RoboticsItem, 'id'>>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: keyof typeof form, value: string | number) =>
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        next.subtotal = Number(next.quantity) * Number(next.unitPrice);
      }
      return next;
    });

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nome é obrigatório';
    if (form.quantity < 0) errs.quantity = 'Quantidade não pode ser negativa';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const id = `custom-${Date.now()}`;
    onAdd({ id, ...form, name: form.name.trim(), productCode: form.productCode.trim() });
    onClose();
  };

  const categories = Array.from(new Set([...existingCategories, 'Outro']));

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-accent-primary" />
              <h3 className="font-black text-white text-lg">Adicionar Item</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-bold text-text-secondary mb-1.5">Nome do item *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Ex: Motor DC 12V"
                className={`w-full bg-black/30 border rounded-xl py-2.5 px-4 text-white focus:outline-none transition-colors ${errors.name ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-accent-primary'}`}
              />
              {errors.name && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-bold text-text-secondary mb-1.5">Categoria</label>
              <div className="relative">
                <select
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 pl-4 pr-10 text-white focus:outline-none focus:border-accent-primary appearance-none cursor-pointer"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            </div>

            {/* Quantidade + Código */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1.5">Quantidade</label>
                <input
                  type="number"
                  min={0}
                  value={form.quantity}
                  onChange={e => set('quantity', Number(e.target.value))}
                  className={`w-full bg-black/30 border rounded-xl py-2.5 px-4 text-white focus:outline-none transition-colors ${errors.quantity ? 'border-red-500/60' : 'border-white/10 focus:border-accent-primary'}`}
                />
                {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1.5">Código</label>
                <input
                  type="text"
                  value={form.productCode}
                  onChange={e => set('productCode', e.target.value)}
                  placeholder="Ex: REV-41-1234"
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-accent-primary transition-colors"
                />
              </div>
            </div>

            {/* Preço */}
            <div>
              <label className="block text-sm font-bold text-text-secondary mb-1.5">Preço unitário (R$)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.unitPrice}
                onChange={e => set('unitPrice', Number(e.target.value))}
                className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-accent-primary transition-colors"
              />
            </div>

            {/* Adquirido FIEMG */}
            <div>
              <label className="block text-sm font-bold text-text-secondary mb-1.5">Adquirido pela FIEMG?</label>
              <div className="relative">
                <select
                  value={form.acquiredByFIEMG}
                  onChange={e => set('acquiredByFIEMG', e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 pl-4 pr-10 text-white focus:outline-none focus:border-accent-primary appearance-none cursor-pointer"
                >
                  <option value="">Não</option>
                  <option value="Sim">Sim</option>
                  <option value="Parcial">Parcial</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-text-secondary font-bold hover:bg-white/5 hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-xl bg-accent-primary text-white font-black hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Location Popover ─────────────────────────────────────────────────────────

interface LocationPopoverProps {
  location: string;
  onSave: (loc: string) => void;
  onClose: () => void;
}

const LocationPopover: React.FC<LocationPopoverProps> = ({ location, onSave, onClose }) => {
  const [value, setValue] = useState(location);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { onSave(value); onClose(); }
    if (e.key === 'Escape') onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -4 }}
      transition={{ duration: 0.15 }}
      className="absolute z-30 top-full mt-2 left-0 bg-[#0f1117] border border-white/10 rounded-xl shadow-2xl p-3 w-64"
      onClick={e => e.stopPropagation()}
    >
      <p className="text-xs text-text-muted mb-2 font-bold flex items-center gap-1">
        <MapPin className="w-3 h-3" /> Onde está sendo usado?
      </p>
      <input
        autoFocus
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ex: Robô principal, bancada 2..."
        className="w-full bg-black/30 border border-white/10 rounded-lg py-1.5 px-3 text-white text-sm focus:outline-none focus:border-accent-primary transition-colors"
      />
      <div className="flex gap-2 mt-2">
        <button onClick={onClose} className="flex-1 text-xs py-1.5 rounded-lg border border-white/10 text-text-muted hover:text-white transition-colors">
          Cancelar
        </button>
        <button
          onClick={() => { onSave(value); onClose(); }}
          className="flex-1 text-xs py-1.5 rounded-lg bg-accent-primary/80 text-white font-bold hover:bg-accent-primary transition-colors"
        >
          Salvar
        </button>
      </div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const RoboticsInventory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusMap, setStatusMap] = useState<StatusMap>({});
  const [customItems, setCustomItems] = useState<RoboticsItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  // ── Load from localStorage ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setStatusMap(JSON.parse(saved));
      const savedCustom = localStorage.getItem(CUSTOM_ITEMS_KEY);
      if (savedCustom) setCustomItems(JSON.parse(savedCustom));
    } catch (_) {}
  }, []);

  // ── Persist status ──
  const saveStatus = useCallback((map: StatusMap) => {
    setStatusMap(map);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }, []);

  // ── Persist custom items ──
  const saveCustomItems = useCallback((items: RoboticsItem[]) => {
    setCustomItems(items);
    localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(items));
  }, []);

  // ── Combined items ──
  const allItems: RoboticsItem[] = [...(baseInventoryData as RoboticsItem[]), ...customItems];
  const categories = ['All', ...Array.from(new Set(allItems.map(i => i.category)))];

  const filteredItems = allItems.filter(item => {
    const s = searchTerm.toLowerCase();
    const matchSearch = item.name.toLowerCase().includes(s) || item.productCode.toLowerCase().includes(s);
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  // ── Handlers ──
  const toggleInUse = (id: string) => {
    const current = statusMap[id] ?? { inUse: false, location: '' };
    const next = { ...current, inUse: !current.inUse };
    if (!next.inUse) next.location = '';
    saveStatus({ ...statusMap, [id]: next });
    if (next.inUse) setOpenPopoverId(id);
  };

  const setLocation = (id: string, location: string) => {
    const current = statusMap[id] ?? { inUse: true, location: '' };
    saveStatus({ ...statusMap, [id]: { ...current, location } });
  };

  const handleAddItem = (item: RoboticsItem) => {
    saveCustomItems([...customItems, item]);
  };

  const inUseCount = Object.values(statusMap).filter(s => s.inUse).length;

  return (
    <div className="space-y-6" onClick={() => setOpenPopoverId(null)}>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Inventário da Robótica</h2>
          <p className="text-text-secondary mt-1 text-sm">
            Máquinas, Ferramentas, Insumos e EPIs da sala
          </p>
        </div>
        <div className="flex items-center gap-3">
          {inUseCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {inUseCount} em uso
            </motion.div>
          )}
          <button
            onClick={e => { e.stopPropagation(); setShowAddModal(true); }}
            className="flex items-center gap-2 bg-accent-primary hover:opacity-90 text-white font-black px-4 py-2 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.25)] text-sm"
          >
            <Plus className="w-4 h-4" />
            Adicionar Item
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white/[0.03] backdrop-blur-md p-3.5 rounded-2xl border border-white/5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar por nome ou código..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-accent-primary transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-8 text-white text-sm focus:outline-none focus:border-accent-primary appearance-none cursor-pointer"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'All' ? 'Todas as categorias' : cat}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/30 border-b border-white/10 text-text-muted text-xs uppercase tracking-widest">
                <th className="px-5 py-3.5 font-bold">Item</th>
                <th className="px-5 py-3.5 font-bold hidden sm:table-cell">Categoria</th>
                <th className="px-5 py-3.5 font-bold hidden md:table-cell">Código</th>
                <th className="px-5 py-3.5 font-bold text-center">Qtd</th>
                <th className="px-5 py-3.5 font-bold text-center">Em Uso</th>
                <th className="px-5 py-3.5 font-bold hidden lg:table-cell">Localização</th>
                <th className="px-5 py-3.5 font-bold hidden lg:table-cell">FIEMG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              <AnimatePresence initial={false}>
                {filteredItems.map(item => {
                  const status = statusMap[item.id] ?? { inUse: false, location: '' };
                  const catBadge = CATEGORY_BADGE[item.category] ?? 'bg-white/5 text-text-muted border-white/10';

                  return (
                    <motion.tr
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className={`group transition-colors ${status.inUse ? 'bg-amber-500/[0.04]' : 'hover:bg-white/[0.03]'}`}
                    >
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg border shrink-0 ${status.inUse ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/5 bg-white/[0.03] group-hover:border-white/10'} transition-colors`}>
                            {CATEGORY_ICONS[item.category] ?? <Package className="w-4 h-4 text-text-muted" />}
                          </div>
                          <span className="font-semibold text-sm text-text-primary leading-snug">{item.name.trim()}</span>
                          {customItems.find(c => c.id === item.id) && (
                            <span className="text-[10px] bg-accent-primary/10 text-accent-primary border border-accent-primary/20 px-1.5 py-0.5 rounded font-bold">novo</span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md border ${catBadge}`}>
                          {item.category}
                        </span>
                      </td>

                      {/* Code */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="font-mono text-xs text-text-muted">{item.productCode?.trim() || '—'}</span>
                      </td>

                      {/* Quantity */}
                      <td className="px-5 py-3.5 text-center">
                        <span className="font-black text-sm text-white tabular-nums">{item.quantity}</span>
                      </td>

                      {/* In-Use Toggle */}
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={e => { e.stopPropagation(); toggleInUse(item.id); }}
                          title={status.inUse ? 'Marcar como disponível' : 'Marcar como em uso'}
                          className="group/btn flex items-center justify-center mx-auto"
                        >
                          {status.inUse ? (
                            <CheckCircle2 className="w-5 h-5 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]" />
                          ) : (
                            <Circle className="w-5 h-5 text-text-muted/40 group-hover/btn:text-text-muted transition-colors" />
                          )}
                        </button>
                      </td>

                      {/* Location */}
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <div className="relative">
                          {status.inUse ? (
                            <button
                              onClick={e => { e.stopPropagation(); setOpenPopoverId(openPopoverId === item.id ? null : item.id); }}
                              className="flex items-center gap-1.5 text-xs text-amber-400/80 hover:text-amber-400 transition-colors group/loc"
                            >
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate max-w-[140px]">
                                {status.location || <span className="italic opacity-60">Informar local...</span>}
                              </span>
                            </button>
                          ) : (
                            <span className="text-text-muted/30 text-xs">—</span>
                          )}

                          <AnimatePresence>
                            {openPopoverId === item.id && (
                              <LocationPopover
                                location={status.location}
                                onSave={loc => setLocation(item.id, loc)}
                                onClose={() => setOpenPopoverId(null)}
                              />
                            )}
                          </AnimatePresence>
                        </div>
                      </td>

                      {/* FIEMG */}
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        {item.acquiredByFIEMG ? (
                          <span className={`text-xs font-bold px-2 py-1 rounded-md border ${item.acquiredByFIEMG.toLowerCase() === 'sim' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                            {item.acquiredByFIEMG}
                          </span>
                        ) : (
                          <span className="text-text-muted/30 text-xs">—</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted gap-3">
              <Search className="w-10 h-10 opacity-20" />
              <p className="text-sm font-semibold">Nenhum item encontrado</p>
              <p className="text-xs opacity-60">Tente um termo diferente ou limpe os filtros</p>
            </div>
          )}
        </div>

        {/* Footer count */}
        <div className="px-5 py-3 border-t border-white/5 bg-black/20 flex items-center justify-between">
          <span className="text-xs text-text-muted">
            Exibindo <span className="font-bold text-white">{filteredItems.length}</span> de <span className="font-bold text-white">{allItems.length}</span> itens
          </span>
          {customItems.length > 0 && (
            <span className="text-xs text-text-muted">
              <span className="text-accent-primary font-bold">{customItems.length}</span> {customItems.length === 1 ? 'item adicionado' : 'itens adicionados'} manualmente
            </span>
          )}
        </div>
      </div>

      {/* ── Add Item Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <AddItemModal
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddItem}
            existingCategories={Array.from(new Set(allItems.map(i => i.category)))}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoboticsInventory;

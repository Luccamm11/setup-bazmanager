import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Package, Search, Filter, Cpu, HardHat, Plus, Save, MapPin, Loader2 } from 'lucide-react';

export interface RoboticsItem {
  id: string;
  category: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  acquiredByFIEMG: string;
  productCode: string;
  inUse?: boolean;
  useLocation?: string;
}

const RoboticsInventory: React.FC = () => {
  const { t } = useTranslation(['common']);
  const [inventory, setInventory] = useState<RoboticsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Add item form state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<Partial<RoboticsItem>>({
    category: 'Ferramentas',
    name: '',
    quantity: 1,
    unitPrice: 0,
    acquiredByFIEMG: 'NÃO',
    productCode: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/robotics-inventory');
      const data = await response.json();
      if (data.success && data.items) {
        setInventory(data.items);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveInventory = async (newInventory: RoboticsItem[]) => {
    setIsSaving(true);
    try {
      await fetch('/api/robotics-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newInventory }),
      });
      setInventory(newInventory);
    } catch (error) {
      console.error('Failed to save inventory:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleInUse = (id: string, currentStatus: boolean) => {
    const updated = inventory.map(item => {
      if (item.id === id) {
        return { ...item, inUse: !currentStatus, useLocation: !currentStatus ? item.useLocation || '' : '' };
      }
      return item;
    });
    setInventory(updated); // Optimistic UI update
    saveInventory(updated);
  };

  const handleUpdateLocation = (id: string, location: string) => {
    const updated = inventory.map(item => {
      if (item.id === id) {
        return { ...item, useLocation: location };
      }
      return item;
    });
    setInventory(updated);
  };
  
  const handleLocationBlur = (id: string) => {
    // Save on blur
    saveInventory(inventory);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;
    
    const itemToAdd: RoboticsItem = {
      id: `item-${Date.now()}`,
      category: newItem.category || 'Ferramentas',
      name: newItem.name || '',
      quantity: Number(newItem.quantity) || 1,
      unitPrice: Number(newItem.unitPrice) || 0,
      subtotal: (Number(newItem.quantity) || 1) * (Number(newItem.unitPrice) || 0),
      acquiredByFIEMG: newItem.acquiredByFIEMG || 'NÃO',
      productCode: newItem.productCode || '',
      inUse: false,
      useLocation: ''
    };

    const updated = [itemToAdd, ...inventory];
    saveInventory(updated);
    setIsAddingItem(false);
    setNewItem({ category: 'Ferramentas', name: '', quantity: 1, unitPrice: 0, acquiredByFIEMG: 'NÃO', productCode: '' });
  };

  const categories = ['All', ...Array.from(new Set(inventory.map((item) => item.category)))];

  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.productCode && item.productCode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="text-center group mb-8">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3 drop-shadow-md group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all">Inventário da Robótica</h2>
        <p className="text-text-secondary">Controle de Máquinas, Ferramentas, Insumos e EPIs em tempo real</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-primary/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder="Pesquisar itens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-accent-primary transition-colors"
          />
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Filter className="w-5 h-5 text-text-muted hidden sm:block" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-accent-primary appearance-none flex-1 sm:flex-none cursor-pointer"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button 
            onClick={() => setIsAddingItem(!isAddingItem)}
            className="bg-accent-primary hover:bg-accent-secondary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shrink-0 shadow-glow-primary"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAddingItem && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddItem} className="bg-primary/60 backdrop-blur-md p-6 rounded-2xl border border-accent-primary/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] flex flex-col gap-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><Plus className="text-accent-primary" /> Novo Item</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1 uppercase">Nome do Item</label>
                  <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-accent-primary" placeholder="Ex: Motor DC 12V" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1 uppercase">Categoria</label>
                  <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-accent-primary appearance-none">
                    <option value="Ferramentas">Ferramentas</option>
                    <option value="Maquinas">Máquinas</option>
                    <option value="Insumos">Insumos</option>
                    <option value="EPIs">EPIs</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1 uppercase">Código / SKU</label>
                  <input type="text" value={newItem.productCode} onChange={e => setNewItem({...newItem, productCode: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-accent-primary" placeholder="OPCIONAL" />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-text-muted mb-1 uppercase">Qtd</label>
                    <input required type="number" min="1" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-accent-primary" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-text-muted mb-1 uppercase">FIEMG?</label>
                    <select value={newItem.acquiredByFIEMG} onChange={e => setNewItem({...newItem, acquiredByFIEMG: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-accent-primary appearance-none">
                      <option value="NÃO">NÃO</option>
                      <option value="SIM">SIM</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setIsAddingItem(false)} className="px-4 py-2 rounded-lg font-bold text-text-muted hover:text-white transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="bg-accent-primary hover:bg-accent-secondary text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Salvar Item
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-primary/40 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden shadow-lg relative">
        {isLoading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-accent-primary animate-spin" />
            </div>
        )}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-white/10 text-text-secondary text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Item</th>
                <th className="p-4 font-bold hidden sm:table-cell">Categoria</th>
                <th className="p-4 font-bold hidden md:table-cell">Código</th>
                <th className="p-4 font-bold text-center">Qtd</th>
                <th className="p-4 font-bold text-center hidden lg:table-cell">FIEMG</th>
                <th className="p-4 font-bold min-w-[200px]">Status de Uso</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredItems.map(item => (
                  <motion.tr 
                    key={item.id}
                    variants={itemVariants}
                    layout
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors group ${item.inUse ? 'bg-orange-500/5' : ''}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg border transition-colors shrink-0 ${item.inUse ? 'bg-orange-500/20 border-orange-500/30' : 'bg-black/20 border-white/5 group-hover:border-accent-primary/50'}`}>
                          {item.category === 'Ferramentas' ? <Wrench className={`w-5 h-5 ${item.inUse ? 'text-orange-400' : 'text-accent-tertiary'}`} /> :
                           item.category === 'Maquinas' ? <Cpu className={`w-5 h-5 ${item.inUse ? 'text-orange-400' : 'text-accent-secondary'}`} /> :
                           item.category === 'EPIs' ? <HardHat className={`w-5 h-5 ${item.inUse ? 'text-orange-400' : 'text-accent-primary'}`} /> :
                           <Package className={`w-5 h-5 ${item.inUse ? 'text-orange-400' : 'text-text-muted'}`} />}
                        </div>
                        <span className={`font-bold leading-tight ${item.inUse ? 'text-orange-100' : 'text-text-primary'}`}>{item.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-text-secondary text-sm hidden sm:table-cell">{item.category}</td>
                    <td className="p-4 text-text-secondary text-sm font-mono hidden md:table-cell">{item.productCode || '-'}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-md border font-bold inline-block ${item.inUse ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-white/5 border-white/10 text-white'}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="p-4 text-center hidden lg:table-cell">
                        {item.acquiredByFIEMG === 'SIM' ? (
                            <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20 text-[10px] font-bold uppercase tracking-wider">FIEMG</span>
                        ) : <span className="text-text-muted text-xs">-</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer w-max">
                           <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${item.inUse ? 'bg-orange-500' : 'bg-white/10'}`}>
                             <input type="checkbox" className="sr-only" checked={!!item.inUse} onChange={() => handleToggleInUse(item.id, !!item.inUse)} disabled={isSaving} />
                             <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${item.inUse ? 'translate-x-5' : 'translate-x-1'}`} />
                           </div>
                           <span className={`text-sm font-bold ${item.inUse ? 'text-orange-400' : 'text-text-muted'}`}>
                             {item.inUse ? 'Em Uso' : 'Livre'}
                           </span>
                        </label>
                        
                        {item.inUse && (
                           <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative flex items-center">
                              <MapPin className="absolute left-2 w-3.5 h-3.5 text-orange-500/70" />
                              <input 
                                type="text" 
                                value={item.useLocation || ''} 
                                onChange={(e) => handleUpdateLocation(item.id, e.target.value)}
                                onBlur={() => handleLocationBlur(item.id)}
                                placeholder="Onde está sendo usado?" 
                                className="w-full bg-black/40 border border-orange-500/30 rounded-md py-1 pl-7 pr-2 text-xs text-orange-100 focus:outline-none focus:border-orange-500/80 transition-colors placeholder:text-orange-500/40"
                              />
                           </motion.div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {!isLoading && filteredItems.length === 0 && (
            <div className="text-center py-16 text-text-muted flex flex-col items-center gap-3">
              <Package size={48} className="text-white/10" />
              <p className="text-lg">Nenhum item encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RoboticsInventory;

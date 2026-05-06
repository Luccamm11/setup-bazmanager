import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Package, Search, Filter, Cpu, HardHat } from 'lucide-react';
import inventoryData from '../data/robotics_inventory.json';

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

const RoboticsInventory: React.FC = () => {
  const { t } = useTranslation(['common']);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(inventoryData.map((item: any) => item.category)))];

  const filteredItems = (inventoryData as RoboticsItem[]).filter(item => {
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
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="text-center group">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3 drop-shadow-md group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all">Inventário da Robótica</h2>
        <p className="text-text-secondary">Controle de Máquinas, Ferramentas, Insumos e EPIs</p>
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
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-5 h-5 text-text-muted" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-accent-primary appearance-none flex-1 sm:flex-none cursor-pointer"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-primary/40 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-white/10 text-text-secondary text-sm">
                <th className="p-4 font-bold tracking-wider">Item</th>
                <th className="p-4 font-bold tracking-wider hidden sm:table-cell">Categoria</th>
                <th className="p-4 font-bold tracking-wider hidden md:table-cell">Código</th>
                <th className="p-4 font-bold tracking-wider">Qtd</th>
                <th className="p-4 font-bold tracking-wider hidden lg:table-cell">FIEMG</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredItems.map(item => (
                  <motion.tr 
                    key={item.id}
                    variants={itemVariants}
                    layout
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-black/20 p-2 rounded-lg border border-white/5 group-hover:border-accent-primary/50 transition-colors shrink-0">
                          {item.category === 'Ferramentas' ? <Wrench className="w-5 h-5 text-accent-tertiary" /> :
                           item.category === 'Maquinas' ? <Cpu className="w-5 h-5 text-accent-secondary" /> :
                           item.category === 'EPIs' ? <HardHat className="w-5 h-5 text-accent-primary" /> :
                           <Package className="w-5 h-5 text-text-muted" />}
                        </div>
                        <span className="font-bold text-text-primary leading-tight">{item.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-text-secondary text-sm hidden sm:table-cell">{item.category}</td>
                    <td className="p-4 text-text-secondary text-sm font-mono hidden md:table-cell">{item.productCode || '-'}</td>
                    <td className="p-4">
                      <span className="bg-white/5 px-3 py-1 rounded-md border border-white/10 text-white font-bold inline-block">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="p-4 text-text-secondary text-sm hidden lg:table-cell">
                        {item.acquiredByFIEMG ? (
                            <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20 text-xs font-bold uppercase">{item.acquiredByFIEMG}</span>
                        ) : '-'}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <div className="text-center py-16 text-text-muted">
              Nenhum item encontrado.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RoboticsInventory;

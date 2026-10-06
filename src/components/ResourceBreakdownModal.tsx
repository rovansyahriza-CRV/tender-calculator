import React, { useState, useMemo } from 'react';
import type { TreatmentItem, ResourceDetailItem, BoQItem } from '../App';
import { ResourceLookupModal } from './ResourceLookupModal';
import { MarketPriceLookupWidget } from './MarketPriceLookupWidget';
import type { MasterManpower, MasterEquipment, MasterMaterialItem } from '../data/resourceMasterData';
import { 
  X, 
  Plus, 
  Trash2, 
  HardHat, 
  Wrench, 
  Layers,
  Package, 
  Check, 
  Calculator, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  TrendingUp,
  Link2,
  RefreshCw
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  treatment: TreatmentItem | null;
  boqQty?: number;
  boqUnit?: string;
  boqOutputPerDay?: number;
  allBoqItems?: BoQItem[];
  onClose: () => void;
  onSave: (
    updatedTreatment: TreatmentItem, 
    syncOptions?: { syncToAllItems: boolean; syncToMaster: boolean }
  ) => void;
}

export const ResourceBreakdownModal: React.FC<Props> = ({
  isOpen,
  treatment,
  boqQty = 1,
  boqUnit = 'Lot',
  boqOutputPerDay = 1,
  allBoqItems = [],
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'manpower' | 'equipment' | 'material' | 'consumable'>('manpower');

  // Lookup Modal State
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [lookupType, setLookupType] = useState<'manpower' | 'equipment' | 'material' | 'consumable'>('manpower');

  // Inline Expansion States
  const [expandedManpowerIds, setExpandedManpowerIds] = useState<Record<string, boolean>>({});
  const [expandedEquipmentIds, setExpandedEquipmentIds] = useState<Record<string, boolean>>({});
  const [expandedMaterialIds, setExpandedMaterialIds] = useState<Record<string, boolean>>({});
  const [expandedConsumableIds, setExpandedConsumableIds] = useState<Record<string, boolean>>({});

  // Project-wide Resource Synchronization States
  const [syncToAllItems, setSyncToAllItems] = useState<boolean>(true);
  const [syncToMaster, setSyncToMaster] = useState<boolean>(true);

  // Mapping of resource names used in other treatments across the active tender project
  const otherOccurrences = useMemo(() => {
    if (!allBoqItems || allBoqItems.length === 0 || !treatment) return {};
    const map: Record<string, string[]> = {};
    
    allBoqItems.forEach(b => {
      (b.treatments || []).forEach(tr => {
        if (tr.id === treatment.id) return; // skip self
        const label = `${b.itemNo ? b.itemNo + ' - ' : ''}${tr.description}`;

        (tr.manpowerList || []).forEach(m => {
          const k = m.name.trim().toLowerCase();
          if (!map[k]) map[k] = [];
          if (!map[k].includes(label)) map[k].push(label);
        });

        (tr.equipmentList || []).forEach(e => {
          const k = e.name.trim().toLowerCase();
          if (!map[k]) map[k] = [];
          if (!map[k].includes(label)) map[k].push(label);
        });

        (tr.materialList || []).forEach(mat => {
          const k = mat.name.trim().toLowerCase();
          if (!map[k]) map[k] = [];
          if (!map[k].includes(label)) map[k].push(label);
        });

        (tr.consumableList || []).forEach(cs => {
          const k = cs.name.trim().toLowerCase();
          if (!map[k]) map[k] = [];
          if (!map[k].includes(label)) map[k].push(label);
        });
      });
    });

    return map;
  }, [allBoqItems, treatment]);

  // 1. Manpower List State
  const [manpowerList, setManpowerList] = useState<ResourceDetailItem[]>(() => {
    if (!treatment) return [];
    if (treatment.manpowerList && treatment.manpowerList.length > 0) {
      return treatment.manpowerList.map(item => {
        const copy = { ...item };
        if (copy.basicSalary === undefined) {
          const bSalary = Math.round(copy.rate * 0.72);
          const ppe = Math.round(copy.rate * 0.10);
          const bpjs = Math.round(copy.rate * 0.08);
          const meals = copy.rate - bSalary - ppe - bpjs;
          copy.basicSalary = bSalary;
          copy.ppeDaily = ppe;
          copy.jamsostekDaily = bpjs;
          copy.mealsDaily = Math.max(0, meals);
          copy.otherAllowanceDaily = 0;
        }
        return copy;
      });
    }
    return treatment.crewDailyRate > 0 
      ? [{
          id: `mp-${Date.now()}-1`,
          name: 'Kru Lapangan Terpadu',
          qty: 1,
          unit: 'org',
          rate: treatment.crewDailyRate,
          basicSalary: Math.round(treatment.crewDailyRate * 0.72),
          ppeDaily: Math.round(treatment.crewDailyRate * 0.10),
          jamsostekDaily: Math.round(treatment.crewDailyRate * 0.08),
          mealsDaily: treatment.crewDailyRate - Math.round(treatment.crewDailyRate * 0.90),
          otherAllowanceDaily: 0
        }]
      : [];
  });

  // 2. Equipment List State
  const [equipmentList, setEquipmentList] = useState<ResourceDetailItem[]>(() => {
    if (!treatment) return [];
    if (treatment.equipmentList && treatment.equipmentList.length > 0) {
      return treatment.equipmentList.map(item => {
        const copy = { ...item };
        if (copy.baseRentalRate === undefined) {
          const base = Math.round(copy.rate * 0.70);
          const bbm = Math.round(copy.rate * 0.20);
          const maint = copy.rate - base - bbm;
          copy.baseRentalRate = base;
          copy.fuelType = 'Solar';
          copy.fuelLitersPerDay = bbm > 0 ? Math.max(1, Math.round(bbm / 14500)) : 0;
          copy.fuelPricePerLiter = 14500;
          copy.bbmRate = bbm;
          copy.maintenanceRate = Math.max(0, maint);
          copy.mobilizationDaily = 0;
        }
        return copy;
      });
    }
    return treatment.equipmentDailyRate > 0 
      ? [{
          id: `eq-${Date.now()}-1`,
          name: 'Paket Peralatan & Tools',
          qty: 1,
          unit: 'set',
          rate: treatment.equipmentDailyRate,
          baseRentalRate: Math.round(treatment.equipmentDailyRate * 0.70),
          fuelType: 'Solar',
          fuelLitersPerDay: Math.max(1, Math.round((treatment.equipmentDailyRate * 0.20) / 14500)),
          fuelPricePerLiter: 14500,
          bbmRate: Math.round(treatment.equipmentDailyRate * 0.20),
          maintenanceRate: treatment.equipmentDailyRate - Math.round(treatment.equipmentDailyRate * 0.90),
          mobilizationDaily: 0
        }]
      : [];
  });

  // 3. Material Utama List State
  const [materialList, setMaterialList] = useState<ResourceDetailItem[]>(() => {
    if (!treatment) return [];
    if (treatment.materialList && treatment.materialList.length > 0) {
      return treatment.materialList.map(item => ({ ...item }));
    }
    return (treatment.materialUnitRate && treatment.materialUnitRate > 0)
      ? [{ id: `mat-${Date.now()}-1`, name: 'Material Utama Terpadu', qty: 1, unit: treatment.unit || 'unit', rate: treatment.materialUnitRate }]
      : [];
  });

  // 4. Consumables List State
  const [consumableList, setConsumableList] = useState<ResourceDetailItem[]>(() => {
    if (!treatment) return [];
    if (treatment.consumableList && treatment.consumableList.length > 0) {
      return treatment.consumableList.map(item => ({ ...item }));
    }
    return treatment.consumableUnitRate > 0 
      ? [{ id: `cs-${Date.now()}-1`, name: 'Bahan Consumables Terpadu', qty: 1, unit: treatment.unit || 'unit', rate: treatment.consumableUnitRate }]
      : [];
  });

  const totalSharedResourcesCount = useMemo(() => {
    let count = 0;
    const seen = new Set<string>();
    [...manpowerList, ...equipmentList, ...materialList, ...consumableList].forEach(item => {
      const k = item.name.trim().toLowerCase();
      if (!seen.has(k) && otherOccurrences[k]?.length > 0) {
        seen.add(k);
        count++;
      }
    });
    return count;
  }, [manpowerList, equipmentList, materialList, consumableList, otherOccurrences]);

  if (!isOpen || !treatment) return null;

  // Real-time Sum Calculations (Paket Resources Harian)
  const totalCrewDailyRate = manpowerList.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const totalEquipmentDailyRate = equipmentList.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const totalMaterialUnitRate = materialList.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const totalConsumableUnitRate = consumableList.reduce((sum, item) => sum + (item.qty * item.rate), 0);

  const totalDailySpread = totalCrewDailyRate + totalEquipmentDailyRate + totalMaterialUnitRate + totalConsumableUnitRate;
  const effectiveOutput = boqOutputPerDay > 0 ? boqOutputPerDay : 1;
  const unitPriceContribution = effectiveOutput > 0 ? (totalDailySpread / effectiveOutput) : 0;
  const totalTreatmentDirectCost = unitPriceContribution * (boqQty || 0);
  const estimatedDuration = (boqQty > 0 && effectiveOutput > 0) ? (boqQty / effectiveOutput) : 0;

  // Toggle Handlers
  const toggleExpandManpower = (id: string) => {
    setExpandedManpowerIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpandEquipment = (id: string) => {
    setExpandedEquipmentIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpandMaterial = (id: string) => {
    setExpandedMaterialIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpandConsumable = (id: string) => {
    setExpandedConsumableIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Open Master Lookup Modal
  const handleOpenLookup = (whichType: 'manpower' | 'equipment' | 'material' | 'consumable') => {
    setLookupType(whichType);
    setIsLookupOpen(true);
  };

  // Select From Master Handlers
  const handleSelectMasterManpower = (m: MasterManpower) => {
    const newItem: ResourceDetailItem = {
      id: `mp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: m.role,
      qty: 1,
      unit: 'org',
      rate: m.totalRate,
      basicSalary: m.basicSalary,
      ppeDaily: m.ppeDaily,
      jamsostekDaily: m.jamsostekDaily,
      mealsDaily: m.mealsDaily,
      otherAllowanceDaily: m.otherAllowanceDaily
    };
    setManpowerList(prev => [...prev, newItem]);
    setExpandedManpowerIds(prev => ({ ...prev, [newItem.id]: true }));
  };

  const handleSelectMasterEquipment = (e: MasterEquipment) => {
    const newItem: ResourceDetailItem = {
      id: `eq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: e.name,
      qty: 1,
      unit: 'unit',
      rate: e.totalRate,
      baseRentalRate: e.baseRentalRate,
      fuelType: e.fuelType,
      fuelLitersPerDay: e.fuelLitersPerDay,
      fuelPricePerLiter: e.fuelPricePerLiter,
      bbmRate: e.bbmRate,
      maintenanceRate: e.maintenanceRate,
      mobilizationDaily: e.mobilizationDaily
    };
    setEquipmentList(prev => [...prev, newItem]);
    setExpandedEquipmentIds(prev => ({ ...prev, [newItem.id]: true }));
  };

  const handleSelectMasterMaterial = (m: MasterMaterialItem) => {
    const newItem: ResourceDetailItem = {
      id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: m.name,
      qty: 1,
      unit: m.unit || 'unit',
      rate: m.standardRate
    };
    setMaterialList(prev => [...prev, newItem]);
  };

  const handleSelectMasterConsumable = (c: MasterMaterialItem) => {
    const newItem: ResourceDetailItem = {
      id: `cs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: c.name,
      qty: 1,
      unit: c.unit || 'pcs',
      rate: c.standardRate
    };
    setConsumableList(prev => [...prev, newItem]);
  };

  // Handlers for Manpower
  const handleAddManpower = () => {
    const newItem: ResourceDetailItem = {
      id: `mp-${Date.now()}`,
      name: 'Tenaga Kerja Baru',
      qty: 1,
      unit: 'org',
      rate: 250000,
      basicSalary: 180000,
      ppeDaily: 25000,
      jamsostekDaily: 20000,
      mealsDaily: 25000,
      otherAllowanceDaily: 0
    };
    setManpowerList(prev => [...prev, newItem]);
    setExpandedManpowerIds(prev => ({ ...prev, [newItem.id]: true }));
  };

  const handleUpdateManpower = (id: string, field: keyof ResourceDetailItem, val: string | number) => {
    setManpowerList(prev => prev.map(item => {
      if (item.id !== id) return item;
      if (field === 'rate') {
        const numRate = typeof val === 'number' ? val : (parseFloat(val as string) || 0);
        const ppe = item.ppeDaily || 0;
        const bpjs = item.jamsostekDaily || 0;
        const meals = item.mealsDaily || 0;
        const other = item.otherAllowanceDaily || 0;
        const totalAddons = ppe + bpjs + meals + other;
        return {
          ...item,
          rate: numRate,
          basicSalary: Math.max(0, numRate - totalAddons)
        };
      }
      return { ...item, [field]: val };
    }));
  };

  const handleUpdateManpowerVariable = (id: string, varField: keyof ResourceDetailItem, val: number) => {
    setManpowerList(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [varField]: val };
      const bSalary = updated.basicSalary !== undefined ? updated.basicSalary : 0;
      const ppe = updated.ppeDaily || 0;
      const bpjs = updated.jamsostekDaily || 0;
      const meals = updated.mealsDaily || 0;
      const other = updated.otherAllowanceDaily || 0;
      const newTotal = bSalary + ppe + bpjs + meals + other;
      return {
        ...updated,
        rate: newTotal
      };
    }));
  };

  const handleDeleteManpower = (id: string) => {
    setManpowerList(prev => prev.filter(item => item.id !== id));
  };

  // Handlers for Equipment
  const handleAddEquipment = () => {
    const newItem: ResourceDetailItem = {
      id: `eq-${Date.now()}`,
      name: 'Alat / Mesin Baru',
      qty: 1,
      unit: 'unit',
      rate: 350000,
      baseRentalRate: 200000,
      fuelType: 'Solar',
      fuelLitersPerDay: 8,
      fuelPricePerLiter: 14500,
      bbmRate: 116000,
      maintenanceRate: 34000,
      mobilizationDaily: 0
    };
    setEquipmentList(prev => [...prev, newItem]);
    setExpandedEquipmentIds(prev => ({ ...prev, [newItem.id]: true }));
  };

  const handleUpdateEquipment = (id: string, field: keyof ResourceDetailItem, val: string | number) => {
    setEquipmentList(prev => prev.map(item => {
      if (item.id !== id) return item;
      if (field === 'rate') {
        const numRate = typeof val === 'number' ? val : (parseFloat(val as string) || 0);
        const bbm = item.bbmRate || 0;
        const maint = item.maintenanceRate || 0;
        const mob = item.mobilizationDaily || 0;
        const totalAddons = bbm + maint + mob;
        return {
          ...item,
          rate: numRate,
          baseRentalRate: Math.max(0, numRate - totalAddons)
        };
      }
      return { ...item, [field]: val };
    }));
  };

  const handleUpdateEquipmentVariable = (id: string, varField: keyof ResourceDetailItem, val: string | number) => {
    setEquipmentList(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [varField]: val };
      
      const base = updated.baseRentalRate !== undefined ? updated.baseRentalRate : 0;
      let bbm = updated.bbmRate || 0;
      const maint = updated.maintenanceRate || 0;
      const mob = updated.mobilizationDaily || 0;

      if (varField === 'fuelLitersPerDay' || varField === 'fuelPricePerLiter' || varField === 'fuelType') {
        if (updated.fuelType === 'None' || updated.fuelType === 'Listrik') {
          bbm = 0;
          updated.bbmRate = 0;
        } else {
          const lpd = updated.fuelLitersPerDay || 0;
          const ppl = updated.fuelPricePerLiter || 14500;
          bbm = Math.round(lpd * ppl);
          updated.bbmRate = bbm;
        }
      }

      const newTotal = base + bbm + maint + mob;
      return {
        ...updated,
        rate: newTotal
      };
    }));
  };

  const handleDeleteEquipment = (id: string) => {
    setEquipmentList(prev => prev.filter(item => item.id !== id));
  };

  // Handlers for Material Utama
  const handleAddMaterial = () => {
    const newItem: ResourceDetailItem = {
      id: `mat-${Date.now()}`,
      name: 'Material Utama Baru',
      qty: 1,
      unit: treatment.unit || 'meter',
      rate: 150000
    };
    setMaterialList(prev => [...prev, newItem]);
    setExpandedMaterialIds(prev => ({ ...prev, [newItem.id]: true }));
  };

  const handleUpdateMaterial = (id: string, field: keyof ResourceDetailItem, val: string | number) => {
    setMaterialList(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const handleDeleteMaterial = (id: string) => {
    setMaterialList(prev => prev.filter(item => item.id !== id));
  };

  // Handlers for Consumables
  const handleAddConsumable = () => {
    const newItem: ResourceDetailItem = {
      id: `cs-${Date.now()}`,
      name: 'Bahan Consumables Baru',
      qty: 1,
      unit: 'pcs',
      rate: 25000
    };
    setConsumableList(prev => [...prev, newItem]);
    setExpandedConsumableIds(prev => ({ ...prev, [newItem.id]: true }));
  };

  const handleUpdateConsumable = (id: string, field: keyof ResourceDetailItem, val: string | number) => {
    setConsumableList(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const handleDeleteConsumable = (id: string) => {
    setConsumableList(prev => prev.filter(item => item.id !== id));
  };

  const handleSyncMasterItemToBreakdown = (
    resType: 'manpower' | 'equipment' | 'material' | 'consumable',
    item: MasterManpower | MasterEquipment | MasterMaterialItem
  ) => {
    if (resType === 'manpower') {
      const mp = item as MasterManpower;
      setManpowerList(prev => prev.map(m => {
        if (m.name.trim().toLowerCase() === mp.role.trim().toLowerCase()) {
          return {
            ...m,
            rate: mp.totalRate,
            basicSalary: mp.basicSalary,
            ppeDaily: mp.ppeDaily,
            jamsostekDaily: mp.jamsostekDaily,
            mealsDaily: mp.mealsDaily,
            otherAllowanceDaily: mp.otherAllowanceDaily
          };
        }
        return m;
      }));
    } else if (resType === 'equipment') {
      const eq = item as MasterEquipment;
      setEquipmentList(prev => prev.map(e => {
        if (e.name.trim().toLowerCase() === eq.name.trim().toLowerCase()) {
          return {
            ...e,
            rate: eq.totalRate,
            baseRentalRate: eq.baseRentalRate,
            fuelType: eq.fuelType,
            fuelLitersPerDay: eq.fuelLitersPerDay,
            fuelPricePerLiter: eq.fuelPricePerLiter,
            bbmRate: eq.bbmRate,
            maintenanceRate: eq.maintenanceRate,
            mobilizationDaily: eq.mobilizationDaily
          };
        }
        return e;
      }));
    } else if (resType === 'material') {
      const mi = item as MasterMaterialItem;
      setMaterialList(prev => prev.map(mat => {
        if (mat.name.trim().toLowerCase() === mi.name.trim().toLowerCase()) {
          return {
            ...mat,
            rate: mi.standardRate,
            unit: mi.unit || mat.unit
          };
        }
        return mat;
      }));
    } else if (resType === 'consumable') {
      const cs = item as MasterMaterialItem;
      setConsumableList(prev => prev.map(c => {
        if (c.name.trim().toLowerCase() === cs.name.trim().toLowerCase()) {
          return {
            ...c,
            rate: cs.standardRate,
            unit: cs.unit || c.unit
          };
        }
        return c;
      }));
    }
  };

  const handleSave = () => {
    const updated: TreatmentItem = {
      ...treatment,
      qty: 1, // Treatment represents daily package
      outputPerDay: effectiveOutput,
      crewDailyRate: totalCrewDailyRate,
      equipmentDailyRate: totalEquipmentDailyRate,
      materialUnitRate: totalMaterialUnitRate,
      consumableUnitRate: totalConsumableUnitRate,
      manpowerList,
      equipmentList,
      materialList,
      consumableList
    };

    onSave(updated, { syncToAllItems, syncToMaster });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(3px)', padding: '16px' }}>
      <div 
        style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '12px', 
          width: '100%', 
          maxWidth: '920px', 
          maxHeight: '94vh', 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          fontFamily: 'Segoe UI, Tahoma, sans-serif'
        }}
      >
        {/* 1. Header Modal */}
        <div style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '16px 20px', borderBottom: '3px solid #2563eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', background: '#2563eb', color: '#ffffff', padding: '2px 8px', borderRadius: '4px' }}>
                {treatment.category}
              </span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>
                Rincian Turunan Resources (Daily Spread Package)
              </h3>
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
              {treatment.description} • Paket Harian (Item BoQ: {boqQty.toLocaleString('id-ID')} {treatment.unit || boqUnit} | Target Output: {effectiveOutput} {treatment.unit || boqUnit}/hari)
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 2. Resource Tabs Switcher (4 Distinct Groups) */}
        <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', backgroundColor: '#f8fafc', padding: '0 16px', overflowX: 'auto' }}>
          {/* TAB 1: MANPOWER */}
          <button
            onClick={() => setActiveTab('manpower')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderBottom: activeTab === 'manpower' ? '3px solid #2563eb' : '3px solid transparent',
              color: activeTab === 'manpower' ? '#2563eb' : '#64748b',
              whiteSpace: 'nowrap'
            }}
          >
            <HardHat size={15} />
            1. Tenaga Kerja ({manpowerList.length})
            <span style={{ background: activeTab === 'manpower' ? '#dbeafe' : '#e2e8f0', color: activeTab === 'manpower' ? '#1e40af' : '#475569', padding: '1px 6px', borderRadius: '10px', fontSize: '10px', fontFamily: 'monospace' }}>
              Rp {totalCrewDailyRate.toLocaleString('id-ID')}/hr
            </span>
          </button>

          {/* TAB 2: EQUIPMENT */}
          <button
            onClick={() => setActiveTab('equipment')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderBottom: activeTab === 'equipment' ? '3px solid #d97706' : '3px solid transparent',
              color: activeTab === 'equipment' ? '#d97706' : '#64748b',
              whiteSpace: 'nowrap'
            }}
          >
            <Wrench size={15} />
            2. Peralatan & Tools ({equipmentList.length})
            <span style={{ background: activeTab === 'equipment' ? '#fef3c7' : '#e2e8f0', color: activeTab === 'equipment' ? '#92400e' : '#475569', padding: '1px 6px', borderRadius: '10px', fontSize: '10px', fontFamily: 'monospace' }}>
              Rp {totalEquipmentDailyRate.toLocaleString('id-ID')}/hr
            </span>
          </button>

          {/* TAB 3: MATERIAL UTAMA */}
          <button
            onClick={() => setActiveTab('material')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderBottom: activeTab === 'material' ? '3px solid #059669' : '3px solid transparent',
              color: activeTab === 'material' ? '#059669' : '#64748b',
              whiteSpace: 'nowrap'
            }}
          >
            <Layers size={15} />
            3. Material Utama ({materialList.length})
            <span style={{ background: activeTab === 'material' ? '#dcfce7' : '#e2e8f0', color: activeTab === 'material' ? '#166534' : '#475569', padding: '1px 6px', borderRadius: '10px', fontSize: '10px', fontFamily: 'monospace' }}>
              Rp {Math.round(totalMaterialUnitRate).toLocaleString('id-ID')}/{treatment.unit}
            </span>
          </button>

          {/* TAB 4: CONSUMABLES */}
          <button
            onClick={() => setActiveTab('consumable')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderBottom: activeTab === 'consumable' ? '3px solid #7c3aed' : '3px solid transparent',
              color: activeTab === 'consumable' ? '#7c3aed' : '#64748b',
              whiteSpace: 'nowrap'
            }}
          >
            <Package size={15} />
            4. Bahan & Consumables ({consumableList.length})
            <span style={{ background: activeTab === 'consumable' ? '#f3e8ff' : '#e2e8f0', color: activeTab === 'consumable' ? '#6b21a8' : '#475569', padding: '1px 6px', borderRadius: '10px', fontSize: '10px', fontFamily: 'monospace' }}>
              Rp {Math.round(totalConsumableUnitRate).toLocaleString('id-ID')}/{treatment.unit}
            </span>
          </button>
        </div>

        {/* 3. Tab Body Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: '#f1f5f9' }}>
          
          {/* ========================================== */}
          {/* TAB 1: MANPOWER */}
          {/* ========================================== */}
          {activeTab === 'manpower' && (
            <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>Daftar Tenaga Kerja / Kru Gabungan</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                    Variabel pembentuk mandays: Gaji Pokok + APD/PPE + BPJS/Jamsostek + Uang Makan & Mess
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenLookup('manpower')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    <BookOpen size={13} /> ⚡ Lookup Master Tenaga Kerja
                  </button>
                  <button
                    type="button"
                    onClick={handleAddManpower}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} /> + Tambah Manual
                  </button>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#475569' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Jabatan & Komponen Biaya</th>
                    <th style={{ padding: '8px', textAlign: 'right', width: '75px' }}>Jumlah (Org)</th>
                    <th style={{ padding: '8px', textAlign: 'right', width: '135px' }}>Total Upah / Org / Hr</th>
                    <th style={{ padding: '8px', textAlign: 'right', width: '135px' }}>Subtotal (Rp/Hari)</th>
                    <th style={{ padding: '8px', textAlign: 'center', width: '65px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {manpowerList.map(item => {
                    const isExpanded = !!expandedManpowerIds[item.id];
                    return (
                      <React.Fragment key={item.id}>
                        <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid #f1f5f9', background: isExpanded ? '#f8fafc' : '#ffffff' }}>
                          <td style={{ padding: '6px 8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input 
                                type="text"
                                value={item.name}
                                onChange={(e) => handleUpdateManpower(item.id, 'name', e.target.value)}
                                style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}
                              />
                              {otherOccurrences[item.name.trim().toLowerCase()]?.length > 0 && (
                                <span
                                  title={`Resource ini juga digunakan di ${otherOccurrences[item.name.trim().toLowerCase()].length} item pekerjaan lain:\n• ${otherOccurrences[item.name.trim().toLowerCase()].join('\n• ')}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    background: '#eff6ff',
                                    color: '#1d4ed8',
                                    border: '1px solid #bfdbfe',
                                    borderRadius: '4px',
                                    padding: '2px 6px',
                                    whiteSpace: 'nowrap',
                                    cursor: 'help'
                                  }}
                                >
                                  <Link2 size={11} /> {otherOccurrences[item.name.trim().toLowerCase()].length} item lain
                                </span>
                              )}
                            </div>
                          </td>

                          <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                            <input 
                              type="number"
                              value={item.qty}
                              onChange={(e) => handleUpdateManpower(item.id, 'qty', parseFloat(e.target.value) || 0)}
                              style={{ width: '55px', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}
                            />
                          </td>

                          <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                            <input 
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleUpdateManpower(item.id, 'rate', parseFloat(e.target.value) || 0)}
                              style={{ width: '110px', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#1e40af' }}
                            />
                          </td>

                          <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#047857' }}>
                            Rp {(item.qty * item.rate).toLocaleString('id-ID')}
                          </td>

                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => toggleExpandManpower(item.id)}
                                title="Rincian Variabel APD & BPJS"
                                style={{ background: 'none', border: 'none', color: isExpanded ? '#2563eb' : '#64748b', cursor: 'pointer', padding: '2px' }}
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteManpower(item.id)}
                                title="Hapus posisi ini"
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <td colSpan={5} style={{ padding: '8px 12px 14px' }}>
                              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: '#475569', fontWeight: 'bold', marginBottom: '2px' }}>Gaji Pokok (Rp)</label>
                                    <input
                                      type="number"
                                      value={item.basicSalary ?? item.rate}
                                      onChange={(e) => handleUpdateManpowerVariable(item.id, 'basicSalary', parseFloat(e.target.value) || 0)}
                                      style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: '#0284c7', fontWeight: 'bold', marginBottom: '2px' }}>APD / PPE (Rp)</label>
                                    <input
                                      type="number"
                                      value={item.ppeDaily ?? 0}
                                      onChange={(e) => handleUpdateManpowerVariable(item.id, 'ppeDaily', parseFloat(e.target.value) || 0)}
                                      style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: '#059669', fontWeight: 'bold', marginBottom: '2px' }}>BPJS / Jamsostek (Rp)</label>
                                    <input
                                      type="number"
                                      value={item.jamsostekDaily ?? 0}
                                      onChange={(e) => handleUpdateManpowerVariable(item.id, 'jamsostekDaily', parseFloat(e.target.value) || 0)}
                                      style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: '#d97706', fontWeight: 'bold', marginBottom: '2px' }}>Makan & Mess (Rp)</label>
                                    <input
                                      type="number"
                                      value={item.mealsDaily ?? 0}
                                      onChange={(e) => handleUpdateManpowerVariable(item.id, 'mealsDaily', parseFloat(e.target.value) || 0)}
                                      style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: '#7c3aed', fontWeight: 'bold', marginBottom: '2px' }}>Tunjangan Lain (Rp)</label>
                                    <input
                                      type="number"
                                      value={item.otherAllowanceDaily ?? 0}
                                      onChange={(e) => handleUpdateManpowerVariable(item.id, 'otherAllowanceDaily', parseFloat(e.target.value) || 0)}
                                      style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {manpowerList.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        Belum ada tenaga kerja. Klik "⚡ Lookup Master Tenaga Kerja" atau "+ Tambah Manual" di atas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div style={{ marginTop: '12px', padding: '10px 14px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af' }}>Total Biaya Kru per Hari:</span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#1e40af', fontFamily: 'monospace' }}>
                  Rp {totalCrewDailyRate.toLocaleString('id-ID')} / hari
                </span>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: EQUIPMENT */}
          {/* ========================================== */}
          {activeTab === 'equipment' && (
            <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>Daftar Peralatan & Tools Kerja</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                    Komponen sewa harian (Wet Rate): Sewa Unit Dasar (Dry) + Biaya BBM + Pelumas/Servis + Mob/Demob
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenLookup('equipment')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#fffbeb',
                      color: '#b45309',
                      border: '1px solid #fde68a',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    <BookOpen size={13} /> ⚡ Lookup Master Peralatan
                  </button>
                  <button
                    type="button"
                    onClick={handleAddEquipment}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#d97706',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} /> + Tambah Manual
                  </button>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#475569' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Nama Alat / Mesin</th>
                    <th style={{ padding: '8px', textAlign: 'right', width: '75px' }}>Jumlah</th>
                    <th style={{ padding: '8px', textAlign: 'center', width: '55px' }}>Satuan</th>
                    <th style={{ padding: '8px', textAlign: 'right', width: '135px' }}>Tarif Sewa Wet / Hari</th>
                    <th style={{ padding: '8px', textAlign: 'right', width: '135px' }}>Subtotal (Rp/Hari)</th>
                    <th style={{ padding: '8px', textAlign: 'center', width: '65px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {equipmentList.map(item => {
                    const isExpanded = !!expandedEquipmentIds[item.id];
                    return (
                      <React.Fragment key={item.id}>
                        <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid #f1f5f9', background: isExpanded ? '#f8fafc' : '#ffffff' }}>
                          <td style={{ padding: '6px 8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input 
                                type="text"
                                value={item.name}
                                onChange={(e) => handleUpdateEquipment(item.id, 'name', e.target.value)}
                                style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}
                              />
                              {otherOccurrences[item.name.trim().toLowerCase()]?.length > 0 && (
                                <span
                                  title={`Peralatan ini juga digunakan di ${otherOccurrences[item.name.trim().toLowerCase()].length} item pekerjaan lain:\n• ${otherOccurrences[item.name.trim().toLowerCase()].join('\n• ')}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    background: '#fffbeb',
                                    color: '#b45309',
                                    border: '1px solid #fde68a',
                                    borderRadius: '4px',
                                    padding: '2px 6px',
                                    whiteSpace: 'nowrap',
                                    cursor: 'help'
                                  }}
                                >
                                  <Link2 size={11} /> {otherOccurrences[item.name.trim().toLowerCase()].length} item lain
                                </span>
                              )}
                            </div>
                          </td>

                          <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                            <input 
                              type="number"
                              value={item.qty}
                              onChange={(e) => handleUpdateEquipment(item.id, 'qty', parseFloat(e.target.value) || 0)}
                              style={{ width: '55px', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}
                            />
                          </td>

                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                            <input 
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleUpdateEquipment(item.id, 'unit', e.target.value)}
                              style={{ width: '45px', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', textAlign: 'center' }}
                            />
                          </td>

                          <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                            <input 
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleUpdateEquipment(item.id, 'rate', parseFloat(e.target.value) || 0)}
                              style={{ width: '110px', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#b45309' }}
                            />
                          </td>

                          <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#047857' }}>
                            Rp {(item.qty * item.rate).toLocaleString('id-ID')}
                          </td>

                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => toggleExpandEquipment(item.id)}
                                title="Rincian Variabel BBM & Maintenance"
                                style={{ background: 'none', border: 'none', color: isExpanded ? '#d97706' : '#64748b', cursor: 'pointer', padding: '2px' }}
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEquipment(item.id)}
                                title="Hapus peralatan ini"
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <td colSpan={6} style={{ padding: '8px 12px 14px' }}>
                              <div style={{ background: '#ffffff', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: '#475569', fontWeight: 'bold', marginBottom: '2px' }}>Sewa Pokok Dry (Rp)</label>
                                    <input
                                      type="number"
                                      value={item.baseRentalRate ?? item.rate}
                                      onChange={(e) => handleUpdateEquipmentVariable(item.id, 'baseRentalRate', parseFloat(e.target.value) || 0)}
                                      style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: '#b45309', fontWeight: 'bold', marginBottom: '2px' }}>Jenis BBM</label>
                                    <select
                                      value={item.fuelType || 'Solar'}
                                      onChange={(e) => handleUpdateEquipmentVariable(item.id, 'fuelType', e.target.value)}
                                      style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                                    >
                                      <option value="Solar">Solar Industri</option>
                                      <option value="Bensin">Bensin / Pertalite</option>
                                      <option value="Listrik">Listrik</option>
                                      <option value="None">Tanpa BBM (Dry)</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: '#b45309', fontWeight: 'bold', marginBottom: '2px' }}>BBM (Liter/Hari)</label>
                                    <input
                                      type="number"
                                      value={item.fuelLitersPerDay ?? 0}
                                      onChange={(e) => handleUpdateEquipmentVariable(item.id, 'fuelLitersPerDay', parseFloat(e.target.value) || 0)}
                                      style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: '#b45309', fontWeight: 'bold', marginBottom: '2px' }}>Total BBM (Rp/Hr)</label>
                                    <input
                                      type="number"
                                      value={item.bbmRate ?? 0}
                                      onChange={(e) => handleUpdateEquipmentVariable(item.id, 'bbmRate', parseFloat(e.target.value) || 0)}
                                      style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box', fontWeight: 'bold' }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: '#047857', fontWeight: 'bold', marginBottom: '2px' }}>Pelumas & Servis</label>
                                    <input
                                      type="number"
                                      value={item.maintenanceRate ?? 0}
                                      onChange={(e) => handleUpdateEquipmentVariable(item.id, 'maintenanceRate', parseFloat(e.target.value) || 0)}
                                      style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {equipmentList.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        Belum ada peralatan. Klik "⚡ Lookup Master Peralatan" atau "+ Tambah Manual" di atas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div style={{ marginTop: '12px', padding: '10px 14px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af' }}>Total Sewa Peralatan per Hari:</span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#1e40af', fontFamily: 'monospace' }}>
                  Rp {totalEquipmentDailyRate.toLocaleString('id-ID')} / hari
                </span>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 3: MATERIAL UTAMA */}
          {/* ========================================== */}
          {activeTab === 'material' && (
            <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>Daftar Material Utama per Satuan Kerja</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                    Pipa baja, plat, fitting, flange, dan valve utama yang diserahkan ke klien per 1 unit pekerjaan
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenLookup('material')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#ecfdf5',
                      color: '#065f46',
                      border: '1px solid #a7f3d0',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    <BookOpen size={13} /> ⚡ Lookup Master Material
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMaterial}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} /> + Tambah Material Utama
                  </button>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#475569' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Nama Material Utama</th>
                    <th style={{ padding: '8px', textAlign: 'right', width: '80px' }}>Kebutuhan</th>
                    <th style={{ padding: '8px', textAlign: 'center', width: '60px' }}>Satuan</th>
                    <th style={{ padding: '8px', textAlign: 'right', width: '130px' }}>Harga Satuan (Rp)</th>
                    <th style={{ padding: '8px', textAlign: 'right', width: '130px' }}>Subtotal / Satuan</th>
                    <th style={{ padding: '8px', textAlign: 'center', width: '65px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {materialList.map(item => {
                    const isExpanded = !!expandedMaterialIds[item.id];
                    return (
                      <React.Fragment key={item.id}>
                        <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid #f1f5f9', background: isExpanded ? '#f0fdf4' : '#ffffff' }}>
                          <td style={{ padding: '6px 8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input 
                                type="text"
                                value={item.name}
                                onChange={(e) => handleUpdateMaterial(item.id, 'name', e.target.value)}
                                style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', boxSizing: 'border-box', fontWeight: '600' }}
                              />
                              {otherOccurrences[item.name.trim().toLowerCase()]?.length > 0 && (
                                <span
                                  title={`Material ini juga digunakan di ${otherOccurrences[item.name.trim().toLowerCase()].length} item pekerjaan lain:\n• ${otherOccurrences[item.name.trim().toLowerCase()].join('\n• ')}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    background: '#ecfdf5',
                                    color: '#047857',
                                    border: '1px solid #a7f3d0',
                                    borderRadius: '4px',
                                    padding: '2px 6px',
                                    whiteSpace: 'nowrap',
                                    cursor: 'help'
                                  }}
                                >
                                  <Link2 size={11} /> {otherOccurrences[item.name.trim().toLowerCase()].length} item lain
                                </span>
                              )}
                            </div>
                          </td>

                          <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                            <input 
                              type="number"
                              step="any"
                              value={item.qty}
                              onChange={(e) => handleUpdateMaterial(item.id, 'qty', parseFloat(e.target.value) || 0)}
                              style={{ width: '65px', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}
                            />
                          </td>

                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                            <input 
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleUpdateMaterial(item.id, 'unit', e.target.value)}
                              style={{ width: '45px', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', textAlign: 'center' }}
                            />
                          </td>

                          <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                            <input 
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleUpdateMaterial(item.id, 'rate', parseFloat(e.target.value) || 0)}
                              style={{ width: '110px', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#047857' }}
                            />
                          </td>

                          <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#047857' }}>
                            Rp {Math.round(item.qty * item.rate).toLocaleString('id-ID')}
                          </td>

                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => toggleExpandMaterial(item.id)}
                                title="Buka Benchmark Harga Pasar & Live Google"
                                style={{ background: 'none', border: 'none', color: isExpanded ? '#059669' : '#64748b', cursor: 'pointer', padding: '2px' }}
                              >
                                <TrendingUp size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMaterial(item.id)}
                                title="Hapus material ini"
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
                            <td colSpan={6} style={{ padding: '6px 12px 12px' }}>
                              <MarketPriceLookupWidget
                                query={item.name}
                                currentPrice={item.rate}
                                unit={item.unit}
                                onSelectPrice={(newP, newU) => {
                                  handleUpdateMaterial(item.id, 'rate', newP);
                                  if (newU) {
                                    handleUpdateMaterial(item.id, 'unit', newU);
                                  }
                                }}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {materialList.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        Belum ada material utama. Klik "⚡ Lookup Master Material" atau "+ Tambah Material Utama" di atas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div style={{ marginTop: '12px', padding: '10px 14px', background: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#065f46' }}>Total Biaya Material Utama:</span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#065f46', fontFamily: 'monospace' }}>
                  Rp {Math.round(totalMaterialUnitRate).toLocaleString('id-ID')} / {treatment.unit}
                </span>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 4: CONSUMABLES */}
          {/* ========================================== */}
          {activeTab === 'consumable' && (
            <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>Daftar Bahan & Consumables per Satuan Kerja</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                    Kawat las, gas pelindung, pasir blasting, cat protective coating, majun, dan bahan habis pakai
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenLookup('consumable')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#f3e8ff',
                      color: '#6b21a8',
                      border: '1px solid #e9d5ff',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    <BookOpen size={13} /> ⚡ Lookup Master Consumables
                  </button>
                  <button
                    type="button"
                    onClick={handleAddConsumable}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#7c3aed',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} /> + Tambah Consumable
                  </button>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#475569' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Nama Bahan / Consumable</th>
                    <th style={{ padding: '8px', textAlign: 'right', width: '80px' }}>Pemakaian</th>
                    <th style={{ padding: '8px', textAlign: 'center', width: '60px' }}>Satuan</th>
                    <th style={{ padding: '8px', textAlign: 'right', width: '130px' }}>Harga Satuan (Rp)</th>
                    <th style={{ padding: '8px', textAlign: 'right', width: '130px' }}>Subtotal / Satuan</th>
                    <th style={{ padding: '8px', textAlign: 'center', width: '65px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {consumableList.map(item => {
                    const isExpanded = !!expandedConsumableIds[item.id];
                    return (
                      <React.Fragment key={item.id}>
                        <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid #f1f5f9', background: isExpanded ? '#faf5ff' : '#ffffff' }}>
                          <td style={{ padding: '6px 8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input 
                                type="text"
                                value={item.name}
                                onChange={(e) => handleUpdateConsumable(item.id, 'name', e.target.value)}
                                style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', boxSizing: 'border-box', fontWeight: '600' }}
                              />
                              {otherOccurrences[item.name.trim().toLowerCase()]?.length > 0 && (
                                <span
                                  title={`Consumable ini juga digunakan di ${otherOccurrences[item.name.trim().toLowerCase()].length} item pekerjaan lain:\n• ${otherOccurrences[item.name.trim().toLowerCase()].join('\n• ')}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    background: '#faf5ff',
                                    color: '#7c3aed',
                                    border: '1px solid #e9d5ff',
                                    borderRadius: '4px',
                                    padding: '2px 6px',
                                    whiteSpace: 'nowrap',
                                    cursor: 'help'
                                  }}
                                >
                                  <Link2 size={11} /> {otherOccurrences[item.name.trim().toLowerCase()].length} item lain
                                </span>
                              )}
                            </div>
                          </td>

                          <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                            <input 
                              type="number"
                              step="any"
                              value={item.qty}
                              onChange={(e) => handleUpdateConsumable(item.id, 'qty', parseFloat(e.target.value) || 0)}
                              style={{ width: '65px', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}
                            />
                          </td>

                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                            <input 
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleUpdateConsumable(item.id, 'unit', e.target.value)}
                              style={{ width: '45px', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', textAlign: 'center' }}
                            />
                          </td>

                          <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                            <input 
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleUpdateConsumable(item.id, 'rate', parseFloat(e.target.value) || 0)}
                              style={{ width: '110px', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#7c3aed' }}
                            />
                          </td>

                          <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#7c3aed' }}>
                            Rp {Math.round(item.qty * item.rate).toLocaleString('id-ID')}
                          </td>

                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => toggleExpandConsumable(item.id)}
                                title="Buka Benchmark Harga Pasar & Live Google"
                                style={{ background: 'none', border: 'none', color: isExpanded ? '#7c3aed' : '#64748b', cursor: 'pointer', padding: '2px' }}
                              >
                                <TrendingUp size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteConsumable(item.id)}
                                title="Hapus consumable ini"
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr style={{ background: '#faf5ff', borderBottom: '1px solid #ddd6fe' }}>
                            <td colSpan={6} style={{ padding: '6px 12px 12px' }}>
                              <MarketPriceLookupWidget
                                query={item.name}
                                currentPrice={item.rate}
                                unit={item.unit}
                                onSelectPrice={(newP, newU) => {
                                  handleUpdateConsumable(item.id, 'rate', newP);
                                  if (newU) {
                                    handleUpdateConsumable(item.id, 'unit', newU);
                                  }
                                }}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {consumableList.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        Belum ada consumables. Klik "⚡ Lookup Master Consumables" atau "+ Tambah Consumable" di atas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f3e8ff', borderRadius: '6px', border: '1px solid #e9d5ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b21a8' }}>Total Biaya Consumables:</span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#6b21a8', fontFamily: 'monospace' }}>
                  Rp {Math.round(totalConsumableUnitRate).toLocaleString('id-ID')} / {treatment.unit}
                </span>
              </div>
            </div>
          )}

        </div>

        {/* 4. Bottom Engineering Summary & Real-time Calculation */}
        <div style={{ padding: '14px 20px', background: '#0f172a', color: '#ffffff', borderTop: '1px solid #334155' }}>
          
          {/* SYNC OPTIONS BAR */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.85)',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            padding: '8px 14px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={syncToAllItems}
                  onChange={(e) => setSyncToAllItems(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '11px', color: '#f8fafc', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <RefreshCw size={12} style={{ color: '#38bdf8' }} />
                  <span>Sinkronkan harga & variabel ke seluruh item proyek yang menggunakan resource ini</span>
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={syncToMaster}
                  onChange={(e) => setSyncToMaster(e.target.checked)}
                  style={{ width: '15px', height: '15px', accentColor: '#10b981', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '11px', color: '#6ee7b7' }}>
                  Update Master Database juga
                </span>
              </label>
            </div>

            {totalSharedResourcesCount > 0 ? (
              <span style={{ fontSize: '11px', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Link2 size={12} />
                <span><strong>{totalSharedResourcesCount} resource</strong> terhubung ke item pekerjaan lain</span>
              </span>
            ) : (
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                Perubahan pada item ini akan dijadikan acuan jika nama resource yang sama dipakai di pekerjaan lain
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'center' }}>
            
            {/* Live Formula Daily Spread & BoQ Impact */}
            <div style={{ background: '#1e293b', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f8fafc' }}>
                  <Calculator size={15} style={{ color: '#38bdf8' }} />
                  <span>Total Paket Daily Spread:</span>
                  <strong style={{ color: '#fbbf24', fontFamily: 'monospace', fontSize: '14px' }}>
                    Rp {Math.round(totalDailySpread).toLocaleString('id-ID')} / Hari
                  </strong>
                </div>

                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  (Kru: Rp {Math.round(totalCrewDailyRate).toLocaleString('id-ID')} • Alat: Rp {Math.round(totalEquipmentDailyRate).toLocaleString('id-ID')} • Mat: Rp {Math.round(totalMaterialUnitRate).toLocaleString('id-ID')} • Cons: Rp {Math.round(totalConsumableUnitRate).toLocaleString('id-ID')})
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: '#cbd5e1', paddingTop: '4px', borderTop: '1px solid #334155', flexWrap: 'wrap' }}>
                <span>Item BoQ: <strong style={{ color: '#f8fafc' }}>{boqQty.toLocaleString('id-ID')} {boqUnit}</strong> (Output: <strong style={{ color: '#fbbf24' }}>{effectiveOutput} {boqUnit}/hari</strong>, Durasi: <strong>{estimatedDuration.toFixed(2)} hari</strong>)</span>
                <span style={{ borderLeft: '1px solid #475569', paddingLeft: '14px' }}>
                  Kontribusi Biaya Satuan: <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>Rp {Math.round(unitPriceContribution).toLocaleString('id-ID')} / {boqUnit}</strong>
                </span>
                <span style={{ borderLeft: '1px solid #475569', paddingLeft: '14px' }}>
                  Total Biaya Pekerjaan: <strong style={{ color: '#34d399', fontFamily: 'monospace' }}>Rp {Math.round(totalTreatmentDirectCost).toLocaleString('id-ID')}</strong>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: '#cbd5e1', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#ffffff', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Check size={15} /> Simpan Perubahan
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* 5. Master Resource Lookup Modal */}
      <ResourceLookupModal
        isOpen={isLookupOpen}
        type={lookupType}
        onClose={() => setIsLookupOpen(false)}
        onSelectManpower={handleSelectMasterManpower}
        onSelectEquipment={handleSelectMasterEquipment}
        onSelectMaterial={handleSelectMasterMaterial}
        onSelectConsumable={handleSelectMasterConsumable}
        onSyncMasterItemToTender={handleSyncMasterItemToBreakdown}
      />
    </div>
  );
};

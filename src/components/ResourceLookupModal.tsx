import React, { useState, useMemo } from 'react';
import { 
  type MasterManpower, 
  type MasterEquipment,
  type MasterMaterialItem
} from '../data/resourceMasterData';
import { 
  loadMasterManpower, 
  saveMasterManpower, 
  resetMasterManpower, 
  loadMasterEquipment, 
  saveMasterEquipment, 
  resetMasterEquipment,
  loadMasterMaterial,
  saveMasterMaterial,
  resetMasterMaterial,
  loadMasterConsumable,
  saveMasterConsumable,
  resetMasterConsumable,
  exportManpowerToExcel,
  exportEquipmentToExcel,
  exportMaterialToExcel,
  exportConsumableToExcel
} from '../utils/masterDataManager';
import { MasterDataImportModal } from './MasterDataImportModal';
import { MarketPriceLookupWidget } from './MarketPriceLookupWidget';
import { 
  X, 
  Search, 
  HardHat, 
  Wrench, 
  Layers,
  Package,
  Plus, 
  Info, 
  FileSpreadsheet, 
  Download, 
  RefreshCw, 
  Trash2, 
  Pencil,
  Check,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  type: 'manpower' | 'equipment' | 'material' | 'consumable';
  onClose: () => void;
  onSelectManpower?: (item: MasterManpower) => void;
  onSelectEquipment?: (item: MasterEquipment) => void;
  onSelectMaterial?: (item: MasterMaterialItem) => void;
  onSelectConsumable?: (item: MasterMaterialItem) => void;
  onSyncMasterItemToTender?: (type: 'manpower' | 'equipment' | 'material' | 'consumable', item: MasterManpower | MasterEquipment | MasterMaterialItem) => void;
}

export const ResourceLookupModal: React.FC<Props> = ({
  isOpen,
  type,
  onClose,
  onSelectManpower,
  onSelectEquipment,
  onSelectMaterial,
  onSelectConsumable,
  onSyncMasterItemToTender
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Master Data State (Persisted in LocalStorage)
  const [manpowerData, setManpowerData] = useState<MasterManpower[]>(() => loadMasterManpower());
  const [equipmentData, setEquipmentData] = useState<MasterEquipment[]>(() => loadMasterEquipment());
  const [materialData, setMaterialData] = useState<MasterMaterialItem[]>(() => loadMasterMaterial());
  const [consumableData, setConsumableData] = useState<MasterMaterialItem[]>(() => loadMasterConsumable());

  // Modal Import Excel State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Manual Form Toggle State
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);

  // Inline Edit State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Editing state for Manpower
  const [editMpRole, setEditMpRole] = useState('');
  const [editMpCategory, setEditMpCategory] = useState('');
  const [editMpBasicSalary, setEditMpBasicSalary] = useState(0);
  const [editMpPpe, setEditMpPpe] = useState(0);
  const [editMpJamsostek, setEditMpJamsostek] = useState(0);
  const [editMpMeals, setEditMpMeals] = useState(0);
  const [editMpAllowance, setEditMpAllowance] = useState(0);
  const [editMpNotes, setEditMpNotes] = useState('');

  // Editing state for Equipment
  const [editEqName, setEditEqName] = useState('');
  const [editEqCategory, setEditEqCategory] = useState('');
  const [editEqBaseRental, setEditEqBaseRental] = useState(0);
  const [editEqFuelType, setEditEqFuelType] = useState<MasterEquipment['fuelType']>('Solar');
  const [editEqFuelLiters, setEditEqFuelLiters] = useState(0);
  const [editEqFuelPrice, setEditEqFuelPrice] = useState(14500);
  const [editEqMaint, setEditEqMaint] = useState(0);
  const [editEqMob, setEditEqMob] = useState(0);
  const [editEqNotes, setEditEqNotes] = useState('');

  // Editing state for Material & Consumable
  const [editMatName, setEditMatName] = useState('');
  const [editMatCategory, setEditMatCategory] = useState('');
  const [editMatUnit, setEditMatUnit] = useState('meter');
  const [editMatRate, setEditMatRate] = useState(0);
  const [editMatPriceLow, setEditMatPriceLow] = useState(0);
  const [editMatPriceHigh, setEditMatPriceHigh] = useState(0);
  const [editMatSpecs, setEditMatSpecs] = useState('');
  const [editMatNotes, setEditMatNotes] = useState('');

  // Form State for Manual Manpower
  const [mpRole, setMpRole] = useState('');
  const [mpCategory, setMpCategory] = useState<string>('Piping & Fabrication');
  const [mpBasicSalary, setMpBasicSalary] = useState<number>(200000);
  const [mpPpe, setMpPpe] = useState<number>(25000);
  const [mpJamsostek, setMpJamsostek] = useState<number>(20000);
  const [mpMeals, setMpMeals] = useState<number>(25000);
  const [mpAllowance, setMpAllowance] = useState<number>(0);
  const [mpNotes, setMpNotes] = useState('');

  // Form State for Manual Equipment
  const [eqName, setEqName] = useState('');
  const [eqCategory, setEqCategory] = useState<string>('Compressor & Power');
  const [eqBaseRental, setEqBaseRental] = useState<number>(300000);
  const [eqFuelType, setEqFuelType] = useState<MasterEquipment['fuelType']>('Solar');
  const [eqFuelLiters, setEqFuelLiters] = useState<number>(10);
  const [eqFuelPrice, setEqFuelPrice] = useState<number>(14500);
  const [eqMaint, setEqMaint] = useState<number>(40000);
  const [eqMob, setEqMob] = useState<number>(0);
  const [eqNotes, setEqNotes] = useState('');

  // Form State for Manual Material / Consumable
  const [matName, setMatName] = useState('');
  const [matCategory, setMatCategory] = useState<string>('Piping & Fabrication');
  const [matUnit, setMatUnit] = useState<string>('meter');
  const [matRate, setMatRate] = useState<number>(150000);
  const [matPriceLow, setMatPriceLow] = useState<number>(130000);
  const [matPriceHigh, setMatPriceHigh] = useState<number>(180000);
  const [matSpecs, setMatSpecs] = useState('');
  const [matNotes, setMatNotes] = useState('');

  // Categories
  const manpowerCategories = useMemo(() => {
    const set = new Set(manpowerData.map(m => m.category));
    return ['Semua', ...Array.from(set)];
  }, [manpowerData]);

  const equipmentCategories = useMemo(() => {
    const set = new Set(equipmentData.map(e => e.category));
    return ['Semua', ...Array.from(set)];
  }, [equipmentData]);

  const materialCategories = useMemo(() => {
    const set = new Set(materialData.map(m => m.category));
    return ['Semua', ...Array.from(set)];
  }, [materialData]);

  const consumableCategories = useMemo(() => {
    const set = new Set(consumableData.map(c => c.category));
    return ['Semua', ...Array.from(set)];
  }, [consumableData]);

  const currentCategories = useMemo(() => {
    if (type === 'manpower') return manpowerCategories;
    if (type === 'equipment') return equipmentCategories;
    if (type === 'material') return materialCategories;
    return consumableCategories;
  }, [type, manpowerCategories, equipmentCategories, materialCategories, consumableCategories]);

  // Filtered lists
  const filteredManpower = useMemo(() => {
    if (type !== 'manpower') return [];
    return manpowerData.filter(m => {
      const matchCat = selectedCategory === 'Semua' || m.category === selectedCategory;
      const matchQ = 
        m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQ;
    });
  }, [type, manpowerData, searchQuery, selectedCategory]);

  const filteredEquipment = useMemo(() => {
    if (type !== 'equipment') return [];
    return equipmentData.filter(e => {
      const matchCat = selectedCategory === 'Semua' || e.category === selectedCategory;
      const matchQ = 
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQ;
    });
  }, [type, equipmentData, searchQuery, selectedCategory]);

  const filteredMaterial = useMemo(() => {
    if (type !== 'material') return [];
    return materialData.filter(m => {
      const matchCat = selectedCategory === 'Semua' || m.category === selectedCategory;
      const matchQ = 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.specs && m.specs.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQ;
    });
  }, [type, materialData, searchQuery, selectedCategory]);

  const filteredConsumable = useMemo(() => {
    if (type !== 'consumable') return [];
    return consumableData.filter(c => {
      const matchCat = selectedCategory === 'Semua' || c.category === selectedCategory;
      const matchQ = 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.specs && c.specs.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQ;
    });
  }, [type, consumableData, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  // Handlers for Add Manual
  const handleSaveManualManpower = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpRole.trim()) return;

    const total = mpBasicSalary + mpPpe + mpJamsostek + mpMeals + mpAllowance;
    const newItem: MasterManpower = {
      id: `m-custom-${Date.now()}`,
      role: mpRole.trim(),
      category: mpCategory,
      unit: 'org',
      basicSalary: mpBasicSalary,
      ppeDaily: mpPpe,
      jamsostekDaily: mpJamsostek,
      mealsDaily: mpMeals,
      otherAllowanceDaily: mpAllowance,
      totalRate: total,
      notes: mpNotes.trim() || undefined
    };

    const updated = [newItem, ...manpowerData];
    setManpowerData(updated);
    saveMasterManpower(updated);

    setMpRole('');
    setMpNotes('');
    setIsAddManualOpen(false);
  };

  const handleSaveManualEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eqName.trim()) return;

    const bbmRate = eqFuelType === 'None' || eqFuelType === 'Listrik' ? 0 : Math.round(eqFuelLiters * eqFuelPrice);
    const total = eqBaseRental + bbmRate + eqMaint + eqMob;

    const newItem: MasterEquipment = {
      id: `eq-custom-${Date.now()}`,
      name: eqName.trim(),
      category: eqCategory,
      unit: 'unit',
      baseRentalRate: eqBaseRental,
      fuelType: eqFuelType,
      fuelLitersPerDay: eqFuelLiters,
      fuelPricePerLiter: eqFuelPrice,
      bbmRate: bbmRate,
      maintenanceRate: eqMaint,
      mobilizationDaily: eqMob,
      totalRate: total,
      notes: eqNotes.trim() || undefined
    };

    const updated = [newItem, ...equipmentData];
    setEquipmentData(updated);
    saveMasterEquipment(updated);

    setEqName('');
    setEqNotes('');
    setIsAddManualOpen(false);
  };

  const handleSaveManualMaterialOrConsumable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matName.trim()) return;

    const newItem: MasterMaterialItem = {
      id: `${type === 'material' ? 'mat' : 'cs'}-custom-${Date.now()}`,
      name: matName.trim(),
      category: matCategory.trim() || (type === 'material' ? 'Piping & Fabrication' : 'Welding Consumable'),
      type: type === 'material' ? 'material' : 'consumable',
      unit: matUnit.trim() || (type === 'material' ? 'meter' : 'pcs'),
      standardRate: matRate > 0 ? matRate : (matPriceLow + matPriceHigh) / 2 || 50000,
      priceLow: matPriceLow > 0 ? matPriceLow : Math.round(matRate * 0.88),
      priceHigh: matPriceHigh > 0 ? matPriceHigh : Math.round(matRate * 1.20),
      specs: matSpecs.trim() || undefined,
      notes: matNotes.trim() || undefined
    };

    if (type === 'material') {
      const updated = [newItem, ...materialData];
      setMaterialData(updated);
      saveMasterMaterial(updated);
    } else {
      const updated = [newItem, ...consumableData];
      setConsumableData(updated);
      saveMasterConsumable(updated);
    }

    setMatName('');
    setMatSpecs('');
    setMatNotes('');
    setIsAddManualOpen(false);
  };

  // Handlers for Edit Existing Item in Master
  const handleStartEditManpower = (m: MasterManpower) => {
    setEditingItemId(m.id);
    setEditMpRole(m.role);
    setEditMpCategory(m.category);
    setEditMpBasicSalary(m.basicSalary);
    setEditMpPpe(m.ppeDaily);
    setEditMpJamsostek(m.jamsostekDaily);
    setEditMpMeals(m.mealsDaily);
    setEditMpAllowance(m.otherAllowanceDaily);
    setEditMpNotes(m.notes || '');
  };

  const handleSaveEditManpower = (id: string) => {
    const total = editMpBasicSalary + editMpPpe + editMpJamsostek + editMpMeals + editMpAllowance;
    let savedItem: MasterManpower | null = null;
    const updated = manpowerData.map(m => {
      if (m.id !== id) return m;
      savedItem = {
        ...m,
        role: editMpRole.trim() || m.role,
        category: editMpCategory.trim() || m.category,
        basicSalary: editMpBasicSalary,
        ppeDaily: editMpPpe,
        jamsostekDaily: editMpJamsostek,
        mealsDaily: editMpMeals,
        otherAllowanceDaily: editMpAllowance,
        totalRate: total,
        notes: editMpNotes.trim() || undefined
      };
      return savedItem;
    });
    setManpowerData(updated);
    saveMasterManpower(updated);
    if (savedItem && onSyncMasterItemToTender) {
      onSyncMasterItemToTender('manpower', savedItem);
    }
    setEditingItemId(null);
  };

  const handleStartEditEquipment = (e: MasterEquipment) => {
    setEditingItemId(e.id);
    setEditEqName(e.name);
    setEditEqCategory(e.category);
    setEditEqBaseRental(e.baseRentalRate);
    setEditEqFuelType(e.fuelType);
    setEditEqFuelLiters(e.fuelLitersPerDay);
    setEditEqFuelPrice(e.fuelPricePerLiter);
    setEditEqMaint(e.maintenanceRate);
    setEditEqMob(e.mobilizationDaily);
    setEditEqNotes(e.notes || '');
  };

  const handleSaveEditEquipment = (id: string) => {
    const bbmRate = editEqFuelType === 'None' || editEqFuelType === 'Listrik' ? 0 : Math.round(editEqFuelLiters * editEqFuelPrice);
    const total = editEqBaseRental + bbmRate + editEqMaint + editEqMob;
    let savedItem: MasterEquipment | null = null;
    const updated = equipmentData.map(e => {
      if (e.id !== id) return e;
      savedItem = {
        ...e,
        name: editEqName.trim() || e.name,
        category: editEqCategory.trim() || e.category,
        baseRentalRate: editEqBaseRental,
        fuelType: editEqFuelType,
        fuelLitersPerDay: editEqFuelLiters,
        fuelPricePerLiter: editEqFuelPrice,
        bbmRate,
        maintenanceRate: editEqMaint,
        mobilizationDaily: editEqMob,
        totalRate: total,
        notes: editEqNotes.trim() || undefined
      };
      return savedItem;
    });
    setEquipmentData(updated);
    saveMasterEquipment(updated);
    if (savedItem && onSyncMasterItemToTender) {
      onSyncMasterItemToTender('equipment', savedItem);
    }
    setEditingItemId(null);
  };

  const handleStartEditMaterial = (m: MasterMaterialItem) => {
    setEditingItemId(m.id);
    setEditMatName(m.name);
    setEditMatCategory(m.category);
    setEditMatUnit(m.unit);
    setEditMatRate(m.standardRate);
    setEditMatPriceLow(m.priceLow);
    setEditMatPriceHigh(m.priceHigh);
    setEditMatSpecs(m.specs || '');
    setEditMatNotes(m.notes || '');
  };

  const handleSaveEditMaterial = (id: string) => {
    let savedItem: MasterMaterialItem | null = null;
    if (type === 'material') {
      const updated = materialData.map(m => {
        if (m.id !== id) return m;
        savedItem = {
          ...m,
          name: editMatName.trim() || m.name,
          category: editMatCategory.trim() || m.category,
          unit: editMatUnit.trim() || m.unit,
          standardRate: editMatRate,
          priceLow: editMatPriceLow,
          priceHigh: editMatPriceHigh,
          specs: editMatSpecs.trim() || undefined,
          notes: editMatNotes.trim() || undefined
        };
        return savedItem;
      });
      setMaterialData(updated);
      saveMasterMaterial(updated);
      if (savedItem && onSyncMasterItemToTender) {
        onSyncMasterItemToTender('material', savedItem);
      }
    } else {
      const updated = consumableData.map(c => {
        if (c.id !== id) return c;
        savedItem = {
          ...c,
          name: editMatName.trim() || c.name,
          category: editMatCategory.trim() || c.category,
          unit: editMatUnit.trim() || c.unit,
          standardRate: editMatRate,
          priceLow: editMatPriceLow,
          priceHigh: editMatPriceHigh,
          specs: editMatSpecs.trim() || undefined,
          notes: editMatNotes.trim() || undefined
        };
        return savedItem;
      });
      setConsumableData(updated);
      saveMasterConsumable(updated);
      if (savedItem && onSyncMasterItemToTender) {
        onSyncMasterItemToTender('consumable', savedItem);
      }
    }
    setEditingItemId(null);
  };

  // Delete Item from Master
  const handleDeleteMasterItem = (id: string) => {
    if (confirm('Yakin ingin menghapus item ini dari master database?')) {
      if (type === 'manpower') {
        const updated = manpowerData.filter(m => m.id !== id);
        setManpowerData(updated);
        saveMasterManpower(updated);
      } else if (type === 'equipment') {
        const updated = equipmentData.filter(e => e.id !== id);
        setEquipmentData(updated);
        saveMasterEquipment(updated);
      } else if (type === 'material') {
        const updated = materialData.filter(m => m.id !== id);
        setMaterialData(updated);
        saveMasterMaterial(updated);
      } else {
        const updated = consumableData.filter(c => c.id !== id);
        setConsumableData(updated);
        saveMasterConsumable(updated);
      }
    }
  };

  // Reset to Default Factory Library
  const handleResetToDefault = () => {
    const titles = {
      manpower: 'Tenaga Kerja',
      equipment: 'Peralatan',
      material: 'Material Utama',
      consumable: 'Bahan & Consumables'
    };
    if (confirm(`Kembalikan seluruh master database ${titles[type]} ke bawaan standar pabrik? Data custom Anda akan tereset.`)) {
      if (type === 'manpower') {
        const def = resetMasterManpower();
        setManpowerData(def);
      } else if (type === 'equipment') {
        const def = resetMasterEquipment();
        setEquipmentData(def);
      } else if (type === 'material') {
        const def = resetMasterMaterial();
        setMaterialData(def);
      } else {
        const def = resetMasterConsumable();
        setConsumableData(def);
      }
    }
  };

  // Handle Import Confirm
  const handleImportSuccess = (
    importedItems: (MasterManpower | MasterEquipment | MasterMaterialItem)[], 
    mode: 'append' | 'replace'
  ) => {
    if (type === 'manpower') {
      const items = importedItems as MasterManpower[];
      const merged = mode === 'replace' ? items : [...items, ...manpowerData];
      setManpowerData(merged);
      saveMasterManpower(merged);
    } else if (type === 'equipment') {
      const items = importedItems as MasterEquipment[];
      const merged = mode === 'replace' ? items : [...items, ...equipmentData];
      setEquipmentData(merged);
      saveMasterEquipment(merged);
    } else if (type === 'material') {
      const items = importedItems as MasterMaterialItem[];
      const merged = mode === 'replace' ? items : [...items, ...materialData];
      setMaterialData(merged);
      saveMasterMaterial(merged);
    } else {
      const items = importedItems as MasterMaterialItem[];
      const merged = mode === 'replace' ? items : [...items, ...consumableData];
      setConsumableData(merged);
      saveMasterConsumable(merged);
    }
  };

  // Handle Export Current Backup
  const handleExportBackup = () => {
    if (type === 'manpower') {
      exportManpowerToExcel(manpowerData);
    } else if (type === 'equipment') {
      exportEquipmentToExcel(equipmentData);
    } else if (type === 'material') {
      exportMaterialToExcel(materialData);
    } else {
      exportConsumableToExcel(consumableData);
    }
  };

  const getHeaderIcon = () => {
    switch (type) {
      case 'manpower': return <HardHat size={20} color="#38bdf8" />;
      case 'equipment': return <Wrench size={20} color="#fbbf24" />;
      case 'material': return <Layers size={20} color="#34d399" />;
      case 'consumable': return <Package size={20} color="#c084fc" />;
    }
  };

  const typeTitle = {
    manpower: 'Tenaga Kerja / Kru Lapangan',
    equipment: 'Peralatan & Mesin Kerja',
    material: 'Material Utama (Pipa, Flange, Plat, Valve)',
    consumable: 'Bahan & Consumables (Kawat Las, Gas, Blasting, Cat)'
  }[type];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100050,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(3px)',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '940px',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
        fontFamily: 'Segoe UI, Tahoma, sans-serif'
      }}>
        {/* 1. Modal Header */}
        <div style={{
          padding: '16px 20px',
          background: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid #2563eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {getHeaderIcon()}
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                Lookup Master Database {typeTitle}
              </h3>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Pilih dari library standar, benchmark harga pasar & Google, atau import dari Excel
                Pilih dari library standar, benchmark harga pasar & Google, edit item, atau import/export Excel
              </div>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 2. Top Action Bar: Search, Category, Add Manual, Import/Export */}
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: '#64748b' }} />
              <input
                type="text"
                placeholder={`Cari nama ${type === 'manpower' ? 'jabatan' : 'item'} / spesifikasi / catatan...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 30px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Action Buttons: Add Manual, Import, Export, Reset */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setIsAddManualOpen(prev => !prev)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: isAddManualOpen ? '#1e293b' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {isAddManualOpen ? <ChevronUp size={13} /> : <Plus size={13} />}
                <span>{isAddManualOpen ? 'Tutup Form' : '+ Tambah Manual'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                <FileSpreadsheet size={13} />
                <span>📥 Import Excel</span>
              </button>

              <button
                type="button"
                onClick={handleExportBackup}
                title="Download data master saat ini ke file Excel dengan format kolom baku untuk diedit dan di-import ulang"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: '#ffffff',
                  color: '#1e40af',
                  border: '1px solid #bfdbfe',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                <Download size={13} />
                <span>📤 Export Excel (Baku)</span>
              </button>

              <button
                type="button"
                onClick={handleResetToDefault}
                title="Reset kembali ke library bawaan standar pabrik"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 8px',
                  backgroundColor: '#ffffff',
                  color: '#ef4444',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={12} />
              </button>
            </div>
          </div>

          {/* Categories Filter */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {currentCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: selectedCategory === cat ? 'bold' : 'normal',
                  border: selectedCategory === cat ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  background: selectedCategory === cat ? '#2563eb' : '#ffffff',
                  color: selectedCategory === cat ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Form Tambah Manual (Expandable with Google Benchmark) */}
        {isAddManualOpen && (
          <div style={{
            padding: '14px 20px',
            background: '#eff6ff',
            borderBottom: '2px solid #bfdbfe',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)'
          }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 'bold', color: '#1e40af' }}>
              Form Tambah Data Master {typeTitle} Baru
            </h4>

            {/* FORM MANPOWER */}
            {type === 'manpower' && (
              <form onSubmit={handleSaveManualManpower}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                      Nama Jabatan / Posisi *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Welder 6G Inconel"
                      value={mpRole}
                      onChange={(e) => setMpRole(e.target.value)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                      Kategori
                    </label>
                    <input
                      list="mp-categories-list"
                      type="text"
                      value={mpCategory}
                      onChange={(e) => setMpCategory(e.target.value)}
                      placeholder="Pilih atau ketik kategori..."
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                    <datalist id="mp-categories-list">
                      {manpowerCategories.filter(c => c !== 'Semua').map(c => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                      Gaji Pokok (Rp/Hr)
                    </label>
                    <input
                      type="number"
                      value={mpBasicSalary}
                      onChange={(e) => setMpBasicSalary(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#0284c7', marginBottom: '2px' }}>
                      APD / PPE (Rp/Hr)
                    </label>
                    <input
                      type="number"
                      value={mpPpe}
                      onChange={(e) => setMpPpe(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#059669', marginBottom: '2px' }}>
                      BPJS / Jamsostek (Rp/Hr)
                    </label>
                    <input
                      type="number"
                      value={mpJamsostek}
                      onChange={(e) => setMpJamsostek(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#d97706', marginBottom: '2px' }}>
                      Makan & Mess (Rp/Hr)
                    </label>
                    <input
                      type="number"
                      value={mpMeals}
                      onChange={(e) => setMpMeals(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#7c3aed', marginBottom: '2px' }}>
                      Tunjangan Keahlian
                    </label>
                    <input
                      type="number"
                      value={mpAllowance}
                      onChange={(e) => setMpAllowance(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#1e40af' }}>
                    Total Mandays: <strong style={{ fontFamily: 'monospace', fontSize: '13px' }}>Rp {(mpBasicSalary + mpPpe + mpJamsostek + mpMeals + mpAllowance).toLocaleString('id-ID')} / hari</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAddManualOpen(false)}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Simpan ke Master
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* FORM EQUIPMENT */}
            {type === 'equipment' && (
              <form onSubmit={handleSaveManualEquipment}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                      Nama Alat / Mesin *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Air Compressor 750 CFM"
                      value={eqName}
                      onChange={(e) => setEqName(e.target.value)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                      Kategori
                    </label>
                    <input
                      list="eq-categories-list"
                      type="text"
                      value={eqCategory}
                      onChange={(e) => setEqCategory(e.target.value)}
                      placeholder="Pilih atau ketik kategori..."
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                    <datalist id="eq-categories-list">
                      {equipmentCategories.filter(c => c !== 'Semua').map(c => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                      Sewa Pokok Dry (Rp)
                    </label>
                    <input
                      type="number"
                      value={eqBaseRental}
                      onChange={(e) => setEqBaseRental(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#b45309', marginBottom: '2px' }}>
                      Jenis BBM
                    </label>
                    <select
                      value={eqFuelType}
                      onChange={(e) => setEqFuelType(e.target.value as MasterEquipment['fuelType'])}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                    >
                      <option value="Solar">Solar Industri</option>
                      <option value="Bensin">Bensin / Pertalite</option>
                      <option value="Listrik">Listrik</option>
                      <option value="None">Tanpa BBM (Dry)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#b45309', marginBottom: '2px' }}>
                      BBM (Liter/Hari)
                    </label>
                    <input
                      type="number"
                      value={eqFuelLiters}
                      onChange={(e) => setEqFuelLiters(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#b45309', marginBottom: '2px' }}>
                      Harga BBM / Liter
                    </label>
                    <input
                      type="number"
                      value={eqFuelPrice}
                      onChange={(e) => setEqFuelPrice(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#047857', marginBottom: '2px' }}>
                      Pelumas & Servis
                    </label>
                    <input
                      type="number"
                      value={eqMaint}
                      onChange={(e) => setEqMaint(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '2px' }}>
                      Mob / Demob Harian
                    </label>
                    <input
                      type="number"
                      value={eqMob}
                      onChange={(e) => setEqMob(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#92400e' }}>
                    Total Sewa Wet: <strong style={{ fontFamily: 'monospace', fontSize: '13px' }}>Rp {(eqBaseRental + (eqFuelType === 'None' || eqFuelType === 'Listrik' ? 0 : eqFuelLiters * eqFuelPrice) + eqMaint + eqMob).toLocaleString('id-ID')} / hari</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAddManualOpen(false)}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: '#d97706', color: '#fff', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Simpan ke Master
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* FORM MATERIAL & CONSUMABLES (WITH MARKET BENCHMARK & GOOGLE SEARCH) */}
            {(type === 'material' || type === 'consumable') && (
              <form onSubmit={handleSaveManualMaterialOrConsumable}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                      Nama {type === 'material' ? 'Material Utama' : 'Bahan / Consumable'} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={type === 'material' ? 'Contoh: Pipa Seamless 4" Sch 40' : 'Contoh: Kawat Las LB-52 3.2mm'}
                      value={matName}
                      onChange={(e) => setMatName(e.target.value)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                      Kategori
                    </label>
                    <input
                      list="mat-categories-list"
                      type="text"
                      value={matCategory}
                      onChange={(e) => setMatCategory(e.target.value)}
                      placeholder="Pilih atau ketik kategori..."
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                    <datalist id="mat-categories-list">
                      {(type === 'material' ? materialCategories : consumableCategories).filter(c => c !== 'Semua').map(c => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                      Satuan
                    </label>
                    <input
                      type="text"
                      placeholder="meter / pcs / kg / liter"
                      value={matUnit}
                      onChange={(e) => setMatUnit(e.target.value)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#047857', marginBottom: '2px' }}>
                      Harga Standar (Rp)
                    </label>
                    <input
                      type="number"
                      value={matRate}
                      onChange={(e) => setMatRate(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#047857', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#16a34a', marginBottom: '2px' }}>
                      Harga Bawah (Rp)
                    </label>
                    <input
                      type="number"
                      value={matPriceLow}
                      onChange={(e) => setMatPriceLow(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#dc2626', marginBottom: '2px' }}>
                      Harga Atas (Rp)
                    </label>
                    <input
                      type="number"
                      value={matPriceHigh}
                      onChange={(e) => setMatPriceHigh(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                      Spesifikasi Teknis / Standar (ASTM/API)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: ASTM A106 Gr. B Seamless c/w MTC"
                      value={matSpecs}
                      onChange={(e) => setMatSpecs(e.target.value)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Live Benchmark Widget: Harga Bawah, Rekomendasi, Harga Atas & Google Search */}
                {matName.trim().length > 1 && (
                  <MarketPriceLookupWidget
                    query={matName}
                    currentPrice={matRate}
                    unit={matUnit}
                    onSelectPrice={(selectedP) => {
                      setMatRate(selectedP);
                    }}
                  />
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddManualOpen(false)}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '11px', cursor: 'pointer' }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: '#059669', color: '#fff', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Simpan ke Master {type === 'material' ? 'Material' : 'Consumables'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 4. Content Table / Cards */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          
          {/* TAB MANPOWER */}
          {type === 'manpower' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredManpower.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '13px' }}>
                  Tidak ada posisi tenaga kerja yang sesuai dengan kata kunci "{searchQuery}".
                </div>
              ) : (
                filteredManpower.map(m => {
                  const isEditing = editingItemId === m.id;

                  if (isEditing) {
                    const liveTotal = editMpBasicSalary + editMpPpe + editMpJamsostek + editMpMeals + editMpAllowance;
                    return (
                      <div
                        key={m.id}
                        style={{
                          background: '#eff6ff',
                          border: '2px solid #2563eb',
                          borderRadius: '8px',
                          padding: '14px',
                          boxShadow: '0 4px 6px -1px rgba(37,99,235,0.1)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Pencil size={13} /> Edit Master Tenaga Kerja
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>ID: {m.id}</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                          <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                              Nama Jabatan / Posisi
                            </label>
                            <input
                              type="text"
                              value={editMpRole}
                              onChange={(e) => setEditMpRole(e.target.value)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box', fontWeight: 'bold' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                              Kategori
                            </label>
                            <input
                              list="mp-categories-list"
                              type="text"
                              value={editMpCategory}
                              onChange={(e) => setEditMpCategory(e.target.value)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                              Gaji Pokok (Rp/Hr)
                            </label>
                            <input
                              type="number"
                              value={editMpBasicSalary}
                              onChange={(e) => setEditMpBasicSalary(parseFloat(e.target.value) || 0)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#0284c7', marginBottom: '2px' }}>
                              APD / PPE (Rp/Hr)
                            </label>
                            <input
                              type="number"
                              value={editMpPpe}
                              onChange={(e) => setEditMpPpe(parseFloat(e.target.value) || 0)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#059669', marginBottom: '2px' }}>
                              BPJS / Jamsostek (Rp/Hr)
                            </label>
                            <input
                              type="number"
                              value={editMpJamsostek}
                              onChange={(e) => setEditMpJamsostek(parseFloat(e.target.value) || 0)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#d97706', marginBottom: '2px' }}>
                              Makan & Mess (Rp/Hr)
                            </label>
                            <input
                              type="number"
                              value={editMpMeals}
                              onChange={(e) => setEditMpMeals(parseFloat(e.target.value) || 0)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#7c3aed', marginBottom: '2px' }}>
                              Tunjangan Keahlian
                            </label>
                            <input
                              type="number"
                              value={editMpAllowance}
                              onChange={(e) => setEditMpAllowance(parseFloat(e.target.value) || 0)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                              Catatan / Syarat Sertifikasi
                            </label>
                            <input
                              type="text"
                              value={editMpNotes}
                              onChange={(e) => setEditMpNotes(e.target.value)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #bfdbfe', paddingTop: '10px' }}>
                          <div style={{ fontSize: '12px', color: '#1e40af' }}>
                            Total Mandays Terhitung: <strong style={{ fontFamily: 'monospace', fontSize: '13px' }}>Rp {liveTotal.toLocaleString('id-ID')} / hari</strong>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setEditingItemId(null)}
                              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '11px', cursor: 'pointer' }}
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditManpower(m.id)}
                              style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Check size={13} /> Simpan Perubahan
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={m.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ flex: 1, marginRight: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: '#1e40af',
                            background: '#eff6ff',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: '1px solid #bfdbfe'
                          }}>
                            {m.category}
                          </span>
                          <strong style={{ fontSize: '13px', color: '#0f172a' }}>{m.role}</strong>
                        </div>
                        
                        {m.notes && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                            {m.notes}
                          </div>
                        )}

                        {/* Rincian Komponen Variabel Manpower */}
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap',
                          fontSize: '11px',
                          background: '#f8fafc',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #f1f5f9'
                        }}>
                          <span style={{ color: '#334155' }}>
                            Gaji Pokok: <strong>Rp {m.basicSalary.toLocaleString('id-ID')}</strong>
                          </span>
                          <span style={{ color: '#0369a1' }}>
                            • APD/PPE: <strong>Rp {m.ppeDaily.toLocaleString('id-ID')}</strong>
                          </span>
                          <span style={{ color: '#047857' }}>
                            • BPJS/Jamsostek: <strong>Rp {m.jamsostekDaily.toLocaleString('id-ID')}</strong>
                          </span>
                          <span style={{ color: '#b45309' }}>
                            • Makan/Mess: <strong>Rp {m.mealsDaily.toLocaleString('id-ID')}</strong>
                          </span>
                          {m.otherAllowanceDaily > 0 && (
                            <span style={{ color: '#6d28d9' }}>
                              • Tunjangan: <strong>Rp {m.otherAllowanceDaily.toLocaleString('id-ID')}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '170px' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                          Total Mandays
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e40af', fontFamily: 'monospace', marginBottom: '8px' }}>
                          Rp {m.totalRate.toLocaleString('id-ID')} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>/ hr</span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleStartEditManpower(m)}
                            title="Edit data master tenaga kerja ini"
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              color: '#0284c7',
                              cursor: 'pointer',
                              padding: '5px 7px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMasterItem(m.id)}
                            title="Hapus posisi ini dari master database"
                            style={{
                              background: '#ffffff',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '5px 7px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectManpower) onSelectManpower(m);
                              onClose();
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 12px',
                              backgroundColor: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(37,99,235,0.2)'
                            }}
                          >
                            <Plus size={13} />
                            <span>Pilih Pekerja</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB EQUIPMENT */}
          {type === 'equipment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredEquipment.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '13px' }}>
                  Tidak ada peralatan yang sesuai dengan kata kunci "{searchQuery}".
                </div>
              ) : (
                filteredEquipment.map(e => {
                  const isEditing = editingItemId === e.id;

                  if (isEditing) {
                    const bbmCalc = editEqFuelType === 'None' || editEqFuelType === 'Listrik' ? 0 : Math.round(editEqFuelLiters * editEqFuelPrice);
                    const liveTotal = editEqBaseRental + bbmCalc + editEqMaint + editEqMob;

                    return (
                      <div
                        key={e.id}
                        style={{
                          background: '#fffbeb',
                          border: '2px solid #d97706',
                          borderRadius: '8px',
                          padding: '14px',
                          boxShadow: '0 4px 6px -1px rgba(217,119,6,0.1)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Pencil size={13} /> Edit Master Peralatan & Mesin
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>ID: {e.id}</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                          <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                              Nama Alat / Mesin
                            </label>
                            <input
                              type="text"
                              value={editEqName}
                              onChange={(e) => setEditEqName(e.target.value)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box', fontWeight: 'bold' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                              Kategori
                            </label>
                            <input
                              list="eq-categories-list"
                              type="text"
                              value={editEqCategory}
                              onChange={(e) => setEditEqCategory(e.target.value)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                              Sewa Pokok Dry (Rp)
                            </label>
                            <input
                              type="number"
                              value={editEqBaseRental}
                              onChange={(e) => setEditEqBaseRental(parseFloat(e.target.value) || 0)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#b45309', marginBottom: '2px' }}>
                              Jenis BBM
                            </label>
                            <select
                              value={editEqFuelType}
                              onChange={(e) => setEditEqFuelType(e.target.value as MasterEquipment['fuelType'])}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                            >
                              <option value="Solar">Solar Industri</option>
                              <option value="Bensin">Bensin / Pertalite</option>
                              <option value="Listrik">Listrik</option>
                              <option value="None">Tanpa BBM (Dry)</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#b45309', marginBottom: '2px' }}>
                              BBM (Liter/Hari)
                            </label>
                            <input
                              type="number"
                              value={editEqFuelLiters}
                              onChange={(e) => setEditEqFuelLiters(parseFloat(e.target.value) || 0)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#b45309', marginBottom: '2px' }}>
                              Harga BBM / Liter
                            </label>
                            <input
                              type="number"
                              value={editEqFuelPrice}
                              onChange={(e) => setEditEqFuelPrice(parseFloat(e.target.value) || 0)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#047857', marginBottom: '2px' }}>
                              Pelumas & Servis
                            </label>
                            <input
                              type="number"
                              value={editEqMaint}
                              onChange={(e) => setEditEqMaint(parseFloat(e.target.value) || 0)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '2px' }}>
                              Mob / Demob Harian
                            </label>
                            <input
                              type="number"
                              value={editEqMob}
                              onChange={(e) => setEditEqMob(parseFloat(e.target.value) || 0)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                              Catatan / Spesifikasi
                            </label>
                            <input
                              type="text"
                              value={editEqNotes}
                              onChange={(e) => setEditEqNotes(e.target.value)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #fde68a', paddingTop: '10px' }}>
                          <div style={{ fontSize: '12px', color: '#92400e' }}>
                            Total Sewa Wet Terhitung: <strong style={{ fontFamily: 'monospace', fontSize: '13px' }}>Rp {liveTotal.toLocaleString('id-ID')} / hari</strong>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setEditingItemId(null)}
                              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '11px', cursor: 'pointer' }}
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditEquipment(e.id)}
                              style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: '#d97706', color: '#fff', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Check size={13} /> Simpan Perubahan
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={e.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ flex: 1, marginRight: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: '#b45309',
                            background: '#fffbeb',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: '1px solid #fde68a'
                          }}>
                            {e.category}
                          </span>
                          <strong style={{ fontSize: '13px', color: '#0f172a' }}>{e.name}</strong>
                        </div>

                        {e.notes && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                            {e.notes}
                          </div>
                        )}

                        {/* Rincian Komponen Variabel Equipment */}
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap',
                          fontSize: '11px',
                          background: '#f8fafc',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #f1f5f9'
                        }}>
                          <span style={{ color: '#334155' }}>
                            Sewa Pokok (Dry): <strong>Rp {e.baseRentalRate.toLocaleString('id-ID')}</strong>
                          </span>
                          <span style={{ color: '#b45309' }}>
                            • BBM ({e.fuelType}): <strong>Rp {e.bbmRate.toLocaleString('id-ID')}</strong> ({e.fuelLitersPerDay} L/hr)
                          </span>
                          {e.maintenanceRate > 0 && (
                            <span style={{ color: '#047857' }}>
                              • Maintenance: <strong>Rp {e.maintenanceRate.toLocaleString('id-ID')}</strong>
                            </span>
                          )}
                          {e.mobilizationDaily > 0 && (
                            <span style={{ color: '#64748b' }}>
                              • Mob/Demob: <strong>Rp {e.mobilizationDaily.toLocaleString('id-ID')}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '170px' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                          Tarif Sewa (Wet)
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#b45309', fontFamily: 'monospace', marginBottom: '8px' }}>
                          Rp {e.totalRate.toLocaleString('id-ID')} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>/ hari</span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleStartEditEquipment(e)}
                            title="Edit data master peralatan ini"
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              color: '#b45309',
                              cursor: 'pointer',
                              padding: '5px 7px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMasterItem(e.id)}
                            title="Hapus peralatan ini dari master database"
                            style={{
                              background: '#ffffff',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '5px 7px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectEquipment) onSelectEquipment(e);
                              onClose();
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 12px',
                              backgroundColor: '#b45309',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(180,83,9,0.2)'
                            }}
                          >
                            <Plus size={13} />
                            <span>Pilih Alat</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB MATERIAL UTAMA */}
          {type === 'material' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredMaterial.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '13px' }}>
                  Tidak ada material yang sesuai dengan kata kunci "{searchQuery}".
                </div>
              ) : (
                filteredMaterial.map(m => {
                  const isEditing = editingItemId === m.id;

                  if (isEditing) {
                    return (
                      <div
                        key={m.id}
                        style={{
                          background: '#ecfdf5',
                          border: '2px solid #059669',
                          borderRadius: '8px',
                          padding: '14px',
                          boxShadow: '0 4px 6px -1px rgba(5,150,105,0.1)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Pencil size={13} /> Edit Master Material Utama
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>ID: {m.id}</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                          <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                              Nama Material Utama
                            </label>
                            <input
                              type="text"
                              value={editMatName}
                              onChange={(e) => setEditMatName(e.target.value)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box', fontWeight: 'bold' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                              Kategori
                            </label>
                            <input
                              list="mat-categories-list"
                              type="text"
                              value={editMatCategory}
                              onChange={(e) => setEditMatCategory(e.target.value)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                              Satuan
                            </label>
                            <input
                              type="text"
                              value={editMatUnit}
                              onChange={(e) => setEditMatUnit(e.target.value)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#047857', marginBottom: '2px' }}>
                              Harga Standar (Rp)
                            </label>
                            <input
                              type="number"
                              value={editMatRate}
                              onChange={(e) => setEditMatRate(parseFloat(e.target.value) || 0)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#047857', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#16a34a', marginBottom: '2px' }}>
                              Harga Bawah (Rp)
                            </label>
                            <input
                              type="number"
                              value={editMatPriceLow}
                              onChange={(e) => setEditMatPriceLow(parseFloat(e.target.value) || 0)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#dc2626', marginBottom: '2px' }}>
                              Harga Atas (Rp)
                            </label>
                            <input
                              type="number"
                              value={editMatPriceHigh}
                              onChange={(e) => setEditMatPriceHigh(parseFloat(e.target.value) || 0)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                              Spesifikasi Teknis
                            </label>
                            <input
                              type="text"
                              value={editMatSpecs}
                              onChange={(e) => setEditMatSpecs(e.target.value)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>

                        {/* Benchmark Widget for easy pricing */}
                        {editMatName.trim().length > 1 && (
                          <MarketPriceLookupWidget
                            query={editMatName}
                            currentPrice={editMatRate}
                            unit={editMatUnit}
                            onSelectPrice={(newP) => setEditMatRate(newP)}
                          />
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #a7f3d0', paddingTop: '10px', marginTop: '10px' }}>
                          <button
                            type="button"
                            onClick={() => setEditingItemId(null)}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '11px', cursor: 'pointer' }}
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditMaterial(m.id)}
                            style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: '#059669', color: '#fff', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Check size={13} /> Simpan Perubahan
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={m.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ flex: 1, marginRight: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: '#065f46',
                            background: '#ecfdf5',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: '1px solid #a7f3d0'
                          }}>
                            {m.category}
                          </span>
                          <strong style={{ fontSize: '13px', color: '#0f172a' }}>{m.name}</strong>
                        </div>

                        {m.specs && (
                          <div style={{ fontSize: '11px', color: '#475569', marginBottom: '4px' }}>
                            Spesifikasi: <em>{m.specs}</em>
                          </div>
                        )}

                        {/* Rentang Harga Pasar Pill & Google Search Shortcut */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap',
                          fontSize: '11px',
                          background: '#f8fafc',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: '1px solid #f1f5f9'
                        }}>
                          <span style={{ color: '#166534', fontWeight: '600' }}>
                            🟢 Bawah: Rp {m.priceLow.toLocaleString('id-ID')}
                          </span>
                          <span style={{ color: '#1e40af', fontWeight: '600' }}>
                            • 🔵 Rata-rata: Rp {m.standardRate.toLocaleString('id-ID')}
                          </span>
                          <span style={{ color: '#991b1b', fontWeight: '600' }}>
                            • 🔴 Atas: Rp {m.priceHigh.toLocaleString('id-ID')}
                          </span>
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(`harga ${m.name} terbaru indonesia`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Cek harga live vendor di Google"
                            style={{
                              marginLeft: 'auto',
                              color: '#2563eb',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '10px',
                              fontWeight: '600'
                            }}
                          >
                            <span>Cek Google</span>
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '170px' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                          Harga Standar
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#047857', fontFamily: 'monospace', marginBottom: '8px' }}>
                          Rp {m.standardRate.toLocaleString('id-ID')} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>/ {m.unit}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleStartEditMaterial(m)}
                            title="Edit data master material ini"
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              color: '#059669',
                              cursor: 'pointer',
                              padding: '5px 7px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMasterItem(m.id)}
                            title="Hapus material ini dari master database"
                            style={{
                              background: '#ffffff',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '5px 7px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectMaterial) onSelectMaterial(m);
                              onClose();
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 12px',
                              backgroundColor: '#059669',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(5,150,105,0.2)'
                            }}
                          >
                            <Plus size={13} />
                            <span>Pilih Material</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB CONSUMABLES */}
          {type === 'consumable' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredConsumable.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '13px' }}>
                  Tidak ada bahan/consumable yang sesuai dengan kata kunci "{searchQuery}".
                </div>
              ) : (
                filteredConsumable.map(c => {
                  const isEditing = editingItemId === c.id;

                  if (isEditing) {
                    return (
                      <div
                        key={c.id}
                        style={{
                          background: '#faf5ff',
                          border: '2px solid #7c3aed',
                          borderRadius: '8px',
                          padding: '14px',
                          boxShadow: '0 4px 6px -1px rgba(124,58,237,0.1)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Pencil size={13} /> Edit Master Bahan & Consumables
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>ID: {c.id}</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                          <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                              Nama Bahan / Consumable
                            </label>
                            <input
                              type="text"
                              value={editMatName}
                              onChange={(e) => setEditMatName(e.target.value)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box', fontWeight: 'bold' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                              Kategori
                            </label>
                            <input
                              list="mat-categories-list"
                              type="text"
                              value={editMatCategory}
                              onChange={(e) => setEditMatCategory(e.target.value)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                              Satuan
                            </label>
                            <input
                              type="text"
                              value={editMatUnit}
                              onChange={(e) => setEditMatUnit(e.target.value)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#7c3aed', marginBottom: '2px' }}>
                              Harga Standar (Rp)
                            </label>
                            <input
                              type="number"
                              value={editMatRate}
                              onChange={(e) => setEditMatRate(parseFloat(e.target.value) || 0)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#7c3aed', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#16a34a', marginBottom: '2px' }}>
                              Harga Bawah (Rp)
                            </label>
                            <input
                              type="number"
                              value={editMatPriceLow}
                              onChange={(e) => setEditMatPriceLow(parseFloat(e.target.value) || 0)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#dc2626', marginBottom: '2px' }}>
                              Harga Atas (Rp)
                            </label>
                            <input
                              type="number"
                              value={editMatPriceHigh}
                              onChange={(e) => setEditMatPriceHigh(parseFloat(e.target.value) || 0)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontFamily: 'monospace', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                              Spesifikasi Teknis
                            </label>
                            <input
                              type="text"
                              value={editMatSpecs}
                              onChange={(e) => setEditMatSpecs(e.target.value)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>

                        {/* Benchmark Widget for easy pricing */}
                        {editMatName.trim().length > 1 && (
                          <MarketPriceLookupWidget
                            query={editMatName}
                            currentPrice={editMatRate}
                            unit={editMatUnit}
                            onSelectPrice={(newP) => setEditMatRate(newP)}
                          />
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e9d5ff', paddingTop: '10px', marginTop: '10px' }}>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>Klik Simpan untuk memperbarui database master</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setEditingItemId(null)}
                              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '11px', cursor: 'pointer' }}
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditMaterial(c.id)}
                              style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: '#7c3aed', color: '#fff', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Check size={13} /> Simpan Perubahan
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={c.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ flex: 1, marginRight: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: '#6b21a8',
                            background: '#f3e8ff',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: '1px solid #e9d5ff'
                          }}>
                            {c.category}
                          </span>
                          <strong style={{ fontSize: '13px', color: '#0f172a' }}>{c.name}</strong>
                        </div>

                        {c.specs && (
                          <div style={{ fontSize: '11px', color: '#475569', marginBottom: '4px' }}>
                            Spesifikasi: <em>{c.specs}</em>
                          </div>
                        )}

                        {/* Rentang Harga Pasar Pill & Google Search Shortcut */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap',
                          fontSize: '11px',
                          background: '#f8fafc',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: '1px solid #f1f5f9'
                        }}>
                          <span style={{ color: '#166534', fontWeight: '600' }}>
                            🟢 Bawah: Rp {c.priceLow.toLocaleString('id-ID')}
                          </span>
                          <span style={{ color: '#1e40af', fontWeight: '600' }}>
                            • 🔵 Rata-rata: Rp {c.standardRate.toLocaleString('id-ID')}
                          </span>
                          <span style={{ color: '#991b1b', fontWeight: '600' }}>
                            • 🔴 Atas: Rp {c.priceHigh.toLocaleString('id-ID')}
                          </span>
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(`harga ${c.name} terbaru indonesia`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Cek harga live vendor di Google"
                            style={{
                              marginLeft: 'auto',
                              color: '#2563eb',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '10px',
                              fontWeight: '600'
                            }}
                          >
                            <span>Cek Google</span>
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '170px' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                          Harga Standar
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#7c3aed', fontFamily: 'monospace', marginBottom: '8px' }}>
                          Rp {c.standardRate.toLocaleString('id-ID')} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>/ {c.unit}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleStartEditMaterial(c)}
                            title="Edit data master consumable ini"
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              color: '#7c3aed',
                              cursor: 'pointer',
                              padding: '5px 7px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMasterItem(c.id)}
                            title="Hapus consumable ini dari master database"
                            style={{
                              background: '#ffffff',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '5px 7px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectConsumable) onSelectConsumable(c);
                              onClose();
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 12px',
                              backgroundColor: '#7c3aed',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(124,58,237,0.2)'
                            }}
                          >
                            <Plus size={13} />
                            <span>Pilih Consumable</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>

        {/* 5. Modal Footer */}
        <div style={{
          padding: '12px 20px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={14} />
            <span>Master data otomatis tersimpan di browser Anda (LocalStorage) dan bisa diedit, ditambah, atau di-export kapan saja.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 16px',
              backgroundColor: '#e2e8f0',
              color: '#334155',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Selesai
          </button>
        </div>
      </div>

      {/* Modal Dialog Import Excel */}
      <MasterDataImportModal
        isOpen={isImportModalOpen}
        type={type}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
        onExportCurrent={handleExportBackup}
      />
    </div>
  );
};

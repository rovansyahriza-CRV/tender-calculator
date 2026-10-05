import React, { useState, useMemo, useEffect } from 'react';
import { 
  BASE_TREATMENT_CATALOG, 
  TREATMENT_CATEGORIES, 
  type BaseTreatmentTemplate 
} from '../data/treatmentCatalog';
import type { TreatmentItem, BoQItem, ResourceDetailItem } from '../App';
import { ResourceBreakdownModal } from './ResourceBreakdownModal';
import { ResourceLookupModal } from './ResourceLookupModal';
import type { MasterManpower, MasterEquipment, MasterMaterialItem } from '../data/resourceMasterData';
import { 
  X, 
  Search, 
  Plus, 
  Check, 
  Wrench, 
  Info, 
  Sparkles, 
  Sliders, 
  RotateCcw,
  BookOpen,
  Trash2,
  HardHat,
  Package,
  Layers
} from 'lucide-react';
import {
  fetchCustomTemplatesFromCloud,
  saveCustomTemplateToCloud,
  deleteCustomTemplateFromCloud
} from '../utils/supabaseClient';

interface Props {
  isOpen: boolean;
  boqItem: BoQItem | null;
  allBoqItems?: BoQItem[];
  onClose: () => void;
  onAddTreatment: (boqId: string, treatment: TreatmentItem) => void;
}

const CUSTOM_TEMPLATES_STORAGE_KEY = 'industrial_custom_treatment_templates';
const CUSTOM_CATEGORIES_STORAGE_KEY = 'industrial_custom_categories';
const DELETED_TEMPLATES_STORAGE_KEY = 'industrial_deleted_custom_template_ids';

const DEFAULT_EXTRA_CATEGORIES = [
  'Lifting',
  'Civil & Structure',
  'Electrical & Instrument',
  'Scaffolding & Access',
  'Logistics & Transport'
];

export const TreatmentCatalogDrawer: React.FC<Props> = ({
  isOpen,
  boqItem,
  allBoqItems = [],
  onClose,
  onAddTreatment
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  // 1. Saved Custom Templates State (Persisted in localStorage)
  const [savedCustomTemplates, setSavedCustomTemplates] = useState<BaseTreatmentTemplate[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // 2. Deleted Template IDs tracker
  const [deletedTemplateIds, setDeletedTemplateIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(DELETED_TEMPLATES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // 3. User Custom Categories (Persisted in localStorage)
  const [userCustomCategories, setUserCustomCategories] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.from(new Set([...DEFAULT_EXTRA_CATEGORIES, ...parsed]));
    } catch {
      return DEFAULT_EXTRA_CATEGORIES;
    }
  });

  // 4. Harvest custom treatments already existing across all BoQ items in the project
  const projectBoqTemplates = useMemo(() => {
    if (!allBoqItems || allBoqItems.length === 0) return [];
    
    const harvested: BaseTreatmentTemplate[] = [];
    const knownKeys = new Set(BASE_TREATMENT_CATALOG.map(t => `${t.category.toLowerCase()}:::${t.description.trim().toLowerCase()}`));
    savedCustomTemplates.forEach(t => {
      knownKeys.add(`${t.category.toLowerCase()}:::${t.description.trim().toLowerCase()}`);
    });

    allBoqItems.forEach(b => {
      if (!b.treatments) return;
      b.treatments.forEach(tr => {
        if (deletedTemplateIds.includes(tr.id)) return;
        const key = `${tr.category.toLowerCase()}:::${tr.description.trim().toLowerCase()}`;
        if (!knownKeys.has(key)) {
          knownKeys.add(key);
          harvested.push({
            id: tr.id.startsWith('custom-tpl-') ? tr.id : `tpl-boq-${tr.id}`,
            category: tr.category,
            description: tr.description,
            unit: tr.unit,
            defaultOutputPerDay: tr.outputPerDay > 0 ? tr.outputPerDay : 1,
            crewDailyRate: tr.crewDailyRate,
            equipmentDailyRate: tr.equipmentDailyRate,
            materialUnitRate: tr.materialUnitRate || 0,
            consumableUnitRate: tr.consumableUnitRate,
            notes: `Treatment dari BoQ Item ${b.itemNo}`,
            manpowerList: tr.manpowerList ? tr.manpowerList.map(m => ({ ...m })) : [],
            equipmentList: tr.equipmentList ? tr.equipmentList.map(e => ({ ...e })) : [],
            materialList: tr.materialList ? tr.materialList.map(m => ({ ...m })) : [],
            consumableList: tr.consumableList ? tr.consumableList.map(c => ({ ...c })) : []
          });
        }
      });
    });

    return harvested;
  }, [allBoqItems, savedCustomTemplates, deletedTemplateIds]);

  // Auto-sync harvested project treatments into savedCustomTemplates in localStorage
  useEffect(() => {
    if (projectBoqTemplates.length > 0) {
      setSavedCustomTemplates(prev => {
        const existingKeys = new Set(prev.map(p => `${p.category.toLowerCase()}:::${p.description.trim().toLowerCase()}`));
        const toAdd = projectBoqTemplates.filter(t => !existingKeys.has(`${t.category.toLowerCase()}:::${t.description.trim().toLowerCase()}`));
        if (toAdd.length === 0) return prev;
        const updated = [...toAdd, ...prev];
        try {
          localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
        } catch (err) {}
        return updated;
      });
    }
  }, [projectBoqTemplates]);

  // 5. Effective Catalog (Base + Saved Custom + Project Harvested)
  const effectiveCatalog = useMemo(() => {
    const map = new Map<string, BaseTreatmentTemplate>();
    BASE_TREATMENT_CATALOG.forEach(t => map.set(t.id, t));
    savedCustomTemplates.forEach(t => map.set(t.id, t));
    projectBoqTemplates.forEach(t => {
      if (!map.has(t.id)) {
        map.set(t.id, t);
      }
    });
    return Array.from(map.values());
  }, [savedCustomTemplates, projectBoqTemplates]);

  // Fetch custom templates dari Supabase Cloud saat Drawer dibuka
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    fetchCustomTemplatesFromCloud().then(cloudTpls => {
      if (!isMounted) return;
      if (cloudTpls && cloudTpls.length > 0) {
        setSavedCustomTemplates(prev => {
          const map = new Map<string, BaseTreatmentTemplate>();
          cloudTpls.forEach(t => map.set(t.id, t));
          prev.forEach(t => {
            if (!map.has(t.id)) map.set(t.id, t);
          });
          const merged = Array.from(map.values());
          try {
            localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }
    });
    return () => { isMounted = false; };
  }, [isOpen]);

  // Helper to save a template into savedCustomTemplates and localStorage & Supabase Cloud
  const handleSaveAsTemplate = (newTpl: BaseTreatmentTemplate) => {
    setSavedCustomTemplates(prev => {
      const existsIdx = prev.findIndex(t => t.id === newTpl.id || (t.category.toLowerCase() === newTpl.category.toLowerCase() && t.description.toLowerCase() === newTpl.description.toLowerCase()));
      let updated: BaseTreatmentTemplate[];
      if (existsIdx >= 0) {
        updated = [...prev];
        updated[existsIdx] = newTpl;
      } else {
        updated = [newTpl, ...prev];
      }
      try {
        localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });

    // Simpan ke Cloud Supabase
    saveCustomTemplateToCloud(newTpl);

    if (newTpl.category && newTpl.category !== 'Semua') {
      setUserCustomCategories(prev => {
        if (!prev.includes(newTpl.category)) {
          const updated = [...prev, newTpl.category];
          try {
            localStorage.setItem(CUSTOM_CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
          } catch (e) {}
          return updated;
        }
        return prev;
      });
    }
  };

  // Helper to delete a custom template from savedCustomTemplates & localStorage & Supabase Cloud
  const handleDeleteCustomTemplate = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Hapus template treatment kustom ini dari katalog?')) {
      setSavedCustomTemplates(prev => {
        const updated = prev.filter(t => t.id !== templateId);
        try {
          localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
        } catch (err) {}
        return updated;
      });
      setDeletedTemplateIds(prev => {
        const updated = [...prev, templateId];
        try {
          localStorage.setItem(DELETED_TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
        } catch (err) {}
        return updated;
      });

      // Hapus dari Cloud Supabase
      deleteCustomTemplateFromCloud(templateId);
    }
  };
  
  // Custom Treatment / SOW Form Toggle & Scope Type
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [sowType, setSowType] = useState<'multi' | 'manpower' | 'equipment' | 'material' | 'consumable'>('multi');
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const [customCategory, setCustomCategory] = useState('Piping & Mechanical');
  const [customDesc, setCustomDesc] = useState('');
  const [customQty, setCustomQty] = useState<number>(boqItem?.qty || 1);
  const [customUnit, setCustomUnit] = useState(boqItem?.unit || 'Lot');
  const [customOutput, setCustomOutput] = useState<number>(1);
  const [customCrewRate, setCustomCrewRate] = useState<number>(400000);
  const [customEquipRate, setCustomEquipRate] = useState<number>(100000);
  const [customMaterialRate, setCustomMaterialRate] = useState<number>(0);
  const [customConsumableRate, setCustomConsumableRate] = useState<number>(25000);

  // Dedicated single-resource inputs
  const [customDurationDays, setCustomDurationDays] = useState<number>(1);
  const [customCrewCount, setCustomCrewCount] = useState<number>(1);
  const [customDailyWage, setCustomDailyWage] = useState<number>(350000);
  const [customEquipCount, setCustomEquipCount] = useState<number>(1);
  const [customEquipRentalRate, setCustomEquipRentalRate] = useState<number>(1000000);

  // Modal Lookup Master Data for Custom Form
  const [isCustomLookupOpen, setIsCustomLookupOpen] = useState(false);
  const [customLookupType, setCustomLookupType] = useState<'manpower' | 'equipment' | 'material' | 'consumable'>('manpower');

  // Multi-Resource Dynamic Lists for Custom SOW (Supports multiple resources per category)
  const [customManpowerList, setCustomManpowerList] = useState<ResourceDetailItem[]>([]);
  const [customEquipmentList, setCustomEquipmentList] = useState<ResourceDetailItem[]>([]);
  const [customMaterialList, setCustomMaterialList] = useState<ResourceDetailItem[]>([]);
  const [customConsumableList, setCustomConsumableList] = useState<ResourceDetailItem[]>([]);
  const [customActiveTab, setCustomActiveTab] = useState<'manpower' | 'equipment' | 'material' | 'consumable'>('manpower');

  const totalCustomCrewRate = useMemo(() => {
    if (customManpowerList.length > 0) {
      return customManpowerList.reduce((acc, m) => acc + (m.qty * m.rate), 0);
    }
    return customCrewRate;
  }, [customManpowerList, customCrewRate]);

  const totalCustomEquipRate = useMemo(() => {
    if (customEquipmentList.length > 0) {
      return customEquipmentList.reduce((acc, e) => acc + (e.qty * e.rate), 0);
    }
    return customEquipRate;
  }, [customEquipmentList, customEquipRate]);

  const totalCustomMaterialRate = useMemo(() => {
    if (customMaterialList.length > 0) {
      return customMaterialList.reduce((acc, m) => acc + (m.qty * m.rate), 0);
    }
    return customMaterialRate;
  }, [customMaterialList, customMaterialRate]);

  const totalCustomConsumableRate = useMemo(() => {
    if (customConsumableList.length > 0) {
      return customConsumableList.reduce((acc, c) => acc + (c.qty * c.rate), 0);
    }
    return customConsumableRate;
  }, [customConsumableList, customConsumableRate]);

  const previewCost = useMemo(() => {
    if (sowType === 'multi') {
      const duration = customOutput > 0 ? customQty / customOutput : 0;
      const labor = duration * totalCustomCrewRate;
      const equip = duration * totalCustomEquipRate;
      const mat = customQty * totalCustomMaterialRate;
      const csm = customQty * totalCustomConsumableRate;
      const activeResCount = customManpowerList.length + customEquipmentList.length + customMaterialList.length + customConsumableList.length;
      return { 
        duration, 
        total: labor + equip + mat + csm, 
        desc: `${duration.toFixed(1)} hari kerja (${customQty} ${customUnit} ÷ ${customOutput}/hari) • ${activeResCount > 0 ? `${activeResCount} resources terpasang` : 'Paket Standar'}` 
      };
    }
    if (sowType === 'manpower') {
      const duration = customDurationDays > 0 ? customDurationDays : 1;
      const dailyTotal = customManpowerList.length > 0 
        ? totalCustomCrewRate 
        : (customCrewCount > 0 ? customCrewCount : 1) * customDailyWage;
      const total = duration * dailyTotal;
      return { 
        duration, 
        total, 
        desc: customManpowerList.length > 0
          ? `${customManpowerList.length} posisi kru × ${duration} hari @ Rp ${dailyTotal.toLocaleString('id-ID')}/hari`
          : `${customCrewCount} org × ${duration} hari @ Rp ${customDailyWage.toLocaleString('id-ID')}/hari` 
      };
    }
    if (sowType === 'equipment') {
      const duration = customDurationDays > 0 ? customDurationDays : 1;
      const dailyTotal = customEquipmentList.length > 0 
        ? totalCustomEquipRate 
        : (customEquipCount > 0 ? customEquipCount : 1) * customEquipRentalRate;
      const total = duration * dailyTotal;
      return { 
        duration, 
        total, 
        desc: customEquipmentList.length > 0
          ? `${customEquipmentList.length} unit alat × ${duration} hari @ Rp ${dailyTotal.toLocaleString('id-ID')}/hari`
          : `${customEquipCount} unit × ${duration} hari @ Rp ${customEquipRentalRate.toLocaleString('id-ID')}/hari` 
      };
    }
    if (sowType === 'material') {
      const qty = customQty > 0 ? customQty : 1;
      const unitRate = customMaterialList.length > 0 ? totalCustomMaterialRate : customMaterialRate;
      const total = qty * unitRate;
      return { 
        duration: 1, 
        total, 
        desc: `${qty} ${customUnit} @ Rp ${unitRate.toLocaleString('id-ID')}` 
      };
    }
    if (sowType === 'consumable') {
      const qty = customQty > 0 ? customQty : 1;
      const unitRate = customConsumableList.length > 0 ? totalCustomConsumableRate : customConsumableRate;
      const total = qty * unitRate;
      return { 
        duration: 1, 
        total, 
        desc: `${qty} ${customUnit} @ Rp ${unitRate.toLocaleString('id-ID')}` 
      };
    }
    return { duration: 1, total: 0, desc: '' };
  }, [
    sowType, customQty, customOutput, totalCustomCrewRate, totalCustomEquipRate, totalCustomMaterialRate, 
    totalCustomConsumableRate, customDurationDays, customCrewCount, customDailyWage, 
    customEquipCount, customEquipRentalRate, customUnit, customManpowerList, customEquipmentList, 
    customMaterialList, customConsumableList
  ]);

  const allAvailableCategories = useMemo(() => {
    const fromTemplates = effectiveCatalog.map(t => t.category);
    const list = [...TREATMENT_CATEGORIES.filter(c => c !== 'Semua'), ...DEFAULT_EXTRA_CATEGORIES, ...userCustomCategories, ...fromTemplates];
    return Array.from(new Set(list));
  }, [effectiveCatalog, userCustomCategories]);

  const allPillCategories = useMemo(() => {
    const fromCatalog = effectiveCatalog.map(t => t.category);
    const combined = ['Semua', ...fromCatalog, ...allAvailableCategories];
    return Array.from(new Set(combined));
  }, [effectiveCatalog, allAvailableCategories]);

  // Per-card Qty state memory
  const [qtyOverrides, setQtyOverrides] = useState<Record<string, number>>({});

  // Per-card Customized breakdown template memory
  const [customizedTemplates, setCustomizedTemplates] = useState<Record<string, BaseTreatmentTemplate>>({});
  
  // Modal Breakdown state
  const [editingTemplateForModal, setEditingTemplateForModal] = useState<TreatmentItem | null>(null);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

  // Filter katalog
  const filteredCatalog = useMemo(() => {
    return effectiveCatalog.filter(item => {
      const matchCat = selectedCategory === 'Semua' || item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchQuery = 
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [effectiveCatalog, searchQuery, selectedCategory]);

  if (!isOpen || !boqItem) return null;

  const getEffectiveTemplate = (original: BaseTreatmentTemplate): BaseTreatmentTemplate => {
    return customizedTemplates[original.id] || original;
  };

  const getEffectiveQty = (template: BaseTreatmentTemplate) => {
    if (qtyOverrides[template.id] !== undefined) {
      return qtyOverrides[template.id];
    }
    return boqItem.qty > 0 ? boqItem.qty : 1;
  };

  const handleQtyChange = (templateId: string, val: number) => {
    setQtyOverrides(prev => ({
      ...prev,
      [templateId]: Math.max(0.01, val)
    }));
  };

  const handleOpenBreakdownModal = (template: BaseTreatmentTemplate) => {
    const active = getEffectiveTemplate(template);
    const qty = getEffectiveQty(template);
    const tempItem: TreatmentItem = {
      id: active.id,
      category: active.category,
      description: active.description,
      qty: qty,
      unit: active.unit,
      outputPerDay: active.defaultOutputPerDay,
      crewDailyRate: active.crewDailyRate,
      equipmentDailyRate: active.equipmentDailyRate,
      materialUnitRate: active.materialUnitRate || 0,
      consumableUnitRate: active.consumableUnitRate,
      manpowerList: active.manpowerList ? active.manpowerList.map(m => ({ ...m })) : [],
      equipmentList: active.equipmentList ? active.equipmentList.map(e => ({ ...e })) : [],
      materialList: active.materialList ? active.materialList.map(m => ({ ...m })) : [],
      consumableList: active.consumableList ? active.consumableList.map(c => ({ ...c })) : []
    };

    setEditingTemplateForModal(tempItem);
    setIsResourceModalOpen(true);
  };

  const handleSaveBreakdownFromModal = (updated: TreatmentItem) => {
    if (updated.id.startsWith('treat-custom-')) {
      onAddTreatment(boqItem.id, updated);

      const newTemplate: BaseTreatmentTemplate = {
        id: `custom-tpl-${Date.now()}`,
        category: updated.category,
        description: updated.description,
        unit: updated.unit,
        defaultOutputPerDay: updated.outputPerDay > 0 ? updated.outputPerDay : 1,
        crewDailyRate: updated.crewDailyRate,
        equipmentDailyRate: updated.equipmentDailyRate,
        materialUnitRate: updated.materialUnitRate || 0,
        consumableUnitRate: updated.consumableUnitRate,
        notes: 'Template Kustom Proyek',
        manpowerList: updated.manpowerList ? updated.manpowerList.map(m => ({ ...m })) : [],
        equipmentList: updated.equipmentList ? updated.equipmentList.map(e => ({ ...e })) : [],
        materialList: updated.materialList ? updated.materialList.map(m => ({ ...m })) : [],
        consumableList: updated.consumableList ? updated.consumableList.map(c => ({ ...c })) : []
      };

      handleSaveAsTemplate(newTemplate);
      setSelectedCategory(updated.category);

      setIsResourceModalOpen(false);
      setEditingTemplateForModal(null);
      setIsCustomOpen(false);
      setCustomDesc('');
      return;
    }

    const original = effectiveCatalog.find(t => t.id === updated.id);
    if (original) {
      const updatedTpl: BaseTreatmentTemplate = {
        ...original,
        defaultOutputPerDay: updated.outputPerDay,
        crewDailyRate: updated.crewDailyRate,
        equipmentDailyRate: updated.equipmentDailyRate,
        materialUnitRate: updated.materialUnitRate || 0,
        consumableUnitRate: updated.consumableUnitRate,
        manpowerList: updated.manpowerList || [],
        equipmentList: updated.equipmentList || [],
        materialList: updated.materialList || [],
        consumableList: updated.consumableList || []
      };

      if (!BASE_TREATMENT_CATALOG.some(b => b.id === original.id)) {
        // Saved custom template -> update directly in storage
        handleSaveAsTemplate(updatedTpl);
      } else {
        // Standard template -> update in customizedTemplates
        setCustomizedTemplates(prev => ({
          ...prev,
          [updated.id]: updatedTpl
        }));
      }
    }
    setQtyOverrides(prev => ({ ...prev, [updated.id]: updated.qty }));
    setIsResourceModalOpen(false);
    setEditingTemplateForModal(null);
  };

  const handleOpenLookupForCustom = (specificType?: 'manpower' | 'equipment' | 'material' | 'consumable') => {
    if (specificType) {
      setCustomLookupType(specificType);
    } else if (sowType === 'manpower') {
      setCustomLookupType('manpower');
    } else if (sowType === 'equipment') {
      setCustomLookupType('equipment');
    } else if (sowType === 'material') {
      setCustomLookupType('material');
    } else if (sowType === 'consumable') {
      setCustomLookupType('consumable');
    } else {
      setCustomLookupType(customActiveTab);
    }
    setIsCustomLookupOpen(true);
  };

  const handleSelectCustomLookupManpower = (item: MasterManpower) => {
    const newItem: ResourceDetailItem = {
      id: `mp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: item.role,
      qty: 1,
      unit: item.unit || 'org',
      rate: item.totalRate,
      basicSalary: item.basicSalary,
      ppeDaily: item.ppeDaily,
      jamsostekDaily: item.jamsostekDaily,
      mealsDaily: item.mealsDaily,
      otherAllowanceDaily: item.otherAllowanceDaily
    };
    setCustomManpowerList(prev => [...prev, newItem]);
    setCustomCrewRate(item.totalRate);
    if (!customDesc.trim()) {
      setCustomDesc(item.role);
    }
    if (item.category && item.category !== 'Semua') {
      setCustomCategory(item.category);
    }
    setIsCustomLookupOpen(false);
  };

  const handleSelectCustomLookupEquipment = (item: MasterEquipment) => {
    const newItem: ResourceDetailItem = {
      id: `eq-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: item.name,
      qty: 1,
      unit: item.unit || 'unit',
      rate: item.totalRate,
      baseRentalRate: item.baseRentalRate,
      fuelType: item.fuelType,
      fuelLitersPerDay: item.fuelLitersPerDay,
      fuelPricePerLiter: item.fuelPricePerLiter,
      bbmRate: item.bbmRate,
      maintenanceRate: item.maintenanceRate
    };
    setCustomEquipmentList(prev => [...prev, newItem]);
    setCustomEquipRate(item.totalRate);
    if (!customDesc.trim()) {
      setCustomDesc(item.name);
    }
    if (item.category && item.category !== 'Semua') {
      setCustomCategory(item.category);
    }
    setIsCustomLookupOpen(false);
  };

  const handleSelectCustomLookupMaterial = (item: MasterMaterialItem) => {
    const newItem: ResourceDetailItem = {
      id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: item.name,
      qty: 1,
      unit: item.unit || 'pcs',
      rate: item.standardRate
    };
    setCustomMaterialList(prev => [...prev, newItem]);
    if (!customDesc.trim()) {
      setCustomDesc(item.name);
    }
    if (item.category && item.category !== 'Semua') {
      setCustomCategory(item.category);
    }
    setIsCustomLookupOpen(false);
  };

  const handleSelectCustomLookupConsumable = (item: MasterMaterialItem) => {
    const newItem: ResourceDetailItem = {
      id: `cs-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: item.name,
      qty: 1,
      unit: item.unit || 'can',
      rate: item.standardRate
    };
    setCustomConsumableList(prev => [...prev, newItem]);
    if (!customDesc.trim()) {
      setCustomDesc(item.name);
    }
    if (item.category && item.category !== 'Semua') {
      setCustomCategory(item.category);
    }
    setIsCustomLookupOpen(false);
  };

  const handleAddManualCustomItem = (cat: 'manpower' | 'equipment' | 'material' | 'consumable') => {
    if (cat === 'manpower') {
      setCustomManpowerList(prev => [
        ...prev,
        {
          id: `mp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          name: 'Pekerja / Kru Baru',
          qty: 1,
          unit: 'org',
          rate: 350000,
          basicSalary: 350000
        }
      ]);
    } else if (cat === 'equipment') {
      setCustomEquipmentList(prev => [
        ...prev,
        {
          id: `eq-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          name: 'Peralatan / Unit Baru',
          qty: 1,
          unit: 'unit',
          rate: 500000,
          baseRentalRate: 500000
        }
      ]);
    } else if (cat === 'material') {
      setCustomMaterialList(prev => [
        ...prev,
        {
          id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          name: 'Material Baru',
          qty: 1,
          unit: 'pcs',
          rate: 50000
        }
      ]);
    } else if (cat === 'consumable') {
      setCustomConsumableList(prev => [
        ...prev,
        {
          id: `cs-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          name: 'Consumable Baru',
          qty: 1,
          unit: 'can',
          rate: 25000
        }
      ]);
    }
  };

  const handleDeleteCustomItem = (cat: 'manpower' | 'equipment' | 'material' | 'consumable', id: string) => {
    if (cat === 'manpower') setCustomManpowerList(prev => prev.filter(i => i.id !== id));
    if (cat === 'equipment') setCustomEquipmentList(prev => prev.filter(i => i.id !== id));
    if (cat === 'material') setCustomMaterialList(prev => prev.filter(i => i.id !== id));
    if (cat === 'consumable') setCustomConsumableList(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateCustomItem = (
    cat: 'manpower' | 'equipment' | 'material' | 'consumable',
    id: string,
    field: keyof ResourceDetailItem,
    val: any
  ) => {
    const updater = (list: ResourceDetailItem[]) => list.map(item => item.id === id ? { ...item, [field]: val } : item);
    if (cat === 'manpower') setCustomManpowerList(updater);
    if (cat === 'equipment') setCustomEquipmentList(updater);
    if (cat === 'material') setCustomMaterialList(updater);
    if (cat === 'consumable') setCustomConsumableList(updater);
  };

  const handleOpenCustomBreakdownModal = () => {
    const finalCategory = isCreatingNewCategory && newCategoryInput.trim() 
      ? newCategoryInput.trim() 
      : customCategory;

    const desc = customDesc.trim() || 'Custom Treatment SOW';

    const initialManpower = customManpowerList.length > 0 
      ? customManpowerList 
      : (customCrewRate > 0 ? [{ id: `mp-${Date.now()}-1`, name: `Kru: ${desc}`, qty: 1, unit: 'org', rate: customCrewRate }] : []);

    const initialEquipment = customEquipmentList.length > 0 
      ? customEquipmentList 
      : (customEquipRate > 0 ? [{ id: `eq-${Date.now()}-1`, name: `Alat: ${desc}`, qty: 1, unit: 'unit', rate: customEquipRate, baseRentalRate: customEquipRate }] : []);

    const initialMaterial = customMaterialList.length > 0 
      ? customMaterialList 
      : (customMaterialRate > 0 ? [{ id: `mat-${Date.now()}-1`, name: `Material: ${desc}`, qty: 1, unit: customUnit || 'Unit', rate: customMaterialRate }] : []);

    const initialConsumable = customConsumableList.length > 0 
      ? customConsumableList 
      : (customConsumableRate > 0 ? [{ id: `cs-${Date.now()}-1`, name: `Consumable: ${desc}`, qty: 1, unit: customUnit || 'Unit', rate: customConsumableRate }] : []);

    const tempItem: TreatmentItem = {
      id: `treat-custom-${Date.now()}`,
      category: finalCategory,
      description: desc,
      qty: (sowType === 'manpower' || sowType === 'equipment') ? (customDurationDays > 0 ? customDurationDays : 1) : (customQty > 0 ? customQty : 1),
      unit: (sowType === 'manpower' || sowType === 'equipment') ? (customUnit || 'Hari') : (customUnit || 'Unit'),
      outputPerDay: (sowType === 'manpower' || sowType === 'equipment' || sowType === 'material' || sowType === 'consumable') ? 1 : (customOutput > 0 ? customOutput : 1),
      crewDailyRate: sowType === 'manpower' ? (customCrewCount * customDailyWage) : customCrewRate,
      equipmentDailyRate: sowType === 'equipment' ? (customEquipCount * customEquipRentalRate) : customEquipRate,
      materialUnitRate: customMaterialRate,
      consumableUnitRate: customConsumableRate,
      manpowerList: initialManpower,
      equipmentList: initialEquipment,
      materialList: initialMaterial,
      consumableList: initialConsumable
    };

    setEditingTemplateForModal(tempItem);
    setIsResourceModalOpen(true);
  };

  const handleResetTemplate = (templateId: string) => {
    setCustomizedTemplates(prev => {
      const copy = { ...prev };
      delete copy[templateId];
      return copy;
    });
  };

  const handleSelectTemplate = (template: BaseTreatmentTemplate) => {
    const active = getEffectiveTemplate(template);
    const qty = getEffectiveQty(template);
    const newTreatment: TreatmentItem = {
      id: `treat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      category: active.category,
      description: active.description,
      qty: qty,
      unit: active.unit,
      outputPerDay: active.defaultOutputPerDay,
      crewDailyRate: active.crewDailyRate,
      equipmentDailyRate: active.equipmentDailyRate,
      materialUnitRate: active.materialUnitRate || 0,
      consumableUnitRate: active.consumableUnitRate,
      manpowerList: active.manpowerList ? active.manpowerList.map(m => ({ ...m })) : [],
      equipmentList: active.equipmentList ? active.equipmentList.map(e => ({ ...e })) : [],
      materialList: active.materialList ? active.materialList.map(m => ({ ...m })) : [],
      consumableList: active.consumableList ? active.consumableList.map(c => ({ ...c })) : []
    };

    onAddTreatment(boqItem.id, newTreatment);

    // Feedback sesaat
    setAddedItemIds(prev => ({ ...prev, [template.id]: true }));
    setTimeout(() => {
      setAddedItemIds(prev => ({ ...prev, [template.id]: false }));
    }, 1500);
  };

  const handleSowTypeChange = (type: 'multi' | 'manpower' | 'equipment' | 'material' | 'consumable') => {
    setSowType(type);
    if (type === 'manpower') {
      setCustomUnit('Hari');
    } else if (type === 'equipment') {
      setCustomUnit('Hari');
    } else if (type === 'material') {
      setCustomUnit('Pcs');
    } else if (type === 'consumable') {
      setCustomUnit('Can');
    } else {
      setCustomUnit(boqItem?.unit || 'Lot');
    }
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDesc.trim()) return;

    const finalCategory = isCreatingNewCategory && newCategoryInput.trim() 
      ? newCategoryInput.trim() 
      : customCategory;

    if (isCreatingNewCategory && newCategoryInput.trim()) {
      if (!userCustomCategories.includes(newCategoryInput.trim())) {
        setUserCustomCategories(prev => [...prev, newCategoryInput.trim()]);
      }
      setCustomCategory(newCategoryInput.trim());
      setIsCreatingNewCategory(false);
      setNewCategoryInput('');
    }

    let finalCrewRate = 0;
    let finalEquipRate = 0;
    let finalMaterialRate = 0;
    let finalConsumableRate = 0;

    let newManpower: ResourceDetailItem[] = [];
    let newEquipment: ResourceDetailItem[] = [];
    let newMaterial: ResourceDetailItem[] = [];
    let newConsumable: ResourceDetailItem[] = [];

    const durationDays = customDurationDays > 0 ? customDurationDays : 1;
    const crewCount = customCrewCount > 0 ? customCrewCount : 1;
    const equipCount = customEquipCount > 0 ? customEquipCount : 1;

    if (sowType === 'multi') {
      finalCrewRate = totalCustomCrewRate;
      finalEquipRate = totalCustomEquipRate;
      finalMaterialRate = totalCustomMaterialRate;
      finalConsumableRate = totalCustomConsumableRate;

      newManpower = customManpowerList.length > 0 ? customManpowerList : (
        customCrewRate > 0 ? [{ id: `mp-${Date.now()}-1`, name: `Kru: ${customDesc.trim()}`, qty: 1, unit: 'org', rate: customCrewRate }] : []
      );
      newEquipment = customEquipmentList.length > 0 ? customEquipmentList : (
        customEquipRate > 0 ? [{ id: `eq-${Date.now()}-1`, name: `Alat: ${customDesc.trim()}`, qty: 1, unit: 'unit', rate: customEquipRate, baseRentalRate: customEquipRate }] : []
      );
      newMaterial = customMaterialList.length > 0 ? customMaterialList : (
        customMaterialRate > 0 ? [{ id: `mat-${Date.now()}-1`, name: `Material: ${customDesc.trim()}`, qty: 1, unit: customUnit.trim() || 'Unit', rate: customMaterialRate }] : []
      );
      newConsumable = customConsumableList.length > 0 ? customConsumableList : (
        customConsumableRate > 0 ? [{ id: `cs-${Date.now()}-1`, name: `Consumable: ${customDesc.trim()}`, qty: 1, unit: customUnit.trim() || 'Unit', rate: customConsumableRate }] : []
      );
    } else if (sowType === 'manpower') {
      finalCrewRate = customManpowerList.length > 0 ? totalCustomCrewRate : (crewCount * customDailyWage);
      newManpower = customManpowerList.length > 0 ? customManpowerList : [{ 
        id: `mp-${Date.now()}-1`, 
        name: customDesc.trim(), 
        qty: crewCount, 
        unit: 'org', 
        rate: customDailyWage,
        basicSalary: customDailyWage 
      }];
    } else if (sowType === 'equipment') {
      finalEquipRate = customEquipmentList.length > 0 ? totalCustomEquipRate : (equipCount * customEquipRentalRate);
      newEquipment = customEquipmentList.length > 0 ? customEquipmentList : [{ 
        id: `eq-${Date.now()}-1`, 
        name: customDesc.trim(), 
        qty: equipCount, 
        unit: 'unit', 
        rate: customEquipRentalRate, 
        baseRentalRate: customEquipRentalRate 
      }];
    } else if (sowType === 'material') {
      finalMaterialRate = customMaterialList.length > 0 ? totalCustomMaterialRate : customMaterialRate;
      newMaterial = customMaterialList.length > 0 ? customMaterialList : [{ 
        id: `mat-${Date.now()}-1`, 
        name: customDesc.trim(), 
        qty: 1, 
        unit: customUnit.trim() || 'Unit', 
        rate: customMaterialRate 
      }];
    } else if (sowType === 'consumable') {
      finalConsumableRate = customConsumableList.length > 0 ? totalCustomConsumableRate : customConsumableRate;
      newConsumable = customConsumableList.length > 0 ? customConsumableList : [{ 
        id: `cs-${Date.now()}-1`, 
        name: customDesc.trim(), 
        qty: 1, 
        unit: customUnit.trim() || 'Unit', 
        rate: customConsumableRate 
      }];
    }

    const newTemplateId = `custom-tpl-${Date.now()}`;
    const newTreatment: TreatmentItem = {
      id: `treat-custom-${Date.now()}`,
      category: finalCategory,
      description: customDesc.trim(),
      qty: (sowType === 'manpower' || sowType === 'equipment') 
        ? durationDays 
        : (customQty > 0 ? customQty : 1),
      unit: (sowType === 'manpower' || sowType === 'equipment') 
        ? (customUnit.trim() || 'Hari') 
        : (customUnit.trim() || 'Unit'),
      outputPerDay: (sowType === 'manpower' || sowType === 'equipment' || sowType === 'material' || sowType === 'consumable') 
        ? 1 
        : (customOutput > 0 ? customOutput : 1),
      crewDailyRate: finalCrewRate,
      equipmentDailyRate: finalEquipRate,
      materialUnitRate: finalMaterialRate,
      consumableUnitRate: finalConsumableRate,
      manpowerList: newManpower,
      equipmentList: newEquipment,
      materialList: newMaterial,
      consumableList: newConsumable
    };

    onAddTreatment(boqItem.id, newTreatment);

    // Save as persistent custom template in catalog
    const newTemplate: BaseTreatmentTemplate = {
      id: newTemplateId,
      category: finalCategory,
      description: customDesc.trim(),
      unit: (sowType === 'manpower' || sowType === 'equipment') 
        ? (customUnit.trim() || 'Hari') 
        : (customUnit.trim() || 'Unit'),
      defaultOutputPerDay: (sowType === 'manpower' || sowType === 'equipment' || sowType === 'material' || sowType === 'consumable') 
        ? 1 
        : (customOutput > 0 ? customOutput : 1),
      crewDailyRate: finalCrewRate,
      equipmentDailyRate: finalEquipRate,
      materialUnitRate: finalMaterialRate,
      consumableUnitRate: finalConsumableRate,
      notes: 'Template Kustom Proyek',
      manpowerList: newManpower.map(m => ({ ...m })),
      equipmentList: newEquipment.map(e => ({ ...e })),
      materialList: newMaterial.map(m => ({ ...m })),
      consumableList: newConsumable.map(c => ({ ...c }))
    };

    handleSaveAsTemplate(newTemplate);
    setSelectedCategory(finalCategory);

    setCustomDesc('');
    setCustomManpowerList([]);
    setCustomEquipmentList([]);
    setCustomMaterialList([]);
    setCustomConsumableList([]);
    setIsCustomOpen(false);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Piping & Mechanical':
        return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
      case 'Tubular OCTG':
        return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
      case 'Blasting & Painting':
        return { bg: '#fffbeb', text: '#b45309', border: '#fde68a' };
      case 'NDT Testing':
        return { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' };
      case 'HVAC & Maintenance':
        return { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' };
      case 'Crew Mandays':
        return { bg: '#f8fafc', text: '#334155', border: '#cbd5e1' };
      case 'Lifting':
        return { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' };
      case 'Civil & Structure':
        return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 'Electrical & Instrument':
        return { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc' };
      case 'Scaffolding & Access':
        return { bg: '#fdf2f8', text: '#be185d', border: '#fbcfe8' };
      case 'Logistics & Transport':
        return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' };
      default:
        return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)' }}>
      {/* Background click to close */}
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />

      {/* Drawer Container */}
      <div 
        style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: '720px', 
          height: '100%', 
          backgroundColor: '#ffffff', 
          boxShadow: '-8px 0 25px -5px rgba(0, 0, 0, 0.25)', 
          display: 'flex', 
          flexDirection: 'column',
          zIndex: 1,
          fontFamily: 'Segoe UI, Tahoma, sans-serif'
        }}
      >
        {/* 1. Header Drawer */}
        <div style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '18px 22px', borderBottom: '3px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: '#f59e0b', color: '#0f172a', padding: '6px', borderRadius: '6px', display: 'flex' }}>
                <Wrench size={18} />
              </div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Katalog Base Treatment Standar</h2>
            </div>
            <button 
              onClick={onClose} 
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Info BoQ Target */}
          <div style={{ background: '#1e293b', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
            <span style={{ background: '#f59e0b', color: '#0f172a', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
              {boqItem.itemNo}
            </span>
            <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#f8fafc' }}>
              {boqItem.description}
            </div>
            <div style={{ color: '#94a3b8', fontWeight: '600', whiteSpace: 'nowrap' }}>
              Vol: {boqItem.qty.toLocaleString('id-ID')} {boqItem.unit}
            </div>
          </div>
        </div>

        {/* 2. Search & Category Filters */}
        <div style={{ padding: '14px 22px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
            <input 
              type="text"
              placeholder="Cari preset treatment (misal: welding, blasting, AC, foreman...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none',
                background: '#ffffff'
              }}
            />
          </div>

          {/* Category Pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {allPillCategories.map(cat => {
              const count = cat === 'Semua' 
                ? effectiveCatalog.length 
                : effectiveCatalog.filter(i => i.category.toLowerCase() === cat.toLowerCase()).length;
              const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: isSelected ? 'bold' : '600',
                    border: '1px solid',
                    borderColor: isSelected ? '#0f172a' : '#cbd5e1',
                    background: isSelected ? '#0f172a' : '#ffffff',
                    color: isSelected ? '#fbbf24' : '#475569',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Catalog Items List */}
        <div style={{ padding: '16px 22px', overflowY: 'auto', flex: 1, backgroundColor: '#f1f5f9' }}>
          
          {/* Tombol Buat Custom Treatment */}
          <div style={{ marginBottom: '14px' }}>
            <button
              onClick={() => {
                const nextOpen = !isCustomOpen;
                setIsCustomOpen(nextOpen);
                if (nextOpen && selectedCategory !== 'Semua') {
                  setCustomCategory(selectedCategory);
                }
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: isCustomOpen ? '#f8fafc' : '#ffffff',
                border: '1px dashed #2563eb',
                borderRadius: '8px',
                color: '#2563eb',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Sparkles size={16} />
              {isCustomOpen 
                ? 'Tutup Formulir Custom Treatment' 
                : `+ Buat Treatment Kustom Sendiri ${selectedCategory !== 'Semua' ? `(${selectedCategory})` : ''}`}
            </button>

            {/* Form Custom Treatment */}
            {isCustomOpen && (
              <form 
                onSubmit={handleCreateCustom}
                style={{ 
                  marginTop: '10px', 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #bfdbfe', 
                  borderRadius: '8px', 
                  padding: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Formulir Lingkup SOW / Treatment Kustom Baru</span>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>Pilih multi-resources atau single-resource</span>
                </div>

                {/* Segmented Selector Tipe Lingkup Resources */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                    Tipe Lingkup Resources:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                    {[
                      { key: 'multi', label: 'Paket Lengkap', sub: 'Kru + Alat + Bahan', icon: '📦' },
                      { key: 'manpower', label: 'Tenaga Kerja', sub: 'Mandays Kru', icon: '👷' },
                      { key: 'equipment', label: 'Sewa Alat', sub: 'Unit-Hari', icon: '🚜' },
                      { key: 'material', label: 'Material', sub: 'Bahan Pokok', icon: '🧱' },
                      { key: 'consumable', label: 'Consumables', sub: 'Bahan Pembantu', icon: '🧴' }
                    ].map(t => {
                      const isSelected = sowType === t.key;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => handleSowTypeChange(t.key as any)}
                          style={{
                            padding: '8px 4px',
                            borderRadius: '6px',
                            border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                            background: isSelected ? '#eff6ff' : '#f8fafc',
                            color: isSelected ? '#1e40af' : '#475569',
                            cursor: 'pointer',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          <span style={{ fontSize: '15px' }}>{t.icon}</span>
                          <span style={{ fontSize: '11px', fontWeight: isSelected ? 'bold' : '600', lineHeight: 1.2 }}>{t.label}</span>
                          <span style={{ fontSize: '9px', color: isSelected ? '#3b82f6' : '#94a3b8' }}>{t.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Kategori Disiplin</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingNewCategory(!isCreatingNewCategory);
                          if (!isCreatingNewCategory) setNewCategoryInput('');
                        }}
                        style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}
                      >
                        {isCreatingNewCategory ? '← Pilih dari Daftar' : '+ Ketik Kategori Baru'}
                      </button>
                    </div>

                    {isCreatingNewCategory ? (
                      <input
                        type="text"
                        required
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        placeholder="Ketik kategori baru (misal: Civil Works)..."
                        style={{ width: '100%', padding: '6px 8px', border: '1.5px solid #2563eb', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box', background: '#eff6ff' }}
                        autoFocus
                      />
                    ) : (
                      <select 
                        value={customCategory} 
                        onChange={(e) => {
                          if (e.target.value === '__NEW__') {
                            setIsCreatingNewCategory(true);
                            setNewCategoryInput('');
                          } else {
                            setCustomCategory(e.target.value);
                          }
                        }}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px' }}
                      >
                        {allAvailableCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="__NEW__">+ Ketik Kategori Baru Sendiri...</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Satuan Kerja (UoM)</label>
                    <input 
                      type="text" 
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      placeholder={
                        sowType === 'manpower' ? 'org-hari / mandays' :
                        sowType === 'equipment' ? 'unit-hari / shift' :
                        sowType === 'material' ? 'kg / btg / sak / m3' :
                        sowType === 'consumable' ? 'pcs / can / roll' : 'Joint / m2 / Lot'
                      }
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>
                      Deskripsi SOW / Lingkup Pekerjaan:
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOpenLookupForCustom()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                      title="Pilih dari database master tenaga kerja, alat, atau material"
                    >
                      <BookOpen size={12} />
                      ⚡ Lookup dari Master Data
                    </button>
                  </div>
                  <input 
                    type="text" 
                    required
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    placeholder={
                      sowType === 'multi' ? 'Contoh: Fit-up & Welding Spool 4 inch Sch 40 Carbon Steel' :
                      sowType === 'manpower' ? 'Contoh: Welder 6G Carbon Steel Harian' :
                      sowType === 'equipment' ? 'Contoh: Sewa Mobile Crane 25 Ton Harian c/w Operator' :
                      sowType === 'material' ? 'Contoh: Pengadaan Baut Anchor Bolt M16 Material A307' :
                      'Contoh: Kawat Las LB-52 Dia 3.2mm'
                    }
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* A. Lingkup Multi-Resource (Paket Lengkap) */}
                {sowType === 'multi' && (
                  <div>
                    {/* Baris Volume & Output Target */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#475569', fontWeight: 'bold', marginBottom: '4px' }}>
                          Volume BoQ (Qty)
                        </label>
                        <input 
                          type="number" 
                          value={customQty}
                          onChange={(e) => setCustomQty(parseFloat(e.target.value) || 0)}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#475569', fontWeight: 'bold', marginBottom: '4px' }}>
                          Target Output / Hari
                        </label>
                        <input 
                          type="number" 
                          value={customOutput}
                          onChange={(e) => setCustomOutput(parseFloat(e.target.value) || 1)}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    {/* Ringkasan Sub-Komponen Biaya (Otomatis Terhitung dari Rincian Resources di Bawah) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
                      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '6px 8px' }}>
                        <span style={{ fontSize: '10px', color: '#1e40af', fontWeight: 'bold', display: 'block' }}>Kru / Hari</span>
                        <strong style={{ fontSize: '12px', color: '#1e3a8a', fontFamily: 'monospace' }}>
                          Rp {totalCustomCrewRate.toLocaleString('id-ID')}
                        </strong>
                      </div>
                      <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', padding: '6px 8px' }}>
                        <span style={{ fontSize: '10px', color: '#92400e', fontWeight: 'bold', display: 'block' }}>Alat / Hari</span>
                        <strong style={{ fontSize: '12px', color: '#78350f', fontFamily: 'monospace' }}>
                          Rp {totalCustomEquipRate.toLocaleString('id-ID')}
                        </strong>
                      </div>
                      <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '6px 8px' }}>
                        <span style={{ fontSize: '10px', color: '#065f46', fontWeight: 'bold', display: 'block' }}>Material / Sat</span>
                        <strong style={{ fontSize: '12px', color: '#047857', fontFamily: 'monospace' }}>
                          Rp {totalCustomMaterialRate.toLocaleString('id-ID')}
                        </strong>
                      </div>
                      <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '6px', padding: '6px 8px' }}>
                        <span style={{ fontSize: '10px', color: '#6b21a8', fontWeight: 'bold', display: 'block' }}>Cons / Sat</span>
                        <strong style={{ fontSize: '12px', color: '#581c87', fontFamily: 'monospace' }}>
                          Rp {totalCustomConsumableRate.toLocaleString('id-ID')}
                        </strong>
                      </div>
                    </div>

                    {/* Container Multi-Resources Tab Switcher */}
                    <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', marginBottom: '14px' }}>
                      {/* Tab Selector Headers */}
                      <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', background: '#f1f5f9' }}>
                        {[
                          { key: 'manpower', label: '1. Kru / Pekerja', count: customManpowerList.length, icon: <HardHat size={13} />, color: '#2563eb' },
                          { key: 'equipment', label: '2. Sewa Alat', count: customEquipmentList.length, icon: <Wrench size={13} />, color: '#d97706' },
                          { key: 'material', label: '3. Material', count: customMaterialList.length, icon: <Layers size={13} />, color: '#059669' },
                          { key: 'consumable', label: '4. Consumables', count: customConsumableList.length, icon: <Package size={13} />, color: '#7c3aed' }
                        ].map(tb => {
                          const isActive = customActiveTab === tb.key;
                          return (
                            <button
                              key={tb.key}
                              type="button"
                              onClick={() => setCustomActiveTab(tb.key as any)}
                              style={{
                                flex: 1,
                                padding: '8px 4px',
                                border: 'none',
                                background: isActive ? '#ffffff' : 'transparent',
                                borderBottom: isActive ? `3px solid ${tb.color}` : '3px solid transparent',
                                color: isActive ? tb.color : '#64748b',
                                fontWeight: isActive ? 'bold' : '600',
                                fontSize: '11px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                              }}
                            >
                              <span>{tb.icon}</span>
                              <span>{tb.label}</span>
                              <span style={{ 
                                background: isActive ? '#eff6ff' : '#e2e8f0', 
                                color: isActive ? tb.color : '#475569', 
                                padding: '1px 5px', 
                                borderRadius: '10px', 
                                fontSize: '10px',
                                fontWeight: 'bold'
                              }}>
                                {tb.count}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Isi Tab Yang Aktif */}
                      <div style={{ padding: '12px' }}>
                        {/* Baris Tombol Aksi */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>
                            {customActiveTab === 'manpower' && `Rincian Tenaga Kerja (${customManpowerList.length} posisi terdaftar)`}
                            {customActiveTab === 'equipment' && `Rincian Peralatan (${customEquipmentList.length} unit alat terdaftar)`}
                            {customActiveTab === 'material' && `Rincian Material Pokok (${customMaterialList.length} item terdaftar)`}
                            {customActiveTab === 'consumable' && `Rincian Bahan Pembantu (${customConsumableList.length} item terdaftar)`}
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenLookupForCustom(customActiveTab)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe',
                                padding: '4px 8px',
                                borderRadius: '5px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              <BookOpen size={12} />
                              ⚡ + Ambil dari Master Data
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddManualCustomItem(customActiveTab)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#f8fafc',
                                color: '#334155',
                                border: '1px solid #cbd5e1',
                                padding: '4px 8px',
                                borderRadius: '5px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              <Plus size={12} />
                              + Tambah Manual
                            </button>
                          </div>
                        </div>

                        {/* Tabel Items Per Tab */}
                        {(() => {
                          const currentItems = 
                            customActiveTab === 'manpower' ? customManpowerList :
                            customActiveTab === 'equipment' ? customEquipmentList :
                            customActiveTab === 'material' ? customMaterialList : customConsumableList;

                          if (currentItems.length === 0) {
                            return (
                              <div style={{ padding: '16px', textAlign: 'center', background: '#fff', border: '1px dashed #cbd5e1', borderRadius: '6px', color: '#64748b', fontSize: '11px' }}>
                                Belum ada rincian {customActiveTab} yang dimasukkan.
                                <div style={{ marginTop: '6px' }}>
                                  Klik tombol <strong>⚡ + Ambil dari Master Data</strong> untuk memilih dari database standar atau <strong>+ Tambah Manual</strong>.
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                <thead style={{ background: '#f1f5f9', position: 'sticky', top: 0, borderBottom: '1px solid #cbd5e1', color: '#475569' }}>
                                  <tr>
                                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>Nama Item / Posisi</th>
                                    <th style={{ padding: '6px 8px', textAlign: 'right', width: '50px' }}>Qty</th>
                                    <th style={{ padding: '6px 8px', textAlign: 'center', width: '45px' }}>Sat</th>
                                    <th style={{ padding: '6px 8px', textAlign: 'right', width: '100px' }}>Tarif (Rp)</th>
                                    <th style={{ padding: '6px 8px', textAlign: 'right', width: '100px' }}>Subtotal</th>
                                    <th style={{ padding: '6px 8px', textAlign: 'center', width: '35px' }}></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {currentItems.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                      <td style={{ padding: '4px 8px' }}>
                                        <input 
                                          type="text"
                                          value={item.name}
                                          onChange={(e) => handleUpdateCustomItem(customActiveTab, item.id, 'name', e.target.value)}
                                          style={{ width: '100%', padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', boxSizing: 'border-box' }}
                                        />
                                      </td>
                                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                                        <input 
                                          type="number"
                                          min="1"
                                          value={item.qty}
                                          onChange={(e) => handleUpdateCustomItem(customActiveTab, item.id, 'qty', parseFloat(e.target.value) || 1)}
                                          style={{ width: '45px', padding: '3px 4px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', textAlign: 'right', boxSizing: 'border-box' }}
                                        />
                                      </td>
                                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                                        <input 
                                          type="text"
                                          value={item.unit}
                                          onChange={(e) => handleUpdateCustomItem(customActiveTab, item.id, 'unit', e.target.value)}
                                          style={{ width: '40px', padding: '3px 2px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', textAlign: 'center', boxSizing: 'border-box' }}
                                        />
                                      </td>
                                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                                        <input 
                                          type="number"
                                          value={item.rate}
                                          onChange={(e) => handleUpdateCustomItem(customActiveTab, item.id, 'rate', parseFloat(e.target.value) || 0)}
                                          style={{ width: '90px', padding: '3px 4px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', textAlign: 'right', boxSizing: 'border-box', fontFamily: 'monospace' }}
                                        />
                                      </td>
                                      <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#0f172a' }}>
                                        Rp {(item.qty * item.rate).toLocaleString('id-ID')}
                                      </td>
                                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteCustomItem(customActiveTab, item.id)}
                                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                                          title="Hapus baris ini"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {sowType === 'manpower' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '8px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>Jumlah Kru (Org)</label>
                      <input 
                        type="number" 
                        min="1"
                        value={customCrewCount}
                        onChange={(e) => setCustomCrewCount(parseFloat(e.target.value) || 1)}
                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>Durasi Kerja (Hari)</label>
                      <input 
                        type="number" 
                        min="1"
                        value={customDurationDays}
                        onChange={(e) => setCustomDurationDays(parseFloat(e.target.value) || 1)}
                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>Upah / Orang / Hari (Rp)</label>
                      <input 
                        type="number" 
                        value={customDailyWage}
                        onChange={(e) => setCustomDailyWage(parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                )}

                {sowType === 'equipment' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '8px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>Jumlah Unit Alat</label>
                      <input 
                        type="number" 
                        min="1"
                        value={customEquipCount}
                        onChange={(e) => setCustomEquipCount(parseFloat(e.target.value) || 1)}
                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>Durasi Sewa (Hari)</label>
                      <input 
                        type="number" 
                        min="1"
                        value={customDurationDays}
                        onChange={(e) => setCustomDurationDays(parseFloat(e.target.value) || 1)}
                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>Sewa / Unit / Hari (Rp)</label>
                      <input 
                        type="number" 
                        value={customEquipRentalRate}
                        onChange={(e) => setCustomEquipRentalRate(parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                )}

                {sowType === 'material' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>Volume Kuantitas</label>
                      <input 
                        type="number" 
                        value={customQty}
                        onChange={(e) => setCustomQty(parseFloat(e.target.value) || 1)}
                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>Harga Satuan Material (Rp)</label>
                      <input 
                        type="number" 
                        value={customMaterialRate}
                        onChange={(e) => setCustomMaterialRate(parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                )}

                {sowType === 'consumable' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>Volume Kuantitas</label>
                      <input 
                        type="number" 
                        value={customQty}
                        onChange={(e) => setCustomQty(parseFloat(e.target.value) || 1)}
                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>Harga Satuan Consumable (Rp)</label>
                      <input 
                        type="number" 
                        value={customConsumableRate}
                        onChange={(e) => setCustomConsumableRate(parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                )}

                {/* Live Preview Estimasi Biaya */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  backgroundColor: '#f8fafc', 
                  padding: '9px 12px', 
                  borderRadius: '6px', 
                  border: '1px solid #cbd5e1', 
                  marginBottom: '14px' 
                }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Estimasi Biaya SOW ini:</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>{previewCost.desc}</div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>
                    Rp {Math.round(previewCost.total).toLocaleString('id-ID')}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleOpenCustomBreakdownModal}
                    style={{
                      padding: '7px 14px',
                      background: '#fffbeb',
                      color: '#b45309',
                      border: '1px solid #fde68a',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title="Buka popup rincian multi-tenaga kerja, alat, material, dan konsumabel"
                  >
                    <Sliders size={14} />
                    🛠️ Rincikan Multi-Resource (Kru + Alat + Bahan)
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsCustomOpen(false)}
                      style={{ padding: '7px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      style={{ padding: '7px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      + Masukkan ke BoQ
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* List Card Preset */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredCatalog.length === 0 ? (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                border: '1px dashed #cbd5e1',
                padding: '36px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '50%', color: '#64748b' }}>
                  <Wrench size={24} />
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>
                  {searchQuery ? `Tidak ada template yang cocok dengan "${searchQuery}"` : `Belum ada template untuk kategori "${selectedCategory}"`}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '420px', lineHeight: 1.5 }}>
                  {searchQuery 
                    ? 'Coba gunakan kata kunci pencarian lain atau buat template treatment baru.'
                    : `Anda dapat membuat treatment baru untuk kategori "${selectedCategory}" dengan mengklik tombol "+ Buat Treatment Kustom Sendiri" di atas. Template yang dibuat akan otomatis tersimpan di sini!`}
                </div>
                {!isCustomOpen && (
                  <button
                    onClick={() => {
                      setIsCustomOpen(true);
                      if (selectedCategory !== 'Semua') {
                        setCustomCategory(selectedCategory);
                      }
                    }}
                    style={{
                      marginTop: '6px',
                      padding: '8px 16px',
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={14} />
                    + Buat Treatment {selectedCategory !== 'Semua' ? selectedCategory : ''} Sekarang
                  </button>
                )}
              </div>
            ) : (
              filteredCatalog.map(template => {
                const active = getEffectiveTemplate(template);
                const isModified = !!customizedTemplates[template.id];
                const isCustomTemplate = !BASE_TREATMENT_CATALOG.some(b => b.id === template.id);
                const catColor = getCategoryColor(active.category);
                const qty = getEffectiveQty(template);
                const duration = active.defaultOutputPerDay > 0 ? qty / active.defaultOutputPerDay : 0;
                const directCost = (duration * active.crewDailyRate) + (duration * active.equipmentDailyRate) + (qty * ((active.materialUnitRate || 0) + active.consumableUnitRate));
                const isAdded = !!addedItemIds[template.id];

                return (
                  <div 
                    key={template.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: isModified ? '1px solid #f59e0b' : '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    {/* Baris Atas: Kategori, Deskripsi & Tombol Edit Turunan */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span 
                            style={{ 
                              fontSize: '11px', 
                              fontWeight: 'bold', 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              backgroundColor: catColor.bg, 
                              color: catColor.text, 
                              border: `1px solid ${catColor.border}`
                            }}
                          >
                            {active.category}
                          </span>
                          {isCustomTemplate && (
                            <span style={{ fontSize: '10px', fontWeight: 'bold', background: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: '4px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              🏷️ Template Kustom
                            </span>
                          )}
                          {isModified && (
                            <span style={{ fontSize: '10px', fontWeight: 'bold', background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                              ✨ Turunan Diedit
                            </span>
                          )}
                        </div>
                        <h4 style={{ margin: '2px 0 4px', fontSize: '13px', fontWeight: 'bold', color: '#0f172a', lineHeight: '1.4' }}>
                          {active.description}
                        </h4>
                        {active.notes && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b' }}>
                            <Info size={12} style={{ flexShrink: 0 }} />
                            <span>{active.notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Tombol Buka Rincian Turunan Resources */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <button
                          onClick={() => handleOpenBreakdownModal(template)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          <Sliders size={13} />
                          Edit Detail Resources ({active.manpowerList.length} Kru, {active.equipmentList.length} Alat, {(active.materialList?.length || 0) + active.consumableList.length} Bahan)
                        </button>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {isModified && (
                            <button
                              onClick={() => handleResetTemplate(template.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#b45309',
                                fontSize: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <RotateCcw size={10} /> Reset ke Default
                            </button>
                          )}
                          {isCustomTemplate && (
                            <button
                              onClick={(e) => handleDeleteCustomTemplate(template.id, e)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                fontSize: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 4px'
                              }}
                              title="Hapus template kustom ini dari katalog"
                            >
                              <Trash2 size={10} /> Hapus Template
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Resource Breakdown Metrics Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11px' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>Output / Hari</span>
                        <strong style={{ color: '#0f172a' }}>{active.defaultOutputPerDay} {active.unit}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>Kru ({active.manpowerList.length} sub-item)</span>
                        <strong style={{ color: '#0f172a' }}>Rp {active.crewDailyRate.toLocaleString('id-ID')}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>Alat ({active.equipmentList.length} sub-item)</span>
                        <strong style={{ color: '#0f172a' }}>Rp {active.equipmentDailyRate.toLocaleString('id-ID')}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>
                          Bahan ({(active.materialList?.length || 0) + active.consumableList.length} sub-item)
                        </span>
                        <strong style={{ color: '#0f172a' }}>Rp {((active.materialUnitRate || 0) + active.consumableUnitRate).toLocaleString('id-ID')}</strong>
                      </div>
                    </div>

                    {/* Baris Bawah: Atur Volume & Tombol Panggil */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                      {/* Qty Input & Direct Cost Preview */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>Qty:</span>
                          <input 
                            type="number"
                            value={qty}
                            onChange={(e) => handleQtyChange(template.id, parseFloat(e.target.value) || 0)}
                            style={{
                              width: '70px',
                              padding: '4px 6px',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              fontWeight: 'bold',
                              textAlign: 'right'
                            }}
                          />
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{active.unit}</span>
                        </div>

                        <div style={{ fontSize: '11px', color: '#475569', borderLeft: '1px solid #cbd5e1', paddingLeft: '8px' }}>
                          Durasi: <strong style={{ color: '#0f172a' }}>{duration.toFixed(2)} hr</strong> | Estimasi: <strong style={{ color: '#059669', fontFamily: 'monospace' }}>Rp {Math.round(directCost).toLocaleString('id-ID')}</strong>
                        </div>
                      </div>

                      {/* Tombol Panggil */}
                      <button
                        onClick={() => handleSelectTemplate(template)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          background: isAdded ? '#059669' : '#0f172a',
                          color: isAdded ? '#ffffff' : '#fbbf24',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}
                      >
                        {isAdded ? (
                          <>
                            <Check size={14} />
                            Ditambahkan!
                          </>
                        ) : (
                          <>
                            <Plus size={14} />
                            Panggil Treatment
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 4. Footer Drawer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Saat ini terpasang: <strong style={{ color: '#0f172a' }}>{boqItem.treatments.length} Treatment</strong> pada item ini
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Selesai & Tutup
          </button>
        </div>

      </div>

      {/* Modal Detail Breakdown Resources (Edit Turunan Kru, Alat & Consumables) */}
      {isResourceModalOpen && editingTemplateForModal && (
        <ResourceBreakdownModal
          key={editingTemplateForModal.id}
          isOpen={isResourceModalOpen}
          treatment={editingTemplateForModal}
          boqQty={boqItem.qty}
          boqUnit={boqItem.unit}
          onClose={() => {
            setIsResourceModalOpen(false);
            setEditingTemplateForModal(null);
          }}
          onSave={handleSaveBreakdownFromModal}
        />
      )}

      {/* Modal Lookup Master Data untuk Form Custom */}
      {isCustomLookupOpen && (
        <ResourceLookupModal
          isOpen={isCustomLookupOpen}
          type={customLookupType}
          onClose={() => setIsCustomLookupOpen(false)}
          onSelectManpower={handleSelectCustomLookupManpower}
          onSelectEquipment={handleSelectCustomLookupEquipment}
          onSelectMaterial={handleSelectCustomLookupMaterial}
          onSelectConsumable={handleSelectCustomLookupConsumable}
        />
      )}
    </div>
  );
};

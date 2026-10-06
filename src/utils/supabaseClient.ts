import { createClient } from '@supabase/supabase-js';
import type { TenderProject } from '../App';
import type { BaseTreatmentTemplate } from '../data/treatmentCatalog';
import type { UserAccount } from '../components/UserManagementModal';

export const SUPABASE_URL = 
  (import.meta as any).env?.VITE_SUPABASE_URL || 
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL || 
  'https://wvzajdnxmjegblqrvgfs.supabase.co';

export const SUPABASE_ANON_KEY = 
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  'sb_publishable_BsYvIC-QEgxEfE2UP1siZg_85Rx0XYP';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 1. TENDER PROJECTS CLOUD SYNC
// ==========================================

export async function fetchTendersFromCloud(): Promise<TenderProject[] | null> {
  try {
    const { data, error } = await supabase
      .from('tender_projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Gagal membaca data dari Supabase (mungkin tabel belum dibuat):', error.message);
      return null;
    }

    if (!data || data.length === 0) return [];

    return data.map((row: any): TenderProject => ({
      id: row.id,
      tenderNo: row.tender_no || row.id,
      title: row.title || '',
      client: row.client || '',
      author: row.author || 'CRV',
      createdAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      overheadItems: row.overhead_settings?.overheadItems || [],
      commercialConfig: row.overhead_settings?.commercialConfig,
      boqList: Array.isArray(row.boq_list) ? row.boq_list : []
    }));
  } catch (err) {
    console.error('Error saat fetch tenders dari cloud:', err);
    return null;
  }
}

export async function saveTenderToCloud(tender: TenderProject): Promise<boolean> {
  try {
    const payload = {
      id: tender.id,
      tender_no: tender.tenderNo || tender.id || `TDR-${Date.now()}`,
      title: tender.title,
      client: tender.client || '',
      contract_type: 'Lump Sum',
      currency: 'IDR',
      exchange_rate: 16000,
      location: '',
      author: tender.author || 'CRV',
      overhead_settings: {
        overheadItems: tender.overheadItems || [],
        commercialConfig: tender.commercialConfig || null
      },
      boq_list: tender.boqList || [],
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('tender_projects')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Gagal menyimpan tender ke cloud:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error simpan tender ke cloud:', err);
    return false;
  }
}

export async function deleteTenderFromCloud(tenderId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tender_projects')
      .delete()
      .eq('id', tenderId);

    if (error) {
      console.error('Gagal hapus tender dari cloud:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error hapus tender dari cloud:', err);
    return false;
  }
}

// ==========================================
// 2. CUSTOM TREATMENT TEMPLATES CLOUD SYNC
// ==========================================

export async function fetchCustomTemplatesFromCloud(): Promise<BaseTreatmentTemplate[] | null> {
  try {
    const { data, error } = await supabase
      .from('tender_custom_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Gagal membaca custom templates dari cloud:', error.message);
      return null;
    }

    if (!data || data.length === 0) return [];

    return data.map((row: any): BaseTreatmentTemplate => ({
      id: row.id,
      category: row.category,
      description: row.description,
      unit: row.unit || 'Lot',
      defaultOutputPerDay: Number(row.default_output_per_day) || 1,
      crewDailyRate: Number(row.crew_daily_rate) || 0,
      equipmentDailyRate: Number(row.equipment_daily_rate) || 0,
      materialUnitRate: Number(row.material_unit_rate) || 0,
      consumableUnitRate: Number(row.consumable_unit_rate) || 0,
      notes: row.notes || '',
      manpowerList: row.manpower_list || [],
      equipmentList: row.equipment_list || [],
      materialList: row.material_list || [],
      consumableList: row.consumable_list || []
    }));
  } catch (err) {
    console.error('Error fetch custom templates:', err);
    return null;
  }
}

export async function saveCustomTemplateToCloud(tpl: BaseTreatmentTemplate): Promise<boolean> {
  try {
    const payload = {
      id: tpl.id,
      category: tpl.category,
      description: tpl.description,
      unit: tpl.unit || 'Lot',
      default_output_per_day: tpl.defaultOutputPerDay || 1,
      crew_daily_rate: tpl.crewDailyRate || 0,
      equipment_daily_rate: tpl.equipmentDailyRate || 0,
      material_unit_rate: tpl.materialUnitRate || 0,
      consumable_unit_rate: tpl.consumableUnitRate || 0,
      notes: tpl.notes || '',
      manpower_list: tpl.manpowerList || [],
      equipment_list: tpl.equipmentList || [],
      material_list: tpl.materialList || [],
      consumable_list: tpl.consumableList || [],
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('tender_custom_templates')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Gagal menyimpan custom template ke cloud:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error simpan custom template ke cloud:', err);
    return false;
  }
}

export async function deleteCustomTemplateFromCloud(tplId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tender_custom_templates')
      .delete()
      .eq('id', tplId);

    if (error) {
      console.error('Gagal hapus custom template dari cloud:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error hapus custom template dari cloud:', err);
    return false;
  }
}

// ==========================================
// 3. USERS CLOUD SYNC
// ==========================================

export async function fetchUsersFromCloud(): Promise<UserAccount[] | null> {
  try {
    const { data, error } = await supabase
      .from('tender_users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Gagal membaca users dari cloud:', error.message);
      return null;
    }

    if (!data || data.length === 0) return [];

    return data.map((row: any): UserAccount => ({
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      email: row.email || '',
      password: row.password,
      authorRole: row.author_role || 'Estimator',
      isActive: row.is_active ?? true,
      createdAt: row.created_at ? row.created_at.split('T')[0] : '2026-10-05',
      lastLogin: row.last_login
    }));
  } catch (err) {
    console.error('Error fetch users dari cloud:', err);
    return null;
  }
}

export async function saveUserToCloud(user: UserAccount): Promise<boolean> {
  try {
    const payload = {
      id: user.id,
      username: user.username,
      full_name: user.fullName,
      email: user.email || '',
      password: user.password,
      author_role: user.authorRole,
      is_active: user.isActive,
      last_login: user.lastLogin
    };

    const { error } = await supabase
      .from('tender_users')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Gagal simpan user ke cloud:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error simpan user ke cloud:', err);
    return false;
  }
}

export async function deleteUserFromCloud(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tender_users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Gagal hapus user dari cloud:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error hapus user dari cloud:', err);
    return false;
  }
}

// ==========================================
// 4. MASTER RESOURCES CLOUD SYNC
// ==========================================

export async function fetchMasterResourcesFromCloud(
  type?: 'manpower' | 'equipment' | 'material' | 'consumable'
): Promise<any[] | null> {
  try {
    let query = supabase.from('tender_master_resources').select('*');
    if (type) {
      query = query.eq('resource_type', type);
    }
    const { data, error } = await query.order('category', { ascending: true });

    if (error) {
      console.warn('Gagal fetch master resources dari cloud:', error.message);
      return null;
    }

    if (!data || data.length === 0) return [];

    return data.map((row: any) => {
      if (row.resource_type === 'manpower') {
        return {
          id: row.id,
          role: row.name,
          category: row.category,
          unit: row.unit || 'org',
          basicSalary: Number(row.details?.basicSalary) || 0,
          ppeDaily: Number(row.details?.ppeDaily) || 0,
          jamsostekDaily: Number(row.details?.jamsostekDaily) || 0,
          mealsDaily: Number(row.details?.mealsDaily) || 0,
          otherAllowanceDaily: Number(row.details?.otherAllowanceDaily) || 0,
          totalRate: Number(row.rate) || 0,
          notes: row.notes || ''
        };
      } else if (row.resource_type === 'equipment') {
        return {
          id: row.id,
          name: row.name,
          category: row.category,
          unit: row.unit || 'unit',
          baseRentalRate: Number(row.details?.baseRentalRate) || 0,
          fuelType: row.details?.fuelType || 'Solar',
          fuelLitersPerDay: Number(row.details?.fuelLitersPerDay) || 0,
          fuelPricePerLiter: Number(row.details?.fuelPricePerLiter) || 0,
          bbmRate: Number(row.details?.bbmRate) || 0,
          maintenanceRate: Number(row.details?.maintenanceRate) || 0,
          mobilizationDaily: Number(row.details?.mobilizationDaily) || 0,
          totalRate: Number(row.rate) || 0,
          notes: row.notes || ''
        };
      } else {
        // material / consumable
        return {
          id: row.id,
          name: row.name,
          category: row.category,
          unit: row.unit || 'Unit',
          unitRate: Number(row.rate) || 0,
          notes: row.notes || ''
        };
      }
    });
  } catch (err) {
    console.error('Error fetch master resources:', err);
    return null;
  }
}

export async function saveMasterResourceToCloud(
  type: 'manpower' | 'equipment' | 'material' | 'consumable',
  item: any
): Promise<boolean> {
  try {
    const payload: any = {
      id: item.id,
      resource_type: type,
      category: item.category || 'General',
      name: item.role || item.name || '',
      unit: item.unit || (type === 'manpower' ? 'org' : type === 'equipment' ? 'unit' : 'Unit'),
      rate: Number(item.totalRate ?? item.unitRate) || 0,
      notes: item.notes || '',
      updated_at: new Date().toISOString()
    };

    if (type === 'manpower') {
      payload.details = {
        basicSalary: item.basicSalary || 0,
        ppeDaily: item.ppeDaily || 0,
        jamsostekDaily: item.jamsostekDaily || 0,
        mealsDaily: item.mealsDaily || 0,
        otherAllowanceDaily: item.otherAllowanceDaily || 0
      };
    } else if (type === 'equipment') {
      payload.details = {
        baseRentalRate: item.baseRentalRate || 0,
        fuelType: item.fuelType || 'Solar',
        fuelLitersPerDay: item.fuelLitersPerDay || 0,
        fuelPricePerLiter: item.fuelPricePerLiter || 0,
        bbmRate: item.bbmRate || 0,
        maintenanceRate: item.maintenanceRate || 0,
        mobilizationDaily: item.mobilizationDaily || 0
      };
    } else {
      payload.details = {};
    }

    const { error } = await supabase
      .from('tender_master_resources')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Gagal simpan master resource ke cloud:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error simpan master resource:', err);
    return false;
  }
}

export async function batchSaveMasterResourcesToCloud(
  type: 'manpower' | 'equipment' | 'material' | 'consumable',
  items: any[]
): Promise<boolean> {
  try {
    const payloads = items.map(item => {
      const payload: any = {
        id: item.id,
        resource_type: type,
        category: item.category || 'General',
        name: item.role || item.name || '',
        unit: item.unit || (type === 'manpower' ? 'org' : type === 'equipment' ? 'unit' : 'Unit'),
        rate: Number(item.totalRate ?? item.unitRate) || 0,
        notes: item.notes || '',
        updated_at: new Date().toISOString()
      };
      if (type === 'manpower') {
        payload.details = {
          basicSalary: item.basicSalary || 0,
          ppeDaily: item.ppeDaily || 0,
          jamsostekDaily: item.jamsostekDaily || 0,
          mealsDaily: item.mealsDaily || 0,
          otherAllowanceDaily: item.otherAllowanceDaily || 0
        };
      } else if (type === 'equipment') {
        payload.details = {
          baseRentalRate: item.baseRentalRate || 0,
          fuelType: item.fuelType || 'Solar',
          fuelLitersPerDay: item.fuelLitersPerDay || 0,
          fuelPricePerLiter: item.fuelPricePerLiter || 0,
          bbmRate: item.bbmRate || 0,
          maintenanceRate: item.maintenanceRate || 0,
          mobilizationDaily: item.mobilizationDaily || 0
        };
      } else {
        payload.details = {};
      }
      return payload;
    });

    const { error } = await supabase
      .from('tender_master_resources')
      .upsert(payloads, { onConflict: 'id' });

    if (error) {
      console.warn('Gagal batch simpan master resources ke cloud:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error batch simpan master resources:', err);
    return false;
  }
}

export async function deleteMasterResourceFromCloud(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tender_master_resources')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Gagal hapus master resource dari cloud:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error hapus master resource:', err);
    return false;
  }
}



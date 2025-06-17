export interface RegistryFormData {
  name: string;
  nic: string;
  address: string;
  phone: string;
  department_id: string;
  division_id: string;
  purpose_of_visit: string;
  remarks: string;
  public_id: string;
}

export interface PublicRegistryEntry {
  id: number;
  registry_id: string;
  public_user_id?: number;
  visitor_name: string;
  visitor_nic: string;
  visitor_address?: string;
  visitor_phone?: string;
  department_id: number;
  division_id?: number;
  purpose_of_visit: string;
  remarks?: string;
  entry_time: string;
  visitor_type: 'new' | 'existing';
  status: 'active' | 'checked_out' | 'deleted';
  department_name?: string;
  division_name?: string;
  updated_at?: string;
}
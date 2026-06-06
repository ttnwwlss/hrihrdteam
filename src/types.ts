export interface Member {
  id: string;
  name: string;
  position: string;
  sort_order: number;
  is_active: boolean;
}

export interface Project {
  id: string;
  project_name: string;
  client_name: string;
  target_audience: string;
  project_type: string;
  start_month: string; // "YYYY-MM"
  end_month: string;   // "YYYY-MM"
  location_type: string;
  business_manager_id: string | null;
  pm_manager_id: string | null;
  pl_manager_id: string | null;
  status: '준비중' | '운영중' | '완료' | '보류' | '취소';
  notes: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Round {
  id: string;
  project_id: string;
  round_no: number;
  round_name: string;
  start_date: string; // "YYYY-MM-DD"
  end_date: string;   // "YYYY-MM-DD"
  date_label: string; // e.g. "6.12 - 6.14"
  status: '준비중' | '운영중' | '완료' | '보류' | '취소';
  location_type: string;
  venue_detail: string;
  support_manager_ids: string[]; // member IDs
  field_manager_ids: string[];   // member IDs
  round_memo: string;
  remarks: string;
  operation_hours: number;
  participant_count: number;
  satisfaction: number | null;
  instructor_satisfaction: number | null;
  operation_satisfaction: number | null;
  satisfaction_updated_at?: string;
  completed_at?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ChecklistItem {
  id: string;
  project_id: string | null;
  round_id: string | null;
  title: string;
  is_done: boolean;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SharePost {
  id: string;
  author_id: string; // member ID
  content: string;
  tags: string[]; // parsed hashtags e.g. ["#매뉴얼", "#강의실"]
  links?: string[]; // links extracted from content or inputted
  created_at: string;
  is_active: boolean;
}

import { Member, Project, Round, ChecklistItem, SharePost } from '../types';
import { supabase } from '../lib/supabaseClient';

// Helper to throw a standardized database connection/configuration error
const ensureSupabase = () => {
  if (!supabase) {
    throw new Error(
      'Supabase 클라이언트가 초기화되지 않았습니다. VITE_SUPABASE_URL 및 VITE_SUPABASE_ANON_KEY 환경변수가 올바르게 설정되었는지 확인해 주세요.'
    );
  }
};

export const dbService = {
  // === MEMBERS ===
  async getMembers(): Promise<Member[]> {
    ensureSupabase();
    const { data, error } = await supabase!
      .from('members')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error('Supabase members fetch failed:', error);
      throw error;
    }
    return data as Member[];
  },

  async saveMember(member: Member): Promise<Member> {
    ensureSupabase();
    const { data, error } = await supabase!
      .from('members')
      .upsert(member)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase member save failed:', error);
      throw error;
    }
    return data as Member;
  },

  async deleteMember(id: string): Promise<boolean> {
    ensureSupabase();
    const { error } = await supabase!
      .from('members')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase member delete failed:', error);
      throw error;
    }
    return true;
  },

  // === PROJECTS ===
  async getProjects(): Promise<Project[]> {
    ensureSupabase();
    const { data, error } = await supabase!
      .from('projects')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error('Supabase projects fetch failed:', error);
      throw error;
    }
    return data as Project[];
  },

  async saveProject(project: Project): Promise<Project> {
    ensureSupabase();
    const updatedProject = {
      ...project,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase!
      .from('projects')
      .upsert(updatedProject)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase project save failed:', error);
      throw error;
    }
    return data as Project;
  },

  async deleteProject(id: string): Promise<boolean> {
    ensureSupabase();
    const { error } = await supabase!
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase project delete failed:', error);
      throw error;
    }
    return true;
  },

  // === ROUNDS ===
  async getRounds(): Promise<Round[]> {
    ensureSupabase();
    const { data, error } = await supabase!
      .from('rounds')
      .select('*')
      .order('round_no', { ascending: true });
    
    if (error) {
      console.error('Supabase rounds fetch failed:', error);
      throw error;
    }
    return data as Round[];
  },

  async saveRound(round: Round): Promise<Round> {
    ensureSupabase();
    const updatedRound = {
      ...round,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase!
      .from('rounds')
      .upsert(updatedRound)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase round save failed:', error);
      throw error;
    }
    return data as Round;
  },

  async deleteRound(id: string): Promise<boolean> {
    ensureSupabase();
    const { error } = await supabase!
      .from('rounds')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase round delete failed:', error);
      throw error;
    }
    return true;
  },

  // === CHECKLIST ===
  async getChecklists(): Promise<ChecklistItem[]> {
    ensureSupabase();
    const { data, error } = await supabase!
      .from('checklists')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error('Supabase checklists fetch failed:', error);
      throw error;
    }
    return data as ChecklistItem[];
  },

  async saveChecklist(item: ChecklistItem): Promise<ChecklistItem> {
    ensureSupabase();
    const updatedItem = {
      ...item,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase!
      .from('checklists')
      .upsert(updatedItem)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase checklist save failed:', error);
      throw error;
    }
    return data as ChecklistItem;
  },

  async deleteChecklist(id: string): Promise<boolean> {
    ensureSupabase();
    const { error } = await supabase!
      .from('checklists')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase checklist delete failed:', error);
      throw error;
    }
    return true;
  },

  // === SHARE BOARD ===
  async getSharePosts(): Promise<SharePost[]> {
    ensureSupabase();
    const { data, error } = await supabase!
      .from('share_posts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase share_posts fetch failed:', error);
      throw error;
    }
    return data as SharePost[];
  },

  async saveSharePost(post: SharePost): Promise<SharePost> {
    ensureSupabase();
    const { data, error } = await supabase!
      .from('share_posts')
      .upsert(post)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase share_post save failed:', error);
      throw error;
    }
    return data as SharePost;
  },

  async deleteSharePost(id: string): Promise<boolean> {
    ensureSupabase();
    // Soft delete to keep consistent with is_active check
    const { error } = await supabase!
      .from('share_posts')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) {
      console.error('Supabase share_post delete failed:', error);
      throw error;
    }
    return true;
  },

  // Reload action
  async reloadAllData(): Promise<{
    members: Member[];
    projects: Project[];
    rounds: Round[];
    checklists: ChecklistItem[];
    sharePosts: SharePost[];
  }> {
    const [members, projects, rounds, checklists, sharePosts] = await Promise.all([
      this.getMembers(),
      this.getProjects(),
      this.getRounds(),
      this.getChecklists(),
      this.getSharePosts()
    ]);
    return { members, projects, rounds, checklists, sharePosts };
  }
};

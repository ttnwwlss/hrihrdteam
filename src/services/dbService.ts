import { Member, Project, Round, ChecklistItem, SharePost } from '../types';
import { supabase } from '../lib/supabaseClient';

// --- MOCK / SEED DATA ---
const INITIAL_MEMBERS: Member[] = [
  { id: 'm1', name: '김도원', position: '팀장', sort_order: 1, is_active: true },
  { id: 'm2', name: '이준우', position: 'PM', sort_order: 2, is_active: true },
  { id: 'm3', name: '최은서', position: 'PL', sort_order: 3, is_active: true },
  { id: 'm4', name: '박서현', position: '선임연구원', sort_order: 4, is_active: true },
  { id: 'm5', name: '정민우', position: '연구원', sort_order: 5, is_active: true }
];

const INITIAL_PROJECTS: Project[] = [];
const INITIAL_ROUNDS: Round[] = [];
const INITIAL_CHECKLISTS: ChecklistItem[] = [];
const INITIAL_SHARE_POSTS: SharePost[] = [];

// Helper to check if Supabase is available and ready
const isSupabaseWorking = async (): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('members').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};

// Initialize LocalStorage Data (Force reset and clean up operational mock datasets)
const initLocalStorage = () => {
  if (!localStorage.getItem('hrd_members')) {
    localStorage.setItem('hrd_members', JSON.stringify(INITIAL_MEMBERS));
  }
  // Clear operational tables completely to avoid user confusion
  localStorage.setItem('hrd_projects', JSON.stringify([]));
  localStorage.setItem('hrd_rounds', JSON.stringify([]));
  localStorage.setItem('hrd_checklists', JSON.stringify([]));
  localStorage.setItem('hrd_share_posts', JSON.stringify([]));
};

// Auto run initialization
initLocalStorage();

export const dbService = {
  // === MEMBERS ===
  async getMembers(): Promise<Member[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('sort_order', { ascending: true });
        if (!error && data) return data as Member[];
      } catch (e) {
        console.warn('Supabase members fetch failed, falling back to LocalStorage', e);
      }
    }
    const local = localStorage.getItem('hrd_members');
    return local ? JSON.parse(local) : INITIAL_MEMBERS;
  },

  async saveMember(member: Member): Promise<Member> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('members')
          .upsert(member)
          .select()
          .single();
        if (!error && data) return data as Member;
      } catch (e) {
        console.warn('Supabase member save failed, saving to LocalStorage', e);
      }
    }
    const local = localStorage.getItem('hrd_members');
    let list: Member[] = local ? JSON.parse(local) : INITIAL_MEMBERS;
    const index = list.findIndex(m => m.id === member.id);
    if (index >= 0) {
      list[index] = member;
    } else {
      list.push(member);
    }
    localStorage.setItem('hrd_members', JSON.stringify(list));
    return member;
  },

  async deleteMember(id: string): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase.from('members').delete().eq('id', id);
        if (!error) return true;
      } catch (e) {
        console.warn('Supabase member delete failed, falling back to LocalStorage', e);
      }
    }
    const local = localStorage.getItem('hrd_members');
    if (local) {
      let list: Member[] = JSON.parse(local);
      list = list.filter(m => m.id !== id);
      localStorage.setItem('hrd_members', JSON.stringify(list));
      return true;
    }
    return false;
  },

  // === PROJECTS ===
  async getProjects(): Promise<Project[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('sort_order', { ascending: true });
        if (!error && data) return data as Project[];
      } catch (e) {
        console.warn('Supabase projects fetch failed, falling back to LocalStorage', e);
      }
    }
    const local = localStorage.getItem('hrd_projects');
    return local ? JSON.parse(local) : INITIAL_PROJECTS;
  },

  async saveProject(project: Project): Promise<Project> {
    const updatedProject = {
      ...project,
      updated_at: new Date().toISOString()
    };
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .upsert(updatedProject)
          .select()
          .single();
        if (!error && data) return data as Project;
      } catch (e) {
        console.warn('Supabase project save failed, saving to LocalStorage', e);
      }
    }
    const local = localStorage.getItem('hrd_projects');
    let list: Project[] = local ? JSON.parse(local) : INITIAL_PROJECTS;
    const index = list.findIndex(p => p.id === project.id);
    if (index >= 0) {
      list[index] = updatedProject;
    } else {
      list.push(updatedProject);
    }
    localStorage.setItem('hrd_projects', JSON.stringify(list));
    return updatedProject;
  },

  async deleteProject(id: string): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (!error) return true;
      } catch (e) {
        console.warn('Supabase project delete failed, falling back to LocalStorage', e);
      }
    }
    const local = localStorage.getItem('hrd_projects');
    if (local) {
      let list: Project[] = JSON.parse(local);
      list = list.filter(p => p.id !== id);
      localStorage.setItem('hrd_projects', JSON.stringify(list));
      return true;
    }
    return false;
  },

  // === ROUNDS ===
  async getRounds(): Promise<Round[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('rounds')
          .select('*')
          .order('round_no', { ascending: true });
        if (!error && data) return data as Round[];
      } catch (e) {
        console.warn('Supabase rounds fetch failed, falling back to LocalStorage', e);
      }
    }
    const local = localStorage.getItem('hrd_rounds');
    return local ? JSON.parse(local) : INITIAL_ROUNDS;
  },

  async saveRound(round: Round): Promise<Round> {
    const updatedRound = {
      ...round,
      updated_at: new Date().toISOString()
    };
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('rounds')
          .upsert(updatedRound)
          .select()
          .single();
        if (!error && data) return data as Round;
      } catch (e) {
        console.warn('Supabase round save failed, saving to LocalStorage', e);
      }
    }
    const local = localStorage.getItem('hrd_rounds');
    let list: Round[] = local ? JSON.parse(local) : INITIAL_ROUNDS;
    const index = list.findIndex(r => r.id === round.id);
    if (index >= 0) {
      list[index] = updatedRound;
    } else {
      list.push(updatedRound);
    }
    localStorage.setItem('hrd_rounds', JSON.stringify(list));
    return updatedRound;
  },

  async deleteRound(id: string): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase.from('rounds').delete().eq('id', id);
        if (!error) return true;
      } catch (e) {
        console.warn('Supabase round delete failed, falling back to LocalStorage', e);
      }
    }
    const local = localStorage.getItem('hrd_rounds');
    if (local) {
      let list: Round[] = JSON.parse(local);
      list = list.filter(r => r.id !== id);
      localStorage.setItem('hrd_rounds', JSON.stringify(list));
      return true;
    }
    return false;
  },

  // === CHECKLIST ===
  async getChecklists(): Promise<ChecklistItem[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('checklists')
          .select('*')
          .order('sort_order', { ascending: true });
        if (!error && data) return data as ChecklistItem[];
      } catch (e) {
        console.warn('Supabase checklists fetch failed, falling back to LocalStorage', e);
      }
    }
    const local = localStorage.getItem('hrd_checklists');
    return local ? JSON.parse(local) : INITIAL_CHECKLISTS;
  },

  async saveChecklist(item: ChecklistItem): Promise<ChecklistItem> {
    const updatedItem = {
      ...item,
      updated_at: new Date().toISOString()
    };
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('checklists')
          .upsert(updatedItem)
          .select()
          .single();
        if (!error && data) return data as ChecklistItem;
      } catch (e) {
        console.warn('Supabase checklist save failed, saving to LocalStorage', e);
      }
    }
    const local = localStorage.getItem('hrd_checklists');
    let list: ChecklistItem[] = local ? JSON.parse(local) : INITIAL_CHECKLISTS;
    const index = list.findIndex(c => c.id === item.id);
    if (index >= 0) {
      list[index] = updatedItem;
    } else {
      list.push(updatedItem);
    }
    localStorage.setItem('hrd_checklists', JSON.stringify(list));
    return updatedItem;
  },

  async deleteChecklist(id: string): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase.from('checklists').delete().eq('id', id);
        if (!error) return true;
      } catch (e) {
        console.warn('Supabase checklist delete failed, falling back to LocalStorage', e);
      }
    }
    const local = localStorage.getItem('hrd_checklists');
    if (local) {
      let list: ChecklistItem[] = JSON.parse(local);
      list = list.filter(c => c.id !== id);
      localStorage.setItem('hrd_checklists', JSON.stringify(list));
      return true;
    }
    return false;
  },

  // === SHARE BOARD ===
  async getSharePosts(): Promise<SharePost[]> {
    const local = localStorage.getItem('hrd_share_posts');
    const posts: SharePost[] = local ? JSON.parse(local) : INITIAL_SHARE_POSTS;
    return posts.filter(p => p.is_active).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async saveSharePost(post: SharePost): Promise<SharePost> {
    const local = localStorage.getItem('hrd_share_posts');
    let list: SharePost[] = local ? JSON.parse(local) : INITIAL_SHARE_POSTS;
    const index = list.findIndex(p => p.id === post.id);
    if (index >= 0) {
      list[index] = post;
    } else {
      list.push(post);
    }
    localStorage.setItem('hrd_share_posts', JSON.stringify(list));
    return post;
  },

  async deleteSharePost(id: string): Promise<boolean> {
    const local = localStorage.getItem('hrd_share_posts');
    if (local) {
      let list: SharePost[] = JSON.parse(local);
      const index = list.findIndex(p => p.id === id);
      if (index >= 0) {
        list[index].is_active = false;
        localStorage.setItem('hrd_share_posts', JSON.stringify(list));
        return true;
      }
    }
    return false;
  },

  // Reload action
  async reloadAllData(): Promise<{
    members: Member[];
    projects: Project[];
    rounds: Round[];
    checklists: ChecklistItem[];
    sharePosts: SharePost[];
  }> {
    const members = await this.getMembers();
    const projects = await this.getProjects();
    const rounds = await this.getRounds();
    const checklists = await this.getChecklists();
    const sharePosts = await this.getSharePosts();
    return { members, projects, rounds, checklists, sharePosts };
  }
};

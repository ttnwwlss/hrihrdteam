import React, { useState, useEffect } from 'react';
import { Project, Round, Member, ChecklistItem, SharePost } from './types';
import ShareBoard from './components/ShareBoard/ShareBoard';
import { dbService } from './services/dbService';
import { getYearsFromData } from './utils/dateUtils';
import { calculateProjectStatus } from './utils/statusUtils';

// Subcomponents
import SummaryCards from './components/Dashboard/SummaryCards';
import Timeline from './components/Timeline/Timeline';
import KanbanBoard from './components/KanbanBoard/KanbanBoard';
import ManagerWorkload from './components/ManagerWorkload/ManagerWorkload';
import ChecklistTab from './components/ChecklistTab/ChecklistTab';

// Modals
import ProjectModal from './components/ProjectModal/ProjectModal';
import RoundModal from './components/RoundModal/RoundModal';
import SatisfactionModal from './components/SatisfactionModal/SatisfactionModal';
import ChecklistModal from './components/ChecklistModal/ChecklistModal';
import MemberModal from './components/Common/MemberModal';

// Icons
import { 
  Users, 
  Calendar, 
  Layers, 
  Search, 
  RefreshCw, 
  Download, 
  Plus, 
  Info, 
  Sparkles,
  Eye,
  Settings,
  Flame,
  CheckCircle,
  Smartphone,
  CheckSquare,
  Menu,
  X,
  MessageSquare
} from 'lucide-react';

export default function App() {
  // Core datasets
  const [projects, setProjects] = useState<Project[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [sharePosts, setSharePosts] = useState<SharePost[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState(''); // dropdown selections
  const [isMyWorkOnly, setIsMyWorkOnly] = useState(false); // "내 업무만 보기" state trigger
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLocationType, setSelectedLocationType] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedClient, setSelectedClient] = useState('');

  // Tab State
  const [currentTab, setCurrentTab] = useState<'timeline' | 'kanban' | 'manager'>('timeline');
  const [currentMenu, setCurrentMenu] = useState<'dashboard' | 'prepop' | 'share'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Screen layout state (PC vs Mobile)
  const [isMobile, setIsMobile] = useState(false);

  // Modals visibility toggles
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);

  const [isRoundModalOpen, setIsRoundModalOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<Round | undefined>(undefined);
  const [roundModalParentProject, setRoundModalParentProject] = useState<Project | undefined>(undefined);

  const [isSatisfactionModalOpen, setIsSatisfactionModalOpen] = useState(false);
  const [satisfactionTargetRound, setSatisfactionTargetRound] = useState<Round | undefined>(undefined);

  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [checklistTargetProject, setChecklistTargetProject] = useState<Project | undefined>(undefined);
  const [checklistTargetRound, setChecklistTargetRound] = useState<Round | undefined>(undefined);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  // Success alert prompt state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Handle mobile detection on mount
  useEffect(() => {
    const checkMobileWidth = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobileWidth();
    window.addEventListener('resize', checkMobileWidth);
    return () => window.removeEventListener('resize', checkMobileWidth);
  }, []);

  // Reload action
  const loadAllData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await dbService.reloadAllData();
      
      // Auto transition: '준비중' -> '운영중' if start_date has arrived or passed (KST 서울 시간 기준)
      const kstOffset = 9 * 60 * 60 * 1000;
      const todayStr = new Date(Date.now() + kstOffset).toISOString().slice(0, 10);
      let hasTransitions = false;
      const updatedRoundsList = [...data.rounds];
      
      for (const r of data.rounds) {
        if (r.is_active && r.status === '준비중' && r.start_date && r.start_date <= todayStr) {
          const updatedRound: Round = { ...r, status: '운영중' };
          await dbService.saveRound(updatedRound);
          hasTransitions = true;
          
          // Sync parent project status immediately (Only if parent project is not manually set to Canceled or Hold)
          const siblingRounds = updatedRoundsList.filter(item => item.project_id === r.project_id && item.id !== r.id);
          const combinedRounds = [...siblingRounds, updatedRound];
          const parentProj = data.projects.find(item => item.id === r.project_id);
          if (parentProj && parentProj.status !== '취소' && parentProj.status !== '보류') {
            const calculatedStatus = calculateProjectStatus(combinedRounds);
            if (parentProj.status !== calculatedStatus && calculatedStatus !== '보류') {
              const updatedProj = { ...parentProj, status: calculatedStatus };
              await dbService.saveProject(updatedProj);
            }
          }
        }
      }
      
      if (hasTransitions) {
        const freshData = await dbService.reloadAllData();
        setProjects(freshData.projects);
        setRounds(freshData.rounds);
        setMembers(freshData.members);
        setChecklistItems(freshData.checklists);
        setSharePosts(freshData.sharePosts || []);
        triggerToast('📅 시작일이 도래한 준비중 차수가 자동으로 "운영중"으로 전환되었습니다.');
      } else {
        setProjects(data.projects);
        setRounds(data.rounds);
        setMembers(data.members);
        setChecklistItems(data.checklists);
        setSharePosts(data.sharePosts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Run on mount
  useEffect(() => {
    loadAllData();
    // Retrieve cached year selection if any
    const cachedYear = localStorage.getItem('hrd_selected_year');
    if (cachedYear) {
      const yrNum = parseInt(cachedYear, 10);
      if (!isNaN(yrNum)) setSelectedYear(yrNum);
    }
  }, []);

  // Sync cache with selectedYear
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    localStorage.setItem('hrd_selected_year', String(year));
  };

  // Toast handler
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Reset all search and dropdown filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedManagerId('');
    setIsMyWorkOnly(false);
    setSelectedStatus('');
    setSelectedLocationType('');
    setSelectedMonth('');
    setSelectedClient('');
    triggerToast('🔍 모든 검색 및 필터링 조건이 초기화되었습니다.');
  };

  // Manual trigger for data updates
  const handleReloadClick = async () => {
    await loadAllData(false);
    triggerToast('🔄 데이터베이스에서 최신 일정 정보를 성공적으로 갱신하였습니다.');
  };

  // CRUDS HANDLERS
  // 1. Projects
  const handleSaveProject = async (p: Project) => {
    await dbService.saveProject(p);
    triggerToast(`✨ [${p.client_name}] 프로젝트 정보를 저장하였습니다.`);
    loadAllData(true);
  };

  const handleDeleteProject = async (id: string) => {
    await dbService.deleteProject(id);
    const childRounds = rounds.filter(r => r.project_id === id);
    for (const r of childRounds) {
      await dbService.deleteRound(r.id);
      // 차수별 checklists 연쇄 삭제
      const roundChecklists = checklistItems.filter(c => c.round_id === r.id);
      for (const c of roundChecklists) {
        await dbService.deleteChecklist(c.id);
      }
    }
    // 프로젝트 공통 checklists 연쇄 삭제
    const projectChecklists = checklistItems.filter(c => c.project_id === id);
    for (const c of projectChecklists) {
      await dbService.deleteChecklist(c.id);
    }
    triggerToast(`🗑️ 프로젝트와 하위 ${childRounds.length}개 차수 및 관련 체크리스트가 일괄 삭제되었습니다.`);
    loadAllData(true);
  };

  // 2. Rounds
  const handleSaveRound = async (r: Round) => {
    const isNewRound = !rounds.some(item => item.id === r.id);
    await dbService.saveRound(r);
    
    if (isNewRound) {
      // Create default checklist categories: 운영 전, 운영 중, 운영 후
      const defaultChecklists = [
        '[운영 전] 강의장/기기 사전 세팅 및 교재/다과 준비',
        '[운영 중] 강사 교안 검수 및 출석/만족도 설문 점검',
        '[운영 후] 만족도 설문 분석 및 사후 정산 보고서 작성'
      ];
      for (let i = 0; i < defaultChecklists.length; i++) {
        const defaultItem: ChecklistItem = {
          id: `chk_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 9)}`,
          project_id: null,
          round_id: r.id,
          title: defaultChecklists[i],
          is_done: false,
          sort_order: i + 1,
          is_active: true
        };
        await dbService.saveChecklist(defaultItem);
      }
    }

    // Automatically re-calculate and synchronize status of parent project based on child rounds!
    // (Only if parent project is not manually set to Canceled or Hold)
    const siblingRounds = rounds.filter(item => item.project_id === r.project_id && item.id !== r.id);
    const combinedRounds = [...siblingRounds, r];
    const parentProj = projects.find(item => item.id === r.project_id);
    if (parentProj && parentProj.status !== '취소' && parentProj.status !== '보류') {
      const calculatedStatus = calculateProjectStatus(combinedRounds);
      if (parentProj.status !== calculatedStatus && calculatedStatus !== '보류') {
        const updatedProj = { ...parentProj, status: calculatedStatus };
        await dbService.saveProject(updatedProj);
      }
    }

    triggerToast(
      isNewRound 
        ? `✨ [${r.round_name}] 차수가 개설되고 기본 체크리스트 3건이 자동 등록되었습니다.`
        : `✨ [${r.round_name}] 차수 상세 정보를 안전하게 업데이트했습니다.`
    );
    loadAllData(true);
  };

  const handleCopyRound = async (newRound: Round, originalRoundId: string) => {
    await dbService.saveRound(newRound);
    
    // Copy checklist items of original round
    const originalChecklists = checklistItems.filter(item => item.is_active && item.round_id === originalRoundId);
    for (const item of originalChecklists) {
      const copiedItem: ChecklistItem = {
        id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        project_id: null,
        round_id: newRound.id,
        title: item.title,
        is_done: false, // Reset done state for copied round
        sort_order: item.sort_order,
        is_active: true
      };
      await dbService.saveChecklist(copiedItem);
    }

    triggerToast(`📋 차수와 체크리스트 ${originalChecklists.length}건이 함께 복제되었습니다.`);
    loadAllData(true);
  };

  const handleDeleteRound = async (id: string) => {
    await dbService.deleteRound(id);
    // 차수 checklists 연쇄 삭제
    const roundChecklists = checklistItems.filter(c => c.round_id === id);
    for (const c of roundChecklists) {
      await dbService.deleteChecklist(c.id);
    }
    triggerToast(`🗑️ 세부 차수와 관련 체크리스트가 안전하게 제거되었습니다.`);
    loadAllData(true);
  };

  // 3. Satisfaction Only handler
  const handleSaveSatisfaction = async (data: {
    roundId: string;
    satisfaction: number | null;
    instructorSatisfaction: number | null;
    operationSatisfaction: number | null;
    remarks: string;
  }) => {
    const target = rounds.find(r => r.id === data.roundId);
    if (target) {
      const updatedRound: Round = {
        ...target,
        status: '완료', // Force complete status
        satisfaction: data.satisfaction,
        instructor_satisfaction: data.instructorSatisfaction,
        operation_satisfaction: data.operationSatisfaction,
        remarks: data.remarks,
        satisfaction_updated_at: new Date().toISOString()
      };
      await dbService.saveRound(updatedRound);

      // Automatically re-calculate and synchronize status of parent project based on child rounds!
      // (Only if parent project is not manually set to Canceled or Hold)
      const siblingRounds = rounds.filter(item => item.project_id === target.project_id && item.id !== target.id);
      const combinedRounds = [...siblingRounds, updatedRound];
      const parentProj = projects.find(item => item.id === target.project_id);
      if (parentProj && parentProj.status !== '취소' && parentProj.status !== '보류') {
        const calculatedStatus = calculateProjectStatus(combinedRounds);
        if (parentProj.status !== calculatedStatus && calculatedStatus !== '보류') {
          const updatedProj = { ...parentProj, status: calculatedStatus };
          await dbService.saveProject(updatedProj);
        }
      }

      triggerToast(`⭐ 만족도 평점 (${data.satisfaction ?? '미기명'})이 연동되고 과정 상태가 자동 동기화되었습니다.`);
      loadAllData(true);
    }
  };

  // CHECKLIST UPDATED RELOAD
  const handleUpdateChecklist = () => {
    loadAllData(true);
  };

  // 데이터 백업 기능
  const handleBackupData = () => {
    try {
      const backup = {
        members: JSON.parse(localStorage.getItem('hrd_members') || '[]'),
        projects: JSON.parse(localStorage.getItem('hrd_projects') || '[]'),
        rounds: JSON.parse(localStorage.getItem('hrd_rounds') || '[]'),
        checklists: JSON.parse(localStorage.getItem('hrd_checklists') || '[]'),
        share_posts: JSON.parse(localStorage.getItem('hrd_share_posts') || '[]'),
        backup_at: new Date().toISOString()
      };
      const dataStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      link.setAttribute('download', `HRI_HRD_BACKUP_${dateStr}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast('📥 데이터베이스 백업 파일 다운로드가 완료되었습니다.');
    } catch (e) {
      console.error(e);
      alert('백업 파일 생성 중 오류가 발생했습니다.');
    }
  };

  // 데이터 복원 기능
  const handleRestoreData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        if (!data.members || !data.projects || !data.rounds) {
          alert('유효하지 않은 백업 파일 포맷입니다.');
          return;
        }

        if (window.confirm('이 백업 파일로 기존 데이터를 모두 덮어쓰시겠습니까? 현재 데이터는 유실됩니다.')) {
          localStorage.setItem('hrd_members', JSON.stringify(data.members));
          localStorage.setItem('hrd_projects', JSON.stringify(data.projects));
          localStorage.setItem('hrd_rounds', JSON.stringify(data.rounds));
          if (data.checklists) localStorage.setItem('hrd_checklists', JSON.stringify(data.checklists));
          if (data.share_posts) localStorage.setItem('hrd_share_posts', JSON.stringify(data.share_posts));
          
          triggerToast('✨ 백업 데이터를 성공적으로 복원하였습니다!');
          await loadAllData(false);
        }
      } catch (err) {
        console.error(err);
        alert('파일을 파싱하는 중 오류가 발생했습니다. 올바른 백업 JSON 파일인지 확인하세요.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // MODAL TRIGGER WRAPPERS
  const openProjectModal = (proj?: Project) => {
    setEditingProject(proj);
    setIsProjectModalOpen(true);
  };

  const openRoundModal = (proj: Project, rnd?: Round) => {
    setRoundModalParentProject(proj);
    setEditingRound(rnd);
    setIsRoundModalOpen(true);
  };

  const openSatisfactionModal = (rnd: Round) => {
    setSatisfactionTargetRound(rnd);
    setIsSatisfactionModalOpen(true);
  };

  const openChecklistModal = (proj: Project, rnd?: Round) => {
    setChecklistTargetProject(proj);
    setChecklistTargetRound(rnd);
    setIsChecklistModalOpen(true);
  };

  // === DYNAMIC FILTER CALCULATOR LOGIC ===
  // 1. Get dynamic clients list for filtering
  const clientsList = Array.from(new Set(projects.filter(p => p.is_active).map(p => p.client_name).filter(Boolean)));
  
  // 2. Get registered years dynamically
  const availableYears = getYearsFromData(projects, rounds);

  // Start filtering process
  let filteredProjects = projects.filter(p => p.is_active);
  let filteredRounds = rounds.filter(r => r.is_active);

  // A. Filter by selected dynamic Year
  if (selectedYear) {
    filteredRounds = filteredRounds.filter(r => {
      if (!r.start_date) return false;
      return new Date(r.start_date).getFullYear() === selectedYear;
    });

    filteredProjects = filteredProjects.filter(p => {
      const startYr = p.start_month ? parseInt(p.start_month.split('-')[0], 10) : null;
      const endYr = p.end_month ? parseInt(p.end_month.split('-')[0], 10) : null;
      const hasRoundsInYear = filteredRounds.some(r => r.project_id === p.id);
      
      return hasRoundsInYear || (startYr === selectedYear || endYr === selectedYear);
    });
  }

  // B. "내 업무만 보기" (My Work Only)
  if (isMyWorkOnly && selectedManagerId) {
    filteredRounds = filteredRounds.filter(r => {
      const isSupport = r.support_manager_ids?.includes(selectedManagerId);
      const isField = r.field_manager_ids?.includes(selectedManagerId);
      const parent = projects.find(p => p.id === r.project_id);
      
      const isProjManager = parent && (
        parent.business_manager_id === selectedManagerId ||
        parent.pm_manager_id === selectedManagerId ||
        parent.pl_manager_id === selectedManagerId
      );

      return isSupport || isField || isProjManager;
    });

    filteredProjects = filteredProjects.filter(p => {
      const isDirectRole = p.business_manager_id === selectedManagerId ||
                           p.pm_manager_id === selectedManagerId ||
                           p.pl_manager_id === selectedManagerId;
      const hasRoundsAssigned = filteredRounds.some(r => r.project_id === p.id);
      return isDirectRole || hasRoundsAssigned;
    });
  }

  // C. Manual Manager filter
  if (selectedManagerId && !isMyWorkOnly) {
    filteredRounds = filteredRounds.filter(r => {
      const isSupport = r.support_manager_ids?.includes(selectedManagerId);
      const isField = r.field_manager_ids?.includes(selectedManagerId);
      const parent = projects.find(p => p.id === r.project_id);
      
      const isProjManager = parent && (
        parent.business_manager_id === selectedManagerId ||
        parent.pm_manager_id === selectedManagerId ||
        parent.pl_manager_id === selectedManagerId
      );

      return isSupport || isField || isProjManager;
    });

    filteredProjects = filteredProjects.filter(p => {
      const isDirectRole = p.business_manager_id === selectedManagerId ||
                           p.pm_manager_id === selectedManagerId ||
                           p.pl_manager_id === selectedManagerId;
      const hasRoundsAssigned = filteredRounds.some(r => r.project_id === p.id);
      return isDirectRole || hasRoundsAssigned;
    });
  }

  // D. Status filter
  if (selectedStatus) {
    filteredProjects = filteredProjects.filter(p => p.status === selectedStatus);
    filteredRounds = filteredRounds.filter(r => filteredProjects.some(p => p.id === r.project_id));
  }

  // E. Location Type filter
  if (selectedLocationType) {
    filteredProjects = filteredProjects.filter(p => p.location_type === selectedLocationType);
    filteredRounds = filteredRounds.filter(r => r.location_type === selectedLocationType);
  }

  // F. Month filter
  if (selectedMonth) {
    filteredRounds = filteredRounds.filter(r => {
      if (!r.start_date) return false;
      const monthPart = String(new Date(r.start_date).getMonth() + 1).padStart(2, '0');
      return monthPart === selectedMonth;
    });
    filteredProjects = filteredProjects.filter(p => filteredRounds.some(r => r.project_id === p.id));
  }

  // G. Client filter
  if (selectedClient) {
    filteredProjects = filteredProjects.filter(p => p.client_name === selectedClient);
    filteredRounds = filteredRounds.filter(r => filteredProjects.some(p => p.id === r.project_id));
  }

  // H. Text search query filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filteredProjects = filteredProjects.filter(p => {
      const matchProj = p.project_name?.toLowerCase().includes(q) ||
                        p.client_name?.toLowerCase().includes(q) ||
                        p.target_audience?.toLowerCase().includes(q) ||
                        p.notes?.toLowerCase().includes(q);

      const hasMatchRounds = rounds.some(r => 
        r.project_id === p.id && r.is_active && (
          r.round_name?.toLowerCase().includes(q) ||
          r.venue_detail?.toLowerCase().includes(q) ||
          r.round_memo?.toLowerCase().includes(q)
        )
      );

      return matchProj || hasMatchRounds;
    });

    filteredRounds = filteredRounds.filter(r => {
      const matchRnd = r.round_name?.toLowerCase().includes(q) ||
                       r.venue_detail?.toLowerCase().includes(q) ||
                       r.round_memo?.toLowerCase().includes(q);
      const parentMatches = filteredProjects.some(p => p.id === r.project_id);
      return matchRnd || parentMatches;
    });
  }

  // ================= DATA DOWNLOAD EXPORTER =================
  const handleDownloadCsv = () => {
    if (filteredProjects.length === 0) {
      alert('필터링 결과에 다운로드할 수 있는 과정운영 데이터가 없습니다.');
      return;
    }

    // Build headers row
    const headers = [
      '프로젝트명', '고객사', '교육대상', '유형 분류', '시작월', '종료월', '종합장소유형', '사업담당', '운영PM', '운영PL', '프로젝트진행상태',
      '차수번호', '세부차수과정명', '차수시작일', '차수종료일', '차수진행상태', '차수장소유형', '운영장소상세', '운영시간(H)', '교육수료인원(명)',
      '전반교육만족도', '강사만족도', '운영교재만족도', '만족도기입상태', '차수운영메모', '특이비고'
    ];

    const rows: string[][] = [];

    filteredProjects.forEach(p => {
      const pRounds = filteredRounds.filter(r => r.project_id === p.id);
      const bizName = members.find(m => m.id === p.business_manager_id)?.name || '미지정';
      const pmName = members.find(m => m.id === p.pm_manager_id)?.name || '미지정';
      const plName = members.find(m => m.id === p.pl_manager_id)?.name || '미지정';

      if (pRounds.length === 0) {
        // Row without round
        rows.push([
          p.project_name, p.client_name, p.target_audience, p.project_type, p.start_month, p.end_month, p.location_type, bizName, pmName, plName, p.status,
          '-', '세부 차수 미배정', '-', '-', '-', '-', '-', '0', '0', '-', '-', '-', '미기입', '-', p.notes || ''
        ]);
      } else {
        pRounds.forEach(r => {
          const satStatus = r.status === '완료' 
            ? (r.satisfaction !== null ? '입력 완료' : '미입력 (후속 대기)')
            : '해당없음';

          rows.push([
            p.project_name, p.client_name, p.target_audience, p.project_type, p.start_month, p.end_month, p.location_type, bizName, pmName, plName, p.status,
            r.round_no.toString(), r.round_name, r.start_date, r.end_date, r.status, r.location_type, r.venue_detail, r.operation_hours.toString(), r.participant_count.toString(),
            r.satisfaction !== null ? r.satisfaction.toString() : '-',
            r.instructor_satisfaction !== null ? r.instructor_satisfaction.toString() : '-',
            r.operation_satisfaction !== null ? r.operation_satisfaction.toString() : '-',
            satStatus, r.round_memo || '', r.remarks || ''
          ]);
        });
      }
    });

    // Generate CSV string safe for Korean MS Excel
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const cleanVal = val ? val.replace(/"/g, '""') : '';
        return `"${cleanVal}"`;
      }).join(','))
    ].join('\n');

    const universalDateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `HRD_OPS_REPORT_${selectedYear}Y_${universalDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast('📥 필터링된 과정운영 조서 데이터 다운로드가 완료되었습니다.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans tracking-tight pb-8">
      
      {/* SIDEBAR NAVIGATION DRAWER */}
      {isSidebarOpen && (
        <>
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity duration-300"
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-55 shadow-2xl flex flex-col p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Layers size={20} className="text-cyan-400" />
                <span className="font-extrabold text-sm tracking-tight text-slate-100">HRI 과정운영 메뉴</span>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 space-y-2 text-xs">
              <button
                onClick={() => {
                  setCurrentMenu('dashboard');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-4.5 py-3.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                  currentMenu === 'dashboard'
                    ? 'bg-cyan-750 bg-cyan-700 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Layers size={15} />
                <span>📊 모니터링 대시보드</span>
              </button>

              <button
                onClick={() => {
                  setCurrentMenu('prepop');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-4.5 py-3.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                  currentMenu === 'prepop'
                    ? 'bg-cyan-750 bg-cyan-700 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <CheckSquare size={15} />
                <span>📋 운영 준비 (체크리스트)</span>
              </button>

              <button
                onClick={() => {
                  setCurrentMenu('share');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-4.5 py-3.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                  currentMenu === 'share'
                    ? 'bg-cyan-750 bg-cyan-700 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <MessageSquare size={15} />
                <span>📢 운영정보 공유 게시판</span>
              </button>
              
              <button
                onClick={() => {
                  setIsMemberModalOpen(true);
                  setIsSidebarOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-4.5 py-3.5 rounded-xl font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-all text-left cursor-pointer border-t border-slate-800/50 mt-4 pt-4"
              >
                <Users size={15} />
                <span>👥 담당자 관리</span>
              </button>
            </nav>

            {/* Backup & Restore Controls */}
            <div className="border-t border-slate-800/40 pt-4 flex flex-col gap-2 px-1 text-[11px] text-slate-400">
              <span className="font-extrabold text-[9px] text-slate-500 uppercase tracking-widest block mb-0.5">시스템 백업/복원</span>
              <div className="flex gap-2">
                <button
                  onClick={handleBackupData}
                  className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-1.5 px-2 rounded-lg border border-slate-700/60 transition-all text-center cursor-pointer flex items-center justify-center gap-1 text-[10px]"
                  title="전체 데이터 백업 (JSON)"
                >
                  <Download size={10} />
                  <span>데이터 백업</span>
                </button>
                <label
                  className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-1.5 px-2 rounded-lg border border-slate-700/60 transition-all text-center cursor-pointer flex items-center justify-center gap-1 text-[10px]"
                  title="백업 파일 가져와서 복원 (JSON)"
                >
                  <RefreshCw size={10} />
                  <span>백업 복원</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreData}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 font-mono text-center select-none pt-4 border-t border-slate-800/40">
              v2.0 HRI HRD Team
            </div>
          </div>
        </>
      )}
      
      {/* GLOBAL BACKGROUND FLOATING DECORATIONS */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-indigo-100/30 to-teal-100/30 blur-[90px] rounded-full pointer-events-none -z-10" />

      {/* DASHBOARD TOP HEADER BAR */}
      <header className="sticky top-0 bg-white/85 backdrop-blur-md border-b border-slate-200 py-3.5 px-4 md:px-6 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo Title */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer mr-0.5"
              title="운영 메뉴 열기 ☰"
            >
              <Menu size={22} className="stroke-[2.2]" />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-650 flex items-center justify-center text-white font-extrabold shadow-sm shadow-cyan-100">
              <Layers size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-slate-900 tracking-tight text-md">
                  HRD사업팀 교육운영관리
                </h1>
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest bg-slate-100 px-1.5 py-0.2 rounded">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {currentMenu === 'share'
                  ? '과정 운영정보 공유 게시판'
                  : currentMenu === 'prepop' 
                    ? '과정 운영준비 체크리스트' 
                    : '과정운영 업무현황 대시보드'}
              </p>
            </div>
          </div>

          {/* Quick Global Toggles: Dynamic based on Menu */}
          <div className="flex flex-wrap items-center gap-2 md:self-center self-stretch">
            {currentMenu === 'share' ? (
              <>
                {/* Reload State Data Button & Tooltip */}
                <div className="relative group flex items-center">
                  <button
                    onClick={handleReloadClick}
                    className="px-3.5 py-1.5 font-bold text-xs text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-3xs cursor-pointer flex items-center gap-1.5"
                    title="데이터 동기화 🔄"
                  >
                    <RefreshCw size={13} className="text-slate-500" />
                    <span>새로고침</span>
                  </button>
                  <div className="absolute top-full right-0 mt-2 hidden group-hover:block bg-slate-900 text-white text-[10px] font-medium p-3 rounded-xl shadow-xl w-60 z-50 leading-relaxed border border-slate-800">
                    <span className="font-extrabold text-cyan-400 block mb-1">💡 자정 자동 상태 승격 가이드</span>
                    오늘 날짜(KST 서울 시간)가 차수 시작일과 같거나 지나간 '준비중' 차수는 동기화 시 자동으로 <strong className="text-white font-bold">'운영중'</strong>으로 승격 전이됩니다.
                  </div>
                </div>

                {/* Manage Contacts button */}
                <button
                  onClick={() => setIsMemberModalOpen(true)}
                  className="px-3.5 py-1.5 font-bold text-xs text-slate-600 hover:text-slate-800 bg-slate-100 border border-slate-200 hover:bg-slate-200/50 rounded-xl transition-colors shadow-3xs cursor-pointer flex items-center gap-1"
                  title="담당자 등록/수정/삭제/숨김 관리"
                >
                  <Settings size={13} />
                  <span>담당자 관리</span>
                </button>
              </>
            ) : (
              <>
                {/* Year Selector Dropdown */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-3xs hover:bg-slate-50/50">
                  <span className="text-[10px] font-black text-slate-400 font-sans uppercase">년도</span>
                  <select 
                    value={selectedYear}
                    onChange={(e) => handleYearChange(Number(e.target.value))}
                    className="text-xs font-bold font-mono text-slate-800 outline-none cursor-pointer bg-transparent"
                  >
                    {availableYears.map(yr => (
                      <option key={yr} value={yr}>{yr}년</option>
                    ))}
                  </select>
                </div>

                {/* Manager dropdown selection */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-3xs overflow-hidden max-w-[180px]">
                  <span className="text-[10px] font-black text-slate-400 font-sans uppercase">담당자</span>
                  <select 
                    value={selectedManagerId}
                    onChange={(e) => setSelectedManagerId(e.target.value)}
                    className="text-xs font-bold text-slate-800 outline-none bg-transparent cursor-pointer max-w-[85px] truncate"
                  >
                    <option value="">전체 담당</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name} {m.position}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setIsMemberModalOpen(true)}
                    className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer rounded-lg hover:bg-slate-50 transition-colors"
                    title="담당자 등록/수정/삭제/숨김 관리"
                  >
                    <Settings size={13} />
                  </button>
                </div>

                {/* My Work Only Action Toggle */}
                <button
                  onClick={() => {
                    if (!selectedManagerId) {
                      alert('상단 "담당자" 상자에서 나를 지정(선택)하신 후에 사용하십시오!');
                      return;
                    }
                    setIsMyWorkOnly(!isMyWorkOnly);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition-all duration-200 shadow-3xs flex items-center gap-1.5 cursor-pointer ${
                    isMyWorkOnly && selectedManagerId
                      ? 'bg-rose-600 border-rose-600 text-white font-extrabold animate-pulse'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Flame size={12} className={isMyWorkOnly ? 'text-white' : 'text-slate-400'} />
                  <span>내 업무만 보기</span>
                </button>

                {/* Reload State Data Button & Tooltip */}
                <div className="relative group flex items-center">
                  <button
                    onClick={handleReloadClick}
                    className="p-2 font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-3xs cursor-pointer"
                    title="데이터 동기화 🔄"
                  >
                    <RefreshCw size={14} />
                  </button>
                  <div className="absolute top-full right-0 mt-2 hidden group-hover:block bg-slate-900 text-white text-[10px] font-medium p-3 rounded-xl shadow-xl w-60 z-50 leading-relaxed border border-slate-800">
                    <span className="font-extrabold text-cyan-400 block mb-1">💡 자정 자동 상태 승격 가이드</span>
                    오늘 날짜(KST 서울 시간)가 차수 시작일과 같거나 지나간 '준비중' 차수는 동기화 시 자동으로 <strong className="text-white font-bold">'운영중'</strong>으로 승격 전이됩니다.
                  </div>
                </div>

                {/* Manage Contacts button */}
                <button
                  onClick={() => setIsMemberModalOpen(true)}
                  className="px-3 py-1.5 font-bold text-xs text-slate-600 hover:text-slate-800 bg-slate-100 border border-slate-200 hover:bg-slate-200/50 rounded-xl transition-colors shadow-3xs cursor-pointer flex items-center gap-1"
                  title="담당자 등록/수정/삭제/숨김 관리"
                >
                  <Settings size={13} />
                  <span>담당자 관리</span>
                </button>

                {/* Download CSV button */}
                {!isMobile && (
                  <button
                    onClick={handleDownloadCsv}
                    className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl shadow-3xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Download size={14} className="text-slate-500" />
                    <span>다운로드</span>
                  </button>
                )}

                {/* Register Project button (PC only) */}
                {!isMobile && (
                  <button
                    onClick={() => openProjectModal()}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-950 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-1 transition-all"
                  >
                    <Plus size={14} />
                    <span>신규 과정 등록</span>
                  </button>
                )}
              </>
            )}
          </div>

        </div>
      </header>

      {/* MOBILE WARNING / INDICATOR BLOCK */}
      {isMobile && (
        <div className="bg-amber-500 text-white text-xs py-2 px-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold">
            <Smartphone size={14} />
            <span>
              {currentMenu === 'share'
                ? '모바일 최적화 뷰 활성: 현장 정보공유 조회 모드'
                : currentMenu === 'prepop' 
                  ? '모바일 최적화 뷰 활성: 현장 체크리스트 점검 모드' 
                  : '모바일 최적화 뷰 활성: 현장 조회 및 만족도 체크 전용 모드'}
            </span>
          </div>
          {currentMenu !== 'prepop' && currentMenu !== 'share' && (
            <button 
              onClick={() => openProjectModal()}
              className="bg-white text-slate-850 font-sans text-[10px] font-black px-2 py-0.5 rounded text-black"
            >
              과정 개설
            </button>
          )}
        </div>
      )}

      {/* TOAST SYSTEM ALERTS */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-slate-900 border border-slate-800 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50 animate-bounce">
          <Sparkles size={14} className="text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN CONTAINER CONTENT BODY */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* LOADING BOX */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-white border rounded-3xl">
            <RefreshCw size={36} className="text-cyan-600 animate-spin" />
            <p className="text-xs text-slate-400 font-bold font-mono">HRD DATABASE SYNCING...</p>
          </div>
        ) : (
          <>
            {currentMenu === 'share' ? (
              <ShareBoard 
                members={members}
                posts={sharePosts}
                onUpdatePosts={() => loadAllData(true)}
              />
            ) : currentMenu === 'prepop' ? (
              <ChecklistTab 
                projects={filteredProjects}
                rounds={filteredRounds}
                checklistItems={checklistItems}
                onUpdateChecklist={handleUpdateChecklist}
              />
            ) : (
              <>
                {/* SUMMARY STAT CARDS */}
                <SummaryCards 
                  filteredProjects={filteredProjects}
                  filteredRounds={filteredRounds}
                  allRounds={rounds}
                  members={members}
                />

                {/* SEARCH AND FILTERS BAR */}
                <section className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
                  
                  {/* Header Title search */}
                  <div className="flex items-center justify-between border-b pb-2.5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      🔍 퀄리파이어 다차원 필터링 & 간편 검색
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 font-mono">
                      결과: 프로젝트 {filteredProjects.length}건 / 세부차수 {filteredRounds.length}건
                    </span>
                  </div>

                  {/* Grid 4 columns dropdowns */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
                    
                    {/* Search Text */}
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Search size={14} />
                      </span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="과정명, 고객사, 장소, 비고..."
                        className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-cyan-600"
                      />
                    </div>

                    {/* Status Dropdown */}
                    <div>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-xl px-2.5 py-2.5 bg-slate-50 outline-none"
                      >
                        <option value="">전체 종합상태</option>
                        <option value="준비중">준비중</option>
                        <option value="운영중">운영중</option>
                        <option value="완료">완료 (보고완)</option>
                        <option value="보류">보류</option>
                        <option value="취소">취소</option>
                      </select>
                    </div>

                    {/* Location Type Dropdown */}
                    <div>
                      <select
                        value={selectedLocationType}
                        onChange={(e) => setSelectedLocationType(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-xl px-2.5 py-2.5 bg-slate-50 outline-none"
                      >
                        <option value="">전체 장소유형</option>
                        <option value="온라인">온라인</option>
                        <option value="외근">외근(1일)</option>
                        <option value="숙박">합숙(출장)</option>
                      </select>
                    </div>

                    {/* Month Dropdown */}
                    <div>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-xl px-2.5 py-2.5 bg-slate-50 outline-none"
                      >
                        <option value="">전체 운영 월</option>
                        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                          <option key={m} value={m}>{m}월</option>
                        ))}
                      </select>
                    </div>

                    {/* Customer client dynamic dropdown */}
                    <div>
                      <select
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-xl px-2.5 py-2.5 bg-slate-50 outline-none"
                      >
                        <option value="">고객사</option>
                        {clientsList.map(cli => (
                          <option key={cli} value={cli}>{cli}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* Filter commands */}
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-sans">
                      ※ 조건 적용 즉시 모든 대시보드 지표 및 타임라인, 칸반 실무 카드가 동조 갱신됩니다.
                    </p>

                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 hover:bg-rose-100/50"
                    >
                      필터 조건 일괄 해제
                    </button>
                  </div>

                </section>

                {/* TAB VIEW SELECTION CONTROLS */}
                <div className="flex bg-slate-200/80 p-1 rounded-2xl max-w-xs">
                  <button
                    onClick={() => setCurrentTab('timeline')}
                    className={`flex-1 text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer ${
                      currentTab === 'timeline' 
                        ? 'bg-white text-slate-900 shadow-xs font-extrabold' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    📅 연간 타임라인
                  </button>

                  <button
                    onClick={() => setCurrentTab('kanban')}
                    className={`flex-1 text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer ${
                      currentTab === 'kanban' 
                        ? 'bg-white text-slate-900 shadow-xs font-extrabold' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    📋 단계별 보드
                  </button>

                  <button
                    onClick={() => setCurrentTab('manager')}
                    className={`flex-1 text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer ${
                      currentTab === 'manager' 
                        ? 'bg-white text-slate-900 shadow-xs font-extrabold' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    👥 담당자별 업무
                  </button>
                </div>

                {/* PRIMARY VIEW CONTENT CONDITIONAL RENDERING */}
                <section className="transition-all duration-300">
                  {currentTab === 'timeline' && (
                    <Timeline 
                      selectedYear={selectedYear}
                      projects={filteredProjects}
                      rounds={filteredRounds}
                      members={members}
                      onOpenRoundModal={openRoundModal}
                      onOpenProjectModal={openProjectModal}
                    />
                  )}

                  {currentTab === 'kanban' && (
                    <KanbanBoard 
                      projects={filteredProjects}
                      rounds={filteredRounds}
                      members={members}
                      onOpenProjectModal={openProjectModal}
                      onOpenRoundModal={openRoundModal}
                      onOpenChecklistModal={openChecklistModal}
                      onOpenSatisfactionModal={openSatisfactionModal}
                    />
                  )}

                  {currentTab === 'manager' && (
                    <ManagerWorkload 
                      members={members}
                      projects={projects}
                      rounds={rounds}
                      onOpenSatisfactionModal={openSatisfactionModal}
                      onOpenRoundModal={openRoundModal}
                    />
                  )}
                </section>
              </>
            )}
          </>
        )}

      </main>

      {/* FOOTER BRUTALIST BRAND BLOCK */}
      <footer className="mt-20 border-t border-slate-200 pt-6 max-w-7xl mx-auto px-6 text-slate-400 select-none">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-center sm:text-left">
          <div>
            <p className="font-bold text-slate-800">HRI HRD-OPS 통합 과정운영 플랫폼</p>
            <p className="text-[11px] text-slate-400">Copyright © 2026 Hyundai Research Institute HRD사업팀. All Rights Reserved.</p>
          </div>
          <div className="text-slate-300 font-mono text-[10px]">
             PORT: 3000 / STORAGE: HYBRID-DB_CLIENT
          </div>
        </div>
      </footer>

      {/* ================= MODAL MOUNTED SERVICES ================= */}
      <ProjectModal 
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
        project={editingProject}
        members={members}
      />

      {roundModalParentProject && (
        <RoundModal 
          isOpen={isRoundModalOpen}
          onClose={() => setIsRoundModalOpen(false)}
          onSave={handleSaveRound}
          onCopy={handleCopyRound}
          onDelete={handleDeleteRound}
          project={roundModalParentProject}
          round={editingRound}
          members={members}
          rounds={rounds}
        />
      )}

      {satisfactionTargetRound && (
        <SatisfactionModal 
          isOpen={isSatisfactionModalOpen}
          onClose={() => setIsSatisfactionModalOpen(false)}
          onSave={handleSaveSatisfaction}
          round={satisfactionTargetRound}
        />
      )}

      {checklistTargetProject && (
        <ChecklistModal 
          isOpen={isChecklistModalOpen}
          onClose={() => setIsChecklistModalOpen(false)}
          project={checklistTargetProject}
          round={checklistTargetRound}
          checklistItems={checklistItems}
          onUpdateChecklist={handleUpdateChecklist}
        />
      )}

      <MemberModal 
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        members={members}
        onUpdateMembers={() => loadAllData(true)}
      />

    </div>
  );
}

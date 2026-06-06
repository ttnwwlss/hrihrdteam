import React, { useState } from 'react';
import { Member, Project, Round } from '../../types';
import { 
  User, 
  MapPin, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Users, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  ClipboardCheck, 
  BookOpen 
} from 'lucide-react';
import { formatDateLabel, isInThisMonth, isInNextMonth, getYearsFromData } from '../../utils/dateUtils';

interface ManagerWorkloadProps {
  members: Member[];
  projects: Project[];
  rounds: Round[];
  onOpenSatisfactionModal?: (round: Round) => void;
  onOpenRoundModal?: (project: Project, round?: Round) => void;
}

export default function ManagerWorkload({
  members,
  projects,
  rounds,
  onOpenSatisfactionModal,
  onOpenRoundModal
}: ManagerWorkloadProps) {
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [filterTab, setFilterTab] = useState<'all' | 'active_this_month' | 'missing_satisfaction'>('all');
  const [memberRoleFilters, setMemberRoleFilters] = useState<Record<string, string | null>>({});
  const [memberStatusFilters, setMemberStatusFilters] = useState<Record<string, string | null>>({});

  const toggleExpand = (id: string) => {
    setExpandedMemberId(expandedMemberId === id ? null : id);
  };

  const availableYears = getYearsFromData(projects, rounds);

  // Get active members
  const activeMembers = members.filter(m => m.is_active);

  // Filter members based on search query & selected tab
  const filteredMembers = activeMembers.filter(member => {
    // 1. Search filter
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (member.position && member.position.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (filterTab === 'all') return true;

    // Build the member's assigned rounds list to determine conditions (Only round-level support/field roles)
    const memberRounds = rounds.filter(round => {
      if (!round.is_active) return false;
      
      if (round.start_date) {
        const roundYear = new Date(round.start_date).getFullYear();
        if (roundYear !== selectedYear) return false;
      }

      const isSupport = round.support_manager_ids?.includes(member.id);
      const isField = round.field_manager_ids?.includes(member.id);

      return isSupport || isField;
    });

    if (filterTab === 'active_this_month') {
      const thisMonthCount = memberRounds.filter(r => r.start_date && isInThisMonth(r.start_date)).length;
      return thisMonthCount > 0;
    }

    if (filterTab === 'missing_satisfaction') {
      const missingSatCount = memberRounds.filter(r => r.status === '완료' && (r.satisfaction === null || r.satisfaction === undefined)).length;
      return missingSatCount > 0;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            👥 담당자별 과정운영 현황
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            팀 구성원별로 배정된 세부 차수의 실시간 일감 로드 및 운영 실적 통계입니다.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl shrink-0 self-start sm:self-center">
          활성 담당자: {activeMembers.length}명
        </div>
      </div>

      {/* Modern Search & Filtering Controls */}
      <div id="manager-filter-bar" className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-3xs">
        {/* Search & Year Select Group */}
        <div className="flex flex-col sm:flex-row gap-2.5 flex-1 max-w-2xl">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="이름 또는 직급으로 담당자 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-white text-xs rounded-xl focus:outline-hidden focus:border-slate-350 transition-colors shadow-3xs text-slate-800 placeholder-slate-400"
            />
            <User className="absolute left-3 top-2.5 text-slate-400" size={14} />
          </div>

          {/* Year Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-3xs hover:bg-slate-50/50 shrink-0">
            <span className="text-[10px] font-black text-slate-400 font-sans uppercase">년도</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs font-bold font-mono text-slate-800 outline-none cursor-pointer bg-transparent"
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr}>{yr}년</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab filters */}
        <div id="manager-tab-controls" className="flex bg-slate-200/60 p-1 rounded-xl shrink-0 overflow-x-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={`flex-1 md:flex-initial text-[11px] font-bold py-1.5 px-3 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filterTab === 'all'
                ? 'bg-white text-slate-900 shadow-3xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            모든 담당자 ({activeMembers.length}명)
          </button>
          
          <button
            onClick={() => setFilterTab('active_this_month')}
            className={`flex-1 md:flex-initial text-[11px] font-bold py-1.5 px-3 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filterTab === 'active_this_month'
                ? 'bg-white text-slate-900 shadow-3xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🔥 이번달 로드 있는 분
          </button>

          <button
            onClick={() => setFilterTab('missing_satisfaction')}
            className={`flex-1 md:flex-initial text-[11px] font-bold py-1.5 px-3 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filterTab === 'missing_satisfaction'
                ? 'bg-white text-slate-900 shadow-3xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ⚠️ 만족도 피드백 대기
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 font-bold flex flex-col items-center justify-center gap-2">
            <span>검색 조건이나 선택한 탭에 해당하는 담당자가 없습니다.</span>
            <button 
              onClick={() => { setSearchTerm(''); setFilterTab('all'); }}
              className="text-[11px] text-cyan-600 hover:underline cursor-pointer font-bold mt-1"
            >
              필터 초기화
            </button>
          </div>
        ) : (
          filteredMembers.map(member => {
          // Find projects where they have a coordinate role in the selected year
          const memberProjects = projects.filter(p => {
            if (!p.is_active) return false;
            const isRole = p.business_manager_id === member.id || 
                           p.pm_manager_id === member.id || 
                           p.pl_manager_id === member.id;
            if (!isRole) return false;
            
            const startYr = p.start_month ? parseInt(p.start_month.split('-')[0], 10) : null;
            const endYr = p.end_month ? parseInt(p.end_month.split('-')[0], 10) : null;
            if (startYr && endYr) {
              return startYr <= selectedYear && endYr >= selectedYear;
            }
            return true;
          });

          // Find rounds they are directly involved in (Only round-level support/field roles) in the selected year
          const memberRounds = rounds.filter(round => {
            if (!round.is_active) return false;
            
            if (round.start_date) {
              const roundYear = new Date(round.start_date).getFullYear();
              if (roundYear !== selectedYear) return false;
            }

            // Directly on round
            const isSupport = round.support_manager_ids?.includes(member.id);
            const isField = round.field_manager_ids?.includes(member.id);

            return isSupport || isField;
          });

          // Calculate sub-statuses
          const preparedCount = memberRounds.filter(r => r.status === '준비중').length;
          const operatingCount = memberRounds.filter(r => r.status === '운영중').length;
          const completedCount = memberRounds.filter(r => r.status === '완료').length;
          const stoppedCount = memberRounds.filter(r => r.status === '보류' || r.status === '취소').length;

          // Missing satisfaction count for completed rounds they are involved in
          const missingSatCount = memberRounds.filter(r => r.status === '완료' && (r.satisfaction === null || r.satisfaction === undefined)).length;

          // Roles count (Project roles are calculated per project; round roles are calculated per round)
          let bizCount = 0;
          let pmCount = 0;
          let plCount = 0;
          let supportCount = 0;
          let fieldCount = 0;

          memberProjects.forEach(proj => {
            if (proj.business_manager_id === member.id) bizCount++;
            if (proj.pm_manager_id === member.id) pmCount++;
            if (proj.pl_manager_id === member.id) plCount++;
          });

          memberRounds.forEach(r => {
            if (r.support_manager_ids?.includes(member.id)) supportCount++;
            if (r.field_manager_ids?.includes(member.id)) fieldCount++;
          });

          // Monthly distribution
          const monthsCount = Array(12).fill(0);
          memberRounds.forEach(r => {
            if (r.start_date) {
              const m = new Date(r.start_date).getMonth();
              if (m >= 0 && m < 12) monthsCount[m]++;
            }
          });

          // Active and next month workload
          const thisMonthCount = memberRounds.filter(r => r.start_date && isInThisMonth(r.start_date)).length;
          const nextMonthCount = memberRounds.filter(r => r.start_date && isInNextMonth(r.start_date)).length;

          // Performance on completed items
          const completedWithData = memberRounds.filter(r => r.status === '완료');
          const totalHours = completedWithData.reduce((sum, r) => sum + (r.operation_hours || 0), 0);
          const totalParticipants = completedWithData.reduce((sum, r) => sum + (r.participant_count || 0), 0);
          
          const sq = completedWithData.filter(r => r.satisfaction !== null);
          const avgSatisfaction = sq.length > 0 
            ? (sq.reduce((sum, r) => sum + (r.satisfaction || 0), 0) / sq.length).toFixed(2)
            : '-';

          const isExpanded = expandedMemberId === member.id;

          return (
            <div 
              key={member.id} 
              id={`manager-card-${member.id}`}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              {/* Header card summary section */}
              <div 
                className="p-5 cursor-pointer flex flex-col lg:flex-row lg:items-center gap-4 justify-between"
                onClick={() => toggleExpand(member.id)}
              >
                {/* Profile detail */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-lg select-none shrink-0 border border-slate-200">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-lg">{member.name}</span>
                      <span className="text-xs bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                        {member.position}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10.5px] font-bold">
                      <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 shadow-3xs ${
                        memberRounds.length > 0
                          ? 'bg-rose-50 text-rose-700 border border-rose-100 font-black'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}>
                        🔥 배정 {memberRounds.length}개 차수
                      </span>
                      <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 shadow-3xs ${
                        memberProjects.length > 0
                          ? 'bg-cyan-50 text-cyan-700 border border-cyan-100 font-black'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}>
                        💼 참여 {memberProjects.length}개 프로젝트
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid stats overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 lg:max-w-xl">
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setMemberStatusFilters(prev => {
                        const nextVal = prev[member.id] === '준비중' ? null : '준비중';
                        if (nextVal) setExpandedMemberId(member.id);
                        return { ...prev, [member.id]: nextVal };
                      });
                    }}
                    className={`px-3 py-2 rounded-xl text-center border transition-all cursor-pointer select-none ${
                      memberStatusFilters[member.id] === '준비중'
                        ? 'bg-amber-100 border-amber-300 ring-2 ring-amber-150 font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-[10px] text-slate-400 font-semibold mb-0.5">준비중</span>
                    <span className="text-sm font-bold text-amber-600">{preparedCount}개</span>
                  </div>
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setMemberStatusFilters(prev => {
                        const nextVal = prev[member.id] === '운영중' ? null : '운영중';
                        if (nextVal) setExpandedMemberId(member.id);
                        return { ...prev, [member.id]: nextVal };
                      });
                    }}
                    className={`px-3 py-2 rounded-xl text-center border transition-all cursor-pointer select-none ${
                      memberStatusFilters[member.id] === '운영중'
                        ? 'bg-sky-100 border-sky-300 ring-2 ring-sky-150 font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-[10px] text-slate-400 font-semibold mb-0.5">운영중</span>
                    <span className="text-sm font-bold text-sky-600">{operatingCount}개</span>
                  </div>
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setMemberStatusFilters(prev => {
                        const nextVal = prev[member.id] === '완료' ? null : '완료';
                        if (nextVal) setExpandedMemberId(member.id);
                        return { ...prev, [member.id]: nextVal };
                      });
                    }}
                    className={`px-3 py-2 rounded-xl text-center border transition-all cursor-pointer select-none ${
                      memberStatusFilters[member.id] === '완료'
                        ? 'bg-emerald-100 border-emerald-300 ring-2 ring-emerald-150 font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-[10px] text-slate-400 font-semibold mb-0.5">운영완료</span>
                    <span className="text-sm font-bold text-emerald-600">{completedCount}개</span>
                  </div>

                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setMemberStatusFilters(prev => {
                        const nextVal = prev[member.id] === '미입력' ? null : '미입력';
                        if (nextVal) setExpandedMemberId(member.id);
                        return { ...prev, [member.id]: nextVal };
                      });
                    }}
                    className={`px-3 py-2 rounded-xl text-center border transition-all cursor-pointer select-none ${
                      memberStatusFilters[member.id] === '미입력'
                        ? 'bg-rose-100 border-rose-300 ring-2 ring-rose-150 font-bold shadow-xs'
                        : 'bg-rose-50/50 border border-rose-100 hover:bg-rose-100/30'
                    }`}
                  >
                    <span className="block text-[10px] text-rose-500 font-bold mb-0.5">만족도미입력</span>
                    <span className={`text-sm font-bold ${missingSatCount > 0 ? 'text-rose-600 font-black' : 'text-slate-400'}`}>
                      {missingSatCount}건
                    </span>
                  </div>
                </div>

                {/* Workload Indicator Icon / Expand */}
                <div className="flex items-center gap-3 lg:self-center self-end mt-2 lg:mt-0">
                  <div className="text-right">
                    <span className="text-[10px] block text-slate-400 font-sans tracking-tight">이번달 운영 로드</span>
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                      thisMonthCount > 2 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {thisMonthCount}개 차수
                    </span>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {/* Expandable Section */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-6">
                  
                  {/* Stats Detail Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Performance Column */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Star size={14} className="text-amber-500 shrink-0" />
                        완료 실적 통계
                      </h4>
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">누적 수료 인원</span>
                          <span className="font-bold text-slate-800 font-mono">{totalParticipants.toLocaleString()}명</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">누적 운영 시간</span>
                          <span className="font-bold text-slate-800 font-mono">{totalHours}시간</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2">
                          <span className="text-slate-600 font-semibold">평균 만족도 평점</span>
                          <span className="text-sm font-black text-slate-950 font-mono">
                            {avgSatisfaction === '-' ? '기록 없음' : `${avgSatisfaction} / 5.00`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Roles Statistics Column */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Layers size={14} className="text-indigo-500 shrink-0" />
                        배정 역할 통계 (클릭 시 필터링)
                      </h4>
                      <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px]">
                        <button
                          onClick={() => setMemberRoleFilters(prev => ({ ...prev, [member.id]: prev[member.id] === '사업담당' ? null : '사업담당' }))}
                          className={`p-1 rounded border transition-all cursor-pointer ${
                            memberRoleFilters[member.id] === '사업담당'
                              ? 'bg-slate-800 border-slate-900 text-white font-bold'
                              : 'bg-slate-50 border-slate-100 text-slate-850 hover:bg-slate-100'
                          }`}
                        >
                          <span className={`block mb-0.5 ${memberRoleFilters[member.id] === '사업담당' ? 'text-slate-300' : 'text-slate-400'}`}>사업담당</span>
                          <span className="font-bold text-xs">{bizCount}</span>
                        </button>
                        <button
                          onClick={() => setMemberRoleFilters(prev => ({ ...prev, [member.id]: prev[member.id] === 'PM' ? null : 'PM' }))}
                          className={`p-1 rounded border transition-all cursor-pointer ${
                            memberRoleFilters[member.id] === 'PM'
                              ? 'bg-slate-800 border-slate-900 text-white font-bold'
                              : 'bg-slate-50 border-slate-100 text-slate-850 hover:bg-slate-100'
                          }`}
                        >
                          <span className={`block mb-0.5 ${memberRoleFilters[member.id] === 'PM' ? 'text-slate-300' : 'text-slate-400'}`}>PM</span>
                          <span className="font-bold text-xs">{pmCount}</span>
                        </button>
                        <button
                          onClick={() => setMemberRoleFilters(prev => ({ ...prev, [member.id]: prev[member.id] === 'PL' ? null : 'PL' }))}
                          className={`p-1 rounded border transition-all cursor-pointer ${
                            memberRoleFilters[member.id] === 'PL'
                              ? 'bg-slate-800 border-slate-900 text-white font-bold'
                              : 'bg-slate-50 border-slate-100 text-slate-850 hover:bg-slate-100'
                          }`}
                        >
                          <span className={`block mb-0.5 ${memberRoleFilters[member.id] === 'PL' ? 'text-slate-300' : 'text-slate-400'}`}>PL</span>
                          <span className="font-bold text-xs">{plCount}</span>
                        </button>
                        <button
                          onClick={() => setMemberRoleFilters(prev => ({ ...prev, [member.id]: prev[member.id] === '메인' ? null : '메인' }))}
                          className={`p-1 rounded border transition-all cursor-pointer ${
                            memberRoleFilters[member.id] === '메인'
                              ? 'bg-sky-600 border-sky-700 text-white font-bold font-black'
                              : 'bg-sky-50 border-sky-100 text-sky-850 hover:bg-sky-100'
                          }`}
                        >
                          <span className={`block mb-0.5 ${memberRoleFilters[member.id] === '메인' ? 'text-sky-200' : 'text-sky-500'}`}>메인</span>
                          <span className="font-bold text-xs">{supportCount}</span>
                        </button>
                        <button
                          onClick={() => setMemberRoleFilters(prev => ({ ...prev, [member.id]: prev[member.id] === '운영지원' ? null : '운영지원' }))}
                          className={`p-1 rounded border transition-all cursor-pointer ${
                            memberRoleFilters[member.id] === '운영지원'
                              ? 'bg-indigo-600 border-indigo-700 text-white font-bold'
                              : 'bg-indigo-50 border-indigo-100 text-indigo-850 hover:bg-indigo-100'
                          }`}
                        >
                          <span className={`block mb-0.5 ${memberRoleFilters[member.id] === '운영지원' ? 'text-indigo-200' : 'text-indigo-500'}`}>운영지원</span>
                          <span className="font-bold text-xs">{fieldCount}</span>
                        </button>
                      </div>
                      <div className="mt-2 text-[10px] text-slate-400 text-center">
                        ※ 한 차수에 중복 배정되었을 경우 각각 산정됩니다.
                      </div>
                    </div>

                    {/* Workload Calendar Track Column */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Calendar size={14} className="text-emerald-500 shrink-0" />
                        연간 월간 차수 분포
                      </h4>
                      <div className="grid grid-cols-12 gap-1 items-end h-12 pt-2">
                        {monthsCount.map((count, i) => {
                          const heightPct = memberRounds.length > 0 
                            ? (count / Math.max(...monthsCount, 1)) * 100 
                            : 0;
                          return (
                            <div key={i} className="group relative flex flex-col items-center h-full justify-end">
                              {/* simple tooltip */}
                              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-900 text-white text-[9px] px-1 py-0.5 rounded font-mono z-10 whitespace-nowrap">
                                {i + 1}월: {count}개
                              </div>
                              <div 
                                className={`w-full rounded-xs transition-all duration-300 ${
                                  count > 0 ? 'bg-teal-500 hover:bg-teal-600' : 'bg-slate-100'
                                }`} 
                                style={{ height: count > 0 ? `${Math.max(heightPct, 10)}%` : '4px' }} 
                              />
                              <span className="block text-[8px] text-slate-400 font-mono mt-1 shrink-0">{i + 1}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Active Rounds List */}
                  {(() => {
                    const activeRoleFilter = memberRoleFilters[member.id] || null;
                    
                    let baseRounds = memberRounds;
                    if (activeRoleFilter === '사업담당' || activeRoleFilter === 'PM' || activeRoleFilter === 'PL') {
                      // Project role filter: gather all active rounds under projects they manage
                      baseRounds = rounds.filter(round => {
                        if (!round.is_active) return false;
                        if (round.start_date) {
                          const roundYear = new Date(round.start_date).getFullYear();
                          if (roundYear !== selectedYear) return false;
                        }
                        const parentProj = projects.find(p => p.id === round.project_id);
                        if (!parentProj) return false;
                        
                        if (activeRoleFilter === '사업담당') {
                          return parentProj.business_manager_id === member.id;
                        }
                        if (activeRoleFilter === 'PM') {
                          return parentProj.pm_manager_id === member.id;
                        }
                        if (activeRoleFilter === 'PL') {
                          return parentProj.pl_manager_id === member.id;
                        }
                        return false;
                      });
                    }

                    const displayedRounds = baseRounds.filter(round => {
                      if (!activeRoleFilter) return true;
                      if (activeRoleFilter === '메인') {
                        return round.support_manager_ids?.includes(member.id);
                      }
                      if (activeRoleFilter === '운영지원') {
                        return round.field_manager_ids?.includes(member.id);
                      }
                      return true;
                    });

                    return (
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                            <BookOpen size={14} className="text-slate-600" />
                            배정 세부 차수 명세 ({displayedRounds.length}건 / 전체 {memberRounds.length}건)
                          </h4>
                          {activeRoleFilter && (
                            <button
                              onClick={() => setMemberRoleFilters(prev => ({ ...prev, [member.id]: null }))}
                              className="text-[10px] text-rose-600 hover:text-rose-800 font-bold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded cursor-pointer transition-colors"
                            >
                              필터 해제 (전체보기)
                            </button>
                          )}
                        </div>
                        {displayedRounds.length === 0 ? (
                          <div className="text-xs text-slate-400 py-6 text-center">
                            현재 이 역할('<strong>{activeRoleFilter}</strong>')로 배정된 차수가 없습니다.
                          </div>
                        ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wide border-b border-slate-100">
                              <th className="py-2 px-3">고객사</th>
                              <th className="py-2 px-2">차수 / 세부과정</th>
                              <th className="py-2 px-2">일정</th>
                              <th className="py-2 px-2">장소유형 / 세부장소</th>
                              <th className="py-2 px-2">내 역할</th>
                              <th className="py-2 px-2 text-center">진행 상태</th>
                              <th className="py-2 px-2 text-center">만족도 실정</th>
                              <th className="py-2 p-2 text-right">작업</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {displayedRounds.map(round => {
                              const parentProj = projects.find(p => p.id === round.project_id);
                              
                              // Determine roles
                              const roles: string[] = [];
                              if (parentProj?.business_manager_id === member.id) roles.push('사업담당');
                              if (parentProj?.pm_manager_id === member.id) roles.push('PM');
                              if (parentProj?.pl_manager_id === member.id) roles.push('PL');
                              if (round.support_manager_ids?.includes(member.id)) roles.push('메인');
                              if (round.field_manager_ids?.includes(member.id)) roles.push('운영지원');

                              const hasSatisfaction = round.satisfaction !== null && round.satisfaction !== undefined;

                              const activeStatusFilter = memberStatusFilters[member.id] || null;
                              const isHighlighted = activeStatusFilter 
                                ? (activeStatusFilter === '미입력'
                                    ? (round.status === '완료' && (round.satisfaction === null || round.satisfaction === undefined))
                                    : round.status === activeStatusFilter)
                                : false;
                              const hasActiveFilter = activeStatusFilter !== null;

                              let trBgClass = "hover:bg-slate-50/50 transition-colors";
                              if (hasActiveFilter) {
                                if (isHighlighted) {
                                  trBgClass = activeStatusFilter === '미입력'
                                    ? 'bg-rose-50/90 font-semibold border-l-4 border-l-rose-500'
                                    : round.status === '완료' ? 'bg-emerald-50/90 font-semibold border-l-4 border-l-emerald-500' :
                                      round.status === '운영중' ? 'bg-sky-50/90 font-semibold border-l-4 border-l-sky-500' :
                                      'bg-amber-50/90 font-semibold border-l-4 border-l-amber-500';
                                } else {
                                  trBgClass = 'opacity-30 transition-opacity duration-200';
                                }
                              }

                              return (
                                <tr key={round.id} className={trBgClass}>
                                  <td className="py-2.5 px-3 font-semibold text-slate-800 text-xs">
                                    {parentProj?.client_name || '미지정'}
                                  </td>
                                  <td className="py-2.5 px-2">
                                    <div className="font-semibold text-slate-800">{round.round_name}</div>
                                    <div className="text-[10px] text-slate-400 truncate max-w-[200px]" title={parentProj?.project_name}>
                                      {parentProj?.project_name}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-2 font-mono whitespace-nowrap text-slate-500">
                                    <div className="flex items-center gap-1">
                                      <Calendar size={12} className="text-slate-400 shrink-0" />
                                      {round.start_date ? formatDateLabel(round.start_date, round.end_date) : '미지정'}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-2">
                                    <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-sm font-semibold mr-1.5 ${
                                      round.location_type === '온라인' ? 'bg-blue-50 text-blue-700' :
                                      round.location_type === '숙박' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'
                                    }`}>
                                      {round.location_type === '외근' ? '외근(1일)' : round.location_type === '숙박' ? '합숙(출장)' : round.location_type}
                                    </span>
                                    <span className="text-[11px] text-slate-500">{round.venue_detail || '상세 장소 없음'}</span>
                                  </td>
                                  <td className="py-2.5 px-2">
                                    <div className="flex flex-wrap gap-1">
                                      {roles.map((role, rIdx) => (
                                        <span 
                                          key={rIdx} 
                                          className={`text-[9px] px-1.5 py-0.2 rounded-xs font-semibold ${
                                            role === '메인' ? 'bg-sky-100 text-sky-800' :
                                            role === '운영지원' ? 'bg-indigo-100 text-indigo-800' :
                                            'bg-slate-200 text-slate-700'
                                          }`}
                                        >
                                          {role}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-2 text-center">
                                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                      round.status === '완료' ? 'bg-emerald-100 text-emerald-800' :
                                      round.status === '운영중' ? 'bg-sky-100 text-sky-800' :
                                      round.status === '준비중' ? 'bg-amber-100 text-amber-800' :
                                      'bg-gray-100 text-gray-500'
                                    }`}>
                                      {round.status}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-2 text-center">
                                    {round.status === '완료' ? (
                                      hasSatisfaction ? (
                                        <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">
                                          ★ {round.satisfaction?.toFixed(2)}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] bg-rose-50 border border-rose-100 text-rose-600 px-1 py-0.5 rounded-md font-bold animate-pulse inline-flex items-center gap-0.5">
                                          <AlertCircle size={10} /> 만족도 미입력
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-slate-400 font-mono">-</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-2 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {round.status === '완료' && onOpenSatisfactionModal && (
                                        <button 
                                          onClick={() => onOpenSatisfactionModal(round)}
                                          className="text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded"
                                        >
                                          만족도 입력
                                        </button>
                                      )}
                                      {parentProj && onOpenRoundModal && (
                                        <button 
                                          onClick={() => onOpenRoundModal(parentProj, round)}
                                          className="text-[11px] text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
                                        >
                                          수정
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}

                </div>
              )}
            </div>
          );
          })
        )}
      </div>
    </div>
  );
}

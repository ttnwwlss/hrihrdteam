import React, { useState } from 'react';
import { Project, Round, Member } from '../../types';
import { 
  Users, 
  Star, 
  MapPin, 
  Calendar, 
  AlertCircle, 
  Plus, 
  Edit, 
  ChevronDown, 
  ChevronUp, 
  ClipboardCheck, 
  MoreHorizontal,
  Layers,
  Sparkles
} from 'lucide-react';
import { formatDateLabel } from '../../utils/dateUtils';

interface KanbanBoardProps {
  projects: Project[];
  rounds: Round[];
  members: Member[];
  onOpenProjectModal: (project?: Project) => void;
  onOpenRoundModal: (project: Project, round?: Round) => void;
  onOpenChecklistModal: (project: Project, round?: Round) => void;
  onOpenSatisfactionModal: (round: Round) => void;
}

export default function KanbanBoard({
  projects,
  rounds,
  members,
  onOpenProjectModal,
  onOpenRoundModal,
  onOpenChecklistModal,
  onOpenSatisfactionModal
}: KanbanBoardProps) {
  // 5 distinct status columns
  const [activeTab, setActiveTab] = useState<'all' | '준비중' | '운영중' | '완료' | '취소' | '보류'>('all');

  const allColumns = [
    {
      id: '준비중',
      title: '준비중',
      statuses: ['준비중'] as string[],
      color: 'border-t-amber-500 bg-slate-50/40',
      headerBadge: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: '운영중',
      title: '운영중',
      statuses: ['운영중'] as string[],
      color: 'border-t-sky-500 bg-slate-50/40',
      headerBadge: 'bg-sky-100 text-sky-800 border-sky-200',
    },
    {
      id: '완료',
      title: '완료',
      statuses: ['완료'] as string[],
      color: 'border-t-emerald-500 bg-slate-50/40',
      headerBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      id: '취소',
      title: '취소',
      statuses: ['취소'] as string[],
      color: 'border-t-rose-500 bg-rose-50/20',
      headerBadge: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    {
      id: '보류',
      title: '보류',
      statuses: ['보류'] as string[],
      color: 'border-t-purple-500 bg-purple-50/30',
      headerBadge: 'bg-purple-100 text-purple-800 border-purple-200',
    }
  ];

  const displayedColumns = activeTab === 'all' 
    ? allColumns 
    : allColumns.filter(col => col.id === activeTab);

  // Store expanded state for rounds list in cards
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleRoundsExpand = (projectId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case '준비중': return 'text-amber-700 bg-amber-50 border-amber-200';
      case '운영중': return 'text-sky-700 bg-sky-50 border-sky-200';
      case '완료': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case '보류': return 'text-purple-700 bg-purple-50 border-purple-200';
      case '취소': return 'text-rose-700 bg-rose-50 border-rose-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            📋 단계별 과정운영 보드
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            상위 프로젝트를 진행 단계별(준비, 운영, 완료, 취소, 보류)로 구분하여 보드로 시각화합니다. 탭 메뉴를 통해 특정 단계만 선택하여 보실 수 있습니다.
          </p>
        </div>
      </div>

      {/* Kanban Tab Controller Mode Switcher */}
      <div className="flex flex-wrap gap-1.5 bg-slate-250 bg-slate-200/80 p-1.5 rounded-2xl w-fit border border-slate-300/60 shadow-3xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          🌐 전체 단계 보드 ({allColumns.reduce((sum, col) => sum + projects.filter(p => col.statuses.includes(p.status) && p.is_active).length, 0)}건)
        </button>
        {allColumns.map(col => {
          const count = projects.filter(p => col.statuses.includes(p.status) && p.is_active).length;
          return (
            <button
              key={col.id}
              onClick={() => setActiveTab(col.id as any)}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === col.id
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span>{col.title}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === col.id
                  ? 'bg-slate-700 text-slate-100'
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Board Scroll Wrapper */}
      <div className="w-full pb-2">
        <div 
          id="kanban-columns-container" 
          className="flex flex-col gap-5 w-full"
        >
          {displayedColumns.map(column => {
            // Get projects belonging to this group
            const laneProjects = projects.filter(p => column.statuses.includes(p.status as any) && p.is_active);

            const getBorderTopColor = (id: string) => {
              switch (id) {
                case '준비중': return 'border-t-amber-500';
                case '운영중': return 'border-t-sky-500';
                case '완료': return 'border-t-emerald-500';
                case '취소': return 'border-t-rose-500';
                case '보류': return 'border-t-purple-500';
                default: return 'border-t-slate-350';
              }
            };

            return (
              <div 
                key={column.id} 
                id={`kanban-column-${column.id}`}
                className={`rounded-3xl border-t-[4px] border border-slate-200 p-5 flex flex-col bg-slate-50/20 ${getBorderTopColor(column.id)}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${column.headerBadge}`}>
                      {column.title}
                    </span>
                    <span className="text-xs font-bold text-slate-500 font-mono">
                      {laneProjects.length}건
                    </span>
                  </div>
                  {(column.id === '준비중') && (
                    <button 
                      onClick={() => onOpenProjectModal()}
                      className="p-1.5 hover:bg-slate-150 text-slate-500 hover:text-slate-800 rounded bg-white border border-slate-200 cursor-pointer flex items-center justify-center transition-colors shadow-3xs"
                      title="신규 프로젝트 추가"
                    >
                      <Plus size={14} className="stroke-[2.5]" />
                    </button>
                  )}
                </div>

                {/* Lane Cards Stack / Grid flow based on view mode */}
                <div 
                  className={
                    activeTab === 'all'
                      ? "flex flex-row overflow-x-auto gap-4.5 pb-3 pt-1 scrollbar-thin select-none w-full"
                      : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5 pt-1.5 select-none w-full"
                  }
                >
                  {laneProjects.length === 0 ? (
                    <div className="text-center py-10 w-full bg-white/40 border border-dashed border-slate-200 rounded-2xl text-[11px] text-slate-400 font-bold col-span-full">
                      해당되는 프로젝트가 없습니다
                    </div>
                  ) : (
                    laneProjects.map(project => {
                      // Gather all rounds for this project
                      const projectRounds = rounds.filter(r => r.project_id === project.id && r.is_active);
                      const completedRounds = projectRounds.filter(r => r.status === '완료');
                      
                      const totalParticipants = completedRounds.reduce((sum, r) => sum + (r.participant_count || 0), 0);
                      const satisfies = completedRounds.filter(r => r.satisfaction !== null);
                      const avgSatisfaction = satisfies.length > 0 
                        ? (satisfies.reduce((sum, r) => sum + (r.satisfaction || 0), 0) / satisfies.length).toFixed(2)
                        : '-';

                      // Round list folding threshold
                      const showAllRounds = expandedCards[project.id] || false;
                      const visibleRounds = showAllRounds ? projectRounds : projectRounds.slice(0, 2);

                      return (
                        <div 
                          key={project.id} 
                          id={`kanban-card-${project.id}`}
                          className={`bg-white p-4.5 rounded-2xl border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-200 shadow-3xs flex flex-col ${
                            activeTab === 'all' ? 'w-[315px] shrink-0' : 'w-full'
                          }`}
                        >
                          {/* Meta Category and Option actions */}
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <div className="flex gap-1.5 items-center">
                              <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#0e7490] font-mono bg-cyan-50 px-1.5 py-0.5 rounded-md border border-cyan-100">
                                {project.project_type || '과정운영'}
                              </span>
                              <span className={`text-[9.5px] uppercase font-bold px-1.5 py-0.5 rounded-md ${
                                project.location_type === '온라인' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                project.location_type === '숙박' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {project.location_type === '외근' ? '외근(1일)' : project.location_type === '숙박' ? '합숙(출장)' : project.location_type}
                              </span>
                            </div>
                            
                            {/* Exact status representation */}
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${getStatusBadge(project.status)}`}>
                              {project.status}
                            </span>
                          </div>

                          {/* Title of project */}
                          <h4 className="font-bold text-slate-900 text-xs mt-2 line-clamp-2 leading-snug">
                            {project.project_name}
                          </h4>

                          {/* Client details */}
                          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 pb-2 border-b border-slate-100 font-mono">
                            <span className="font-semibold text-slate-700 bg-slate-50 border px-1 rounded-xs">
                              {project.client_name}
                            </span>
                            <span>
                              {project.start_month} ~ {project.end_month}
                            </span>
                          </div>

                          {/* Summary specifications */}
                          <div className="grid grid-cols-2 gap-2 mt-2.5 text-[10px] text-slate-500 pb-2 border-b border-slate-100">
                            <div>
                              <span className="block text-slate-400 font-sans">누적 교육인원</span>
                              <span className="font-bold text-slate-800 font-mono">{totalParticipants}명</span>
                            </div>
                            <div>
                              <span className="block text-slate-400 font-sans">평균 만족도</span>
                              <span className="font-bold text-slate-800 font-mono">★ {avgSatisfaction}</span>
                            </div>
                          </div>

                          {/* SUB ROUNDS 명세 */}
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                세부 차수 현황 ({projectRounds.length}개)
                              </span>
                              <button
                                onClick={() => onOpenRoundModal(project)}
                                className="text-[9px] hover:bg-slate-100 text-cyan-600 hover:text-cyan-800 border border-slate-200 bg-white px-2 py-0.5 rounded-sm font-bold flex items-center gap-0.5"
                              >
                                <Plus size={8} /> 차수 추가
                              </button>
                            </div>

                            {projectRounds.length === 0 ? (
                              <p className="text-[10px] text-slate-400 italic text-center py-2 bg-slate-50 rounded">
                                세부 차수가 없습니다.
                              </p>
                            ) : (
                              <div className="space-y-1.5">
                                {visibleRounds.map(round => {
                                  const hasSatisfaction = round.satisfaction !== null && round.satisfaction !== undefined;
                                  const isRoundCompleted = round.status === '완료';

                                  // Find Field Manager involved
                                  const fields = round.field_manager_ids?.map(fid => members.find(m => m.id === fid)?.name).filter(Boolean).join(', ') || '미배정';

                                  return (
                                    <div 
                                      key={round.id} 
                                      className={`p-2 rounded-lg border text-[11px] space-y-1 ${
                                        round.status === '완료' ? 'bg-emerald-50/50 border-emerald-100' :
                                        round.status === '운영중' ? 'bg-sky-50/50 border-sky-100' :
                                        round.status === '준비중' ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="font-bold text-slate-800 leading-tight">
                                          [{round.round_no}차] {round.round_name}
                                        </span>
                                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full ${
                                          round.status === '완료' ? 'bg-emerald-100 text-emerald-800' :
                                          round.status === '운영중' ? 'bg-sky-100 text-sky-800' :
                                          'bg-amber-100 text-amber-800'
                                        }`}>
                                          {round.status}
                                        </span>
                                      </div>

                                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                        <span>
                                          {round.start_date ? formatDateLabel(round.start_date, round.end_date) : '미정'}
                                        </span>
                                        <span className="text-slate-600 block max-w-[120px] truncate">
                                          운영지원: {fields}
                                        </span>
                                      </div>

                                      {/* Satisfaction badge or Missing badge trigger */}
                                      {isRoundCompleted && (
                                        <div className="flex items-center justify-between pt-1 border-t border-slate-100/30">
                                          {hasSatisfaction ? (
                                            <span className="text-[9px] text-emerald-700 font-bold font-mono">
                                              ★ {round.satisfaction?.toFixed(2)} / {round.instructor_satisfaction?.toFixed(1)}(강)
                                            </span>
                                          ) : (
                                            <button 
                                              onClick={() => onOpenSatisfactionModal(round)}
                                              className="text-[9px] text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-100 rounded px-1.5 py-0.2 font-black animate-pulse flex items-center gap-0.5"
                                            >
                                              <AlertCircle size={8} /> 만족도 미입력
                                            </button>
                                          )}
                                          <button
                                            onClick={() => onOpenChecklistModal(project, round)}
                                            className="text-[9px] text-slate-400 hover:text-slate-600 flex items-center gap-0.4"
                                          >
                                            체크리스트
                                          </button>
                                        </div>
                                      )}

                                      {!isRoundCompleted && (
                                        <div className="flex items-center justify-between pt-1 border-t border-slate-100/30 text-[9px] text-slate-400 font-mono">
                                          <span>장소: {round.venue_detail || '미정'}</span>
                                          <button 
                                            onClick={() => onOpenChecklistModal(project, round)}
                                            className="text-[9px] text-slate-400 hover:text-slate-600 flex items-center gap-0.4 cursor-pointer"
                                          >
                                            체크리스트
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {projectRounds.length > 2 && (
                            <button
                              onClick={() => toggleRoundsExpand(project.id)}
                              className="w-full mt-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              {showAllRounds ? (
                                <>접기 <ChevronUp size={10} /></>
                              ) : (
                                <>더보기 ({projectRounds.length - 2}개 더보기) <ChevronDown size={10} /></>
                              )}
                            </button>
                          )}

                          {/* Special remarks if any */}
                          {project.notes && (
                            <div className="mt-3 bg-amber-50/50 p-2 border border-amber-100 rounded-lg text-[10px] text-slate-600 leading-snug">
                              <span className="font-bold text-amber-800 block text-[9px] mb-0.5 font-sans">운영 특이사항</span>
                              <p className="line-clamp-2">{project.notes}</p>
                            </div>
                          )}

                          {/* Card bottom actions (Edit details) */}
                          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between shrink-0">
                            <button
                              onClick={() => onOpenChecklistModal(project)}
                              className="bg-slate-50 text-[10px] border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold px-2 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <ClipboardCheck size={12} /> 프로젝트 체크리스트
                            </button>

                            <button
                              onClick={() => onOpenProjectModal(project)}
                              className="bg-cyan-50 hover:bg-cyan-100 border border-cyan-100 text-cyan-800 text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <Edit size={12} /> 프로젝트 편집
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

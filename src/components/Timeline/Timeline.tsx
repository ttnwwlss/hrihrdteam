import React, { useState } from 'react';
import { Project, Round, Member } from '../../types';
import { formatDateLabel } from '../../utils/dateUtils';
import { Calendar, User, MapPin, ChevronRight, Info, Plus } from 'lucide-react';

interface TimelineProps {
  selectedYear: number;
  projects: Project[];
  rounds: Round[];
  members: Member[];
  onOpenRoundModal?: (project: Project, round?: Round) => void;
  onOpenProjectModal?: (project?: Project) => void;
}

export default function Timeline({
  selectedYear,
  projects,
  rounds,
  members,
  onOpenRoundModal,
  onOpenProjectModal
}: TimelineProps) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Filter projects and rounds that have events in the selectedYear
  const activeProjects = projects.filter(p => {
    if (!p.is_active) return false;
    const startYr = p.start_month ? parseInt(p.start_month.split('-')[0], 10) : null;
    const endYr = p.end_month ? parseInt(p.end_month.split('-')[0], 10) : null;
    if (startYr && endYr) {
      return startYr <= selectedYear && endYr >= selectedYear;
    }
    return true;
  });

  const getRoundsForProjectAndMonth = (projectId: string, month: number) => {
    return rounds.filter(r => {
      if (r.project_id !== projectId || !r.is_active) return false;
      if (!r.start_date) return false;
      const d = new Date(r.start_date);
      return d.getFullYear() === selectedYear && (d.getMonth() + 1) === month;
    });
  };

  const getRoundsForMonth = (month: number) => {
    return rounds.filter(r => {
      if (!r.is_active || !r.start_date) return false;
      const d = new Date(r.start_date);
      return d.getFullYear() === selectedYear && (d.getMonth() + 1) === month;
    });
  };

  // Monthly stats helper
  const getMonthlyLoadCount = (month: number) => {
    return getRoundsForMonth(month).length;
  };

  // Helper to draw gantt bar offsets
  // E.g. start_month = "2026-03" -> start from column 3
  const getProjectTimelineSpan = (p: Project) => {
    const startYr = p.start_month ? parseInt(p.start_month.split('-')[0], 10) : selectedYear;
    const startM = p.start_month ? parseInt(p.start_month.split('-')[1], 10) : 1;
    const endYr = p.end_month ? parseInt(p.end_month.split('-')[0], 10) : selectedYear;
    const endM = p.end_month ? parseInt(p.end_month.split('-')[1], 10) : 12;

    let colStart = 1;
    let colEnd = 12;

    if (startYr < selectedYear) {
      colStart = 1;
    } else if (startYr === selectedYear) {
      colStart = startM;
    } else {
      return null; // Lies in future
    }

    if (endYr > selectedYear) {
      colEnd = 12;
    } else if (endYr === selectedYear) {
      colEnd = endM;
    } else {
      return null; // Lies in past
    }

    return { start: colStart, end: colEnd };
  };

  const selectedMonthRounds = selectedMonth ? getRoundsForMonth(selectedMonth) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            📅 [{selectedYear}년] 과정운영 연간 타임라인
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            월별 프로젝트 기간(스팬)과 실제 차수 운영 일정을 오버뷰합니다. 각 월별 헤더를 클릭하여 월별 상세 차수를 파악하세요.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 text-xs">
          <Info size={14} className="shrink-0" />
          <span>월 헤더 클릭 시 월간 세부 차수 조회가 전환됩니다.</span>
        </div>
      </div>

      {/* TIMELINE GRID CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="min-w-[900px] p-5">
          
          {/* Grid Headers: Projects Info Cols + 12 Month Col Grid */}
          <div className="grid grid-cols-16 gap-2 border-b border-slate-200 pb-3 mb-4 text-center">
            <div className="col-span-4 text-left font-bold text-xs text-slate-500 uppercase tracking-wide px-2">
              프로젝트 과정 및 고객사
            </div>
            {months.map(m => {
              const count = getMonthlyLoadCount(m);
              const isSelected = selectedMonth === m;
              return (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(selectedMonth === m ? null : m)}
                  className={`col-span-1 rounded-xl p-2 transition-all duration-200 flex flex-col justify-between items-center ${
                    isSelected 
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-100' 
                      : count > 0 
                      ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200' 
                      : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[11px] font-black">{m}월</span>
                  <span className={`text-[10px] block mt-1 font-bold ${
                    isSelected ? 'text-white' : count > 0 ? 'text-blue-600' : 'text-slate-300'
                  }`}>
                    {count > 0 ? `${count}차` : '-'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Timeline Rows for each Project */}
          {activeProjects.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              {selectedYear}년에 예정된 과정운영 프로젝트가 존재하지 않습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {activeProjects.map(p => {
                const span = getProjectTimelineSpan(p);
                if (!span) return null;

                const bizManager = members.find(m => m.id === p.business_manager_id);
                const pmManager = members.find(m => m.id === p.pm_manager_id);

                return (
                  <div key={p.id} className="grid grid-cols-16 gap-2 items-center hover:bg-slate-50/50 p-1.5 rounded-xl transition-all duration-250">
                    
                    {/* Project Left Name Card */}
                    <div className="col-span-4 pr-3">
                      <div 
                        onClick={() => onOpenProjectModal?.(p)}
                        className="font-bold text-slate-900 text-xs leading-tight line-clamp-1 cursor-pointer hover:text-cyan-600 hover:underline transition-colors" 
                        title={`${p.project_name} (클릭 시 상세 조회/수정)`}
                      >
                        {p.project_name}
                      </div>
                      <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px] text-slate-400 w-full">
                        <span className="font-mono bg-slate-100 px-1 rounded text-slate-600 font-semibold">{p.client_name}</span>
                        <span>•</span>
                        <span className="font-mono text-[9px] text-slate-500 bg-slate-50 border border-slate-200 px-1 rounded">
                          {p.start_month} ~ {p.end_month}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 mr-1">
                          <User size={10} /> {pmManager ? `${pmManager.name}(PM)` : bizManager ? `${bizManager.name}(담당)` : '미지정'}
                        </span>
                        {onOpenRoundModal && (
                          <button
                            onClick={() => onOpenRoundModal(p)}
                            className="ml-auto text-[9px] hover:bg-slate-100 text-cyan-600 hover:text-cyan-800 border border-slate-200 bg-white px-2 py-0.5 rounded-md font-bold cursor-pointer flex items-center gap-0.5 transition-colors shadow-3xs"
                            title="이 과정에 새 차수 추가"
                          >
                            <Plus size={10} className="stroke-[2.5]" />
                            <span>차수 추가</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Timeline Column Bar Grid */}
                    <div className="col-span-12 grid grid-cols-12 gap-2 h-9 relative">
                      
                      {/* Timeline Gantt Background Span Bar (Slim Highlighter Line) */}
                      <div 
                        className="absolute h-1.5 top-[15px] rounded-full transition-all duration-300 pointer-events-none z-0"
                        style={{
                          left: `${((span.start - 1) / 12) * 100}%`,
                          right: `${((12 - span.end) / 12) * 100}%`,
                          backgroundColor: p.status === '운영중' ? '#e0f2fe' : 
                                           p.status === '완료' ? '#d1fae5' : 
                                           p.status === '준비중' ? '#fef3c7' : 
                                           '#f1f5f9',
                          marginLeft: '4px',
                          marginRight: '4px'
                        }}
                        title={`${p.project_name} (${p.start_month} ~ ${p.end_month}) [상태: ${p.status}]`}
                      />

                      {/* Floating dots / indicators for specific Rounds inside Month Columns */}
                      {months.map(m => {
                        const roundsInMonth = getRoundsForProjectAndMonth(p.id, m);
                        return (
                          <div key={m} className="col-span-1 flex items-center justify-center relative z-10 h-full pointer-events-auto">
                            {roundsInMonth.length > 0 && (
                              <div className="flex gap-0.5 max-w-full">
                                {roundsInMonth.map((round) => (
                                  <div
                                    key={round.id}
                                    className={`w-2.5 h-2.5 rounded-full cursor-pointer hover:scale-130 transition-transform shadow-xs ${
                                      round.status === '완료' ? 'bg-emerald-500' :
                                      round.status === '운영중' ? 'bg-sky-500' :
                                      round.status === '준비중' ? 'bg-amber-500' : 'bg-gray-400'
                                    }`}
                                    title={`[${round.round_no}차수] ${round.round_name} (${round.start_date}) - Click header month to view details`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMonth(m);
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* SELECTED MONTH DETAIL MODAL/DRAWER PANEL */}
      {selectedMonth && (
        <div 
          id={`selected-month-panel-${selectedMonth}`} 
          className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 transition-all duration-300"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="text-blue-600 shrink-0" size={18} />
              <h4 className="font-bold text-slate-800 text-sm">
                📌 {selectedMonth}월 세부 운영 차수 주간 명세 ({selectedMonthRounds.length}건)
              </h4>
            </div>
            <button 
              onClick={() => setSelectedMonth(null)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg"
            >
              닫기
            </button>
          </div>

          {selectedMonthRounds.length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center bg-white rounded-xl border border-dashed">
              선택하신 {selectedMonth}월에는 교육 예정인 차수 일정이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedMonthRounds.map(r => {
                const parentProj = projects.find(p => p.id === r.project_id);
                const isCompleted = r.status === '완료';
                const hasSat = r.satisfaction !== null;
                const pl = members.find(m => m.id === parentProj?.pl_manager_id);
                const fieldList = r.field_manager_ids?.map(fid => members.find(m => m.id === fid)?.name).filter(Boolean).join(', ') || '미지정';

                return (
                  <div key={r.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1.5">
                        <div>
                          <span className="text-[10px] bg-slate-100 font-bold text-slate-500 px-2 py-0.5 rounded-sm">
                            {parentProj?.client_name || '임시'}
                          </span>
                          <h5 className="font-bold text-slate-900 text-xs mt-1.5 leading-snug">
                            [{r.round_no}차수] {r.round_name}
                          </h5>
                          <span className="text-[10px] text-slate-400 block truncate" title={parentProj?.project_name}>
                            {parentProj?.project_name}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          r.status === '완료' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          r.status === '운영중' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                          r.status === '준비중' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-50 text-slate-400'
                        }`}>
                          {r.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3.5 border-t border-slate-100 text-[11px] text-slate-500 font-sans">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400 shrink-0" />
                          <span>{r.start_date ? formatDateLabel(r.start_date, r.end_date) : '미정'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate" title={r.venue_detail}>{r.venue_detail || '장소 미입력'}</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-slate-400">운영지원:</span>
                          <span className="font-medium text-slate-700">{fieldList}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px]">
                        {isCompleted ? (
                          hasSat ? (
                            <span className="font-semibold text-emerald-600 font-mono">
                              ★ 전반 만족도: {r.satisfaction?.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-rose-500 font-bold bg-rose-50 px-1.5 py-0.5 rounded-md text-[10px]">
                              만족도 미입력
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 font-mono">가용 시간 {r.operation_hours || 0}H</span>
                        )}
                      </div>
                      
                      {parentProj && onOpenRoundModal && (
                        <button 
                          onClick={() => onOpenRoundModal(parentProj, r)}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 hover:underline"
                        >
                          차수 정보 상세 조회 <ChevronRight size={12} />
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FOOTER TIMELINE LEGEND */}
      <div className="flex flex-wrap gap-4 px-2 text-[11px] text-slate-400 font-medium">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>준비중 차수</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          <span>운영중 차수</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>완료 차수</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-450 bg-gray-400" />
          <span>보류/취소 차수</span>
        </div>
      </div>

    </div>
  );
}

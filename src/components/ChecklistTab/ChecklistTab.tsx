import React, { useState, useEffect } from 'react';
import { Project, Round, ChecklistItem } from '../../types';
import { dbService } from '../../services/dbService';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  Percent, 
  ChevronDown, 
  ChevronUp, 
  Briefcase, 
  BookOpen,
  ClipboardCheck,
  Filter
} from 'lucide-react';

interface ChecklistTabProps {
  projects: Project[];
  rounds: Round[];
  checklistItems: ChecklistItem[];
  onUpdateChecklist: () => void;
}

export default function ChecklistTab({
  projects,
  rounds,
  checklistItems,
  onUpdateChecklist
}: ChecklistTabProps) {
  const [newTitles, setNewTitles] = useState<Record<string, string>>({});
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const toggleProjectExpand = (id: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleToggleCheck = async (item: ChecklistItem) => {
    const updated = { ...item, is_done: !item.is_done };
    await dbService.saveChecklist(updated);
    onUpdateChecklist();
  };

  const handleAddItem = async (projectId: string | null, roundId: string | null, key: string, e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitles[key]?.trim();
    if (!title) return;

    const currentItemsCount = checklistItems.filter(item => 
      item.is_active && 
      item.project_id === projectId && 
      item.round_id === roundId
    ).length;

    const newItem: ChecklistItem = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      project_id: projectId,
      round_id: roundId,
      title,
      is_done: false,
      sort_order: currentItemsCount + 1,
      is_active: true
    };

    await dbService.saveChecklist(newItem);
    setNewTitles(prev => ({ ...prev, [key]: '' }));
    onUpdateChecklist();
  };

  const handleDeleteItem = async (id: string) => {
    await dbService.deleteChecklist(id);
    onUpdateChecklist();
  };

  const activeProjects = projects.filter(p => p.is_active);

  // Set default selected project to the first active project on load or when filtered projects change
  useEffect(() => {
    if (activeProjects.length > 0) {
      const isStillAvailable = activeProjects.some(p => p.id === selectedProjectId);
      if (!selectedProjectId || !isStillAvailable) {
        setSelectedProjectId(activeProjects[0].id);
      }
    } else {
      setSelectedProjectId('');
    }
  }, [projects, selectedProjectId]);

  const displayedProjects = selectedProjectId 
    ? activeProjects.filter(p => p.id === selectedProjectId)
    : activeProjects;

  // Global active checklist items statistics
  const activeProjectIds = activeProjects.map(p => p.id);
  const activeRoundIds = rounds.filter(r => r.is_active && activeProjectIds.includes(r.project_id)).map(r => r.id);
  const totalActiveChecklists = checklistItems.filter(item => {
    if (!item.is_active) return false;
    if (item.project_id && !item.round_id) {
      return activeProjectIds.includes(item.project_id);
    }
    if (item.round_id) {
      return activeRoundIds.includes(item.round_id);
    }
    return false;
  });
  const totalCount = totalActiveChecklists.length;
  const doneCount = totalActiveChecklists.filter(item => item.is_done).length;
  const overallRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Calculate urgent rounds (starts in next 7 days, KST, but has uncompleted checklist items or 0 items)
  const kstOffset = 9 * 60 * 60 * 1000;
  const todayStr = new Date(Date.now() + kstOffset).toISOString().slice(0, 10);
  const nextWeekLimit = new Date(Date.now() + kstOffset + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const urgentRounds = rounds.filter(round => {
    if (!round.is_active || round.status === '완료' || round.status === '취소') return false;
    if (!round.start_date) return false;
    
    const isUpcoming = round.start_date >= todayStr && round.start_date <= nextWeekLimit;
    if (!isUpcoming) return false;
    
    const roundItems = checklistItems.filter(item => item.is_active && item.round_id === round.id);
    const hasUncompleted = roundItems.some(item => !item.is_done) || roundItems.length === 0;
    
    return hasUncompleted;
  });

  return (
    <div className="space-y-6">
      {/* Title & Filter dropdown row */}
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          📋 운영 준비 체크리스트
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          각 과정 공통 및 세부 교육 차수별 운영 준비사항을 관리합니다.
        </p>
      </div>

      {/* Global Checklist Status Widget */}
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-3xl p-5 text-white shadow-sm shadow-cyan-100/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-cyan-100 flex items-center gap-1.5">
            <Percent size={14} />
            과정 통합 전체 운영 준비율
          </h4>
          <p className="text-sm font-extrabold leading-normal">
            활성화된 전체 과정의 {totalCount}개 태스크 중 {doneCount}개 준비가 완료되었습니다.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <span className="text-2xl font-black font-mono tracking-tight">{overallRate}%</span>
            <p className="text-[10px] text-cyan-200 font-bold opacity-80 mt-0.5">({doneCount} / {totalCount} 완료)</p>
          </div>
          <div className="w-24 md:w-32 bg-white/20 rounded-full h-2.5 overflow-hidden border border-white/10">
            <div 
              className="bg-white h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${overallRate}%` }}
            />
          </div>
        </div>
      </div>


      {/* Urgent Warning Board */}
      {urgentRounds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 space-y-3 shadow-3xs animate-pulse-subtle">
          <h4 className="text-xs font-black text-rose-800 flex items-center gap-1.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
            </span>
            🚨 긴급 점검 필요 일정 (D-7일 이내 교육 시작)
          </h4>
          <p className="text-[10px] text-rose-600 font-semibold leading-normal">
            다음 주에 교육이 시작되지만 아직 체크리스트가 다 완료되지 않은 긴급 건입니다. 강의 세팅 및 운영준비 상태를 서둘러 점검해 주세요!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {urgentRounds.map(round => {
              const project = projects.find(p => p.id === round.project_id);
              const roundItems = checklistItems.filter(item => item.is_active && item.round_id === round.id);
              const doneCount = roundItems.filter(item => item.is_done).length;
              const totalCount = roundItems.length;
              
              const diffTime = new Date(round.start_date).getTime() - new Date(todayStr).getTime();
              const dDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              return (
                <div 
                  key={round.id} 
                  onClick={() => {
                    if (project) setSelectedProjectId(project.id);
                  }}
                  className="bg-white border border-rose-100 hover:border-rose-350 rounded-2xl p-3.5 flex items-center justify-between shadow-3xs hover:shadow-xs transition-all cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md">D-{dDay}</span>
                      <span className="text-[10px] text-slate-500 font-bold">{project?.client_name}</span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                      [{round.round_no}차] {round.round_name}
                    </h5>
                    <p className="text-[9px] text-slate-400 font-medium">
                      시작일: {round.start_date} ({round.venue_detail || '장소 미지정'})
                    </p>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-rose-600 font-mono">
                      {totalCount > 0 ? `${Math.round((doneCount / totalCount) * 100)}%` : '0%'}
                    </span>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                      완료 {doneCount}/{totalCount}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Project selector chips */}
      <div className="flex flex-wrap gap-2.5 pb-2">
        <button
          onClick={() => setSelectedProjectId('')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all border cursor-pointer flex items-center gap-1.5 shadow-3xs hover:scale-98 active:scale-95 duration-100 ${
            selectedProjectId === ''
              ? 'bg-cyan-600 border-cyan-600 text-white shadow-sm shadow-cyan-100'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-355'
          }`}
        >
          <span>🌐 전체 과정 ({activeProjects.length}개)</span>
        </button>
        {activeProjects.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedProjectId(p.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all border cursor-pointer flex items-center gap-2 shadow-3xs hover:scale-98 active:scale-95 duration-100 ${
              selectedProjectId === p.id
                ? 'bg-cyan-600 border-cyan-600 text-white shadow-sm shadow-cyan-100'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black tracking-tight ${
              selectedProjectId === p.id
                ? 'bg-cyan-700 text-cyan-50'
                : 'bg-slate-100 text-slate-500'
            }`}>
              {p.client_name}
            </span>
            <span className="truncate max-w-[180px] sm:max-w-[260px]">{p.project_name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5">
        {displayedProjects.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-3xl text-xs text-slate-400 font-bold">
            {selectedProjectId ? '선택하신 프로젝트는 현재 비활성화되어 있거나 찾을 수 없습니다.' : '현재 활성화된 프로젝트가 없습니다.'}
          </div>
        ) : (
          displayedProjects.map(project => {
            const projectRounds = rounds.filter(r => r.project_id === project.id && r.is_active);
            
            const projectItems = checklistItems.filter(item => 
              item.is_active && 
              item.project_id === project.id && 
              (!item.round_id)
            );
            const projectDone = projectItems.filter(i => i.is_done).length;
            const projectTotal = projectItems.length;

            const allRoundItems = checklistItems.filter(item => 
              item.is_active && 
              projectRounds.some(r => r.id === item.round_id)
            );
            const roundDone = allRoundItems.filter(i => i.is_done).length;
            const roundTotal = allRoundItems.length;

            const combinedDone = projectDone + roundDone;
            const combinedTotal = projectTotal + roundTotal;
            const combinedRate = combinedTotal > 0 ? Math.round((combinedDone / combinedTotal) * 100) : 0;
            const isExpanded = expandedProjects[project.id] ?? true;

            return (
              <div 
                key={project.id} 
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200"
              >
                <div 
                  onClick={() => toggleProjectExpand(project.id)}
                  className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-100/40 border-b border-slate-200/80"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-200/60 border border-slate-300/60 flex items-center justify-center text-slate-700">
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800 text-[11px] bg-slate-200 px-1.5 py-0.5 rounded-md">{project.client_name}</span>
                        <h4 className="font-bold text-slate-900 text-sm">{project.project_name}</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                        전체 태스크 {combinedTotal}개 중 {combinedDone}개 준비 완료 ({projectRounds.length}개 차수 포함)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-40 md:w-48 space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-655 text-slate-500 font-mono">
                        <span>종합 준비율</span>
                        <span>{combinedRate}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden border border-slate-350/10">
                        <div 
                          className="bg-cyan-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${combinedRate}%` }}
                        />
                      </div>
                    </div>
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-3xs">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50/20 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                    
                    <div className="space-y-4 pb-6 lg:pb-0">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-black text-slate-850 text-slate-800 flex items-center gap-1.5">
                          <ClipboardCheck size={15} className="text-cyan-650 text-cyan-655 text-cyan-600 animate-pulse" />
                          과정 공통/총괄 체크 사항 ({projectDone}/{projectTotal})
                        </h5>
                        {projectTotal > 0 && (
                          <span className="text-[10px] font-bold text-cyan-655 text-cyan-600 font-mono">{Math.round((projectDone/projectTotal)*100)}%</span>
                        )}
                      </div>

                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                        {projectItems.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic text-center py-8 bg-slate-100/50 rounded-2xl border border-dashed border-slate-200">
                            공통 체크사항이 없습니다. 아래 입력칸에서 추가하세요.
                          </p>
                        ) : (
                          projectItems.map(item => (
                            <div 
                              key={item.id} 
                              className={`flex items-center justify-between p-3 rounded-xl border transition-all shadow-3xs ${
                                item.is_done 
                                  ? 'bg-cyan-50/30 border-cyan-100 hover:bg-cyan-50/50' 
                                  : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-355 hover:border-slate-300'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleCheck(item)}
                                className="flex items-center gap-2.5 text-xs text-left text-slate-700 font-medium flex-1 cursor-pointer"
                              >
                                {item.is_done ? (
                                  <CheckSquare size={17} className="text-cyan-650 text-cyan-600 shrink-0" />
                                ) : (
                                  <Square size={17} className="text-slate-300 shrink-0 hover:text-slate-400" />
                                )}
                                <span className={`transition-all ${
                                  item.is_done 
                                    ? 'line-through text-slate-400 font-normal' 
                                    : 'text-slate-800 font-extrabold'
                                }`}>
                                  {item.title}
                                </span>
                              </button>
                              <button 
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-slate-350 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      <form 
                        onSubmit={(e) => handleAddItem(project.id, null, `p_${project.id}`, e)} 
                        className="flex gap-2"
                      >
                        <input 
                          type="text"
                          value={newTitles[`p_${project.id}`] || ''}
                          onChange={(e) => setNewTitles(prev => ({ ...prev, [`p_${project.id}`]: e.target.value }))}
                          placeholder="공통 준비물 추가..."
                          className="flex-1 text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-cyan-600 bg-white"
                        />
                        <button 
                          type="submit"
                          className="bg-slate-800 hover:bg-slate-900 text-white font-bold p-2 px-3.5 rounded-xl text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <Plus size={14} /> 추가
                        </button>
                      </form>
                    </div>

                    <div className="space-y-4 pt-6 lg:pt-0 lg:pl-6">
                      <h5 className="text-xs font-black text-slate-850 text-slate-800 flex items-center gap-1.5">
                        <BookOpen size={15} className="text-cyan-600" />
                        교육 차수별 세부 체크 사항 ({roundDone}/{roundTotal})
                      </h5>

                      {projectRounds.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic text-center py-12 bg-slate-100/50 rounded-2xl border border-dashed border-slate-200">
                          개설된 세부 차수가 없습니다.
                        </p>
                      ) : (
                        <div className="space-y-4.5 max-h-[380px] overflow-y-auto pr-1">
                          {projectRounds.map(round => {
                            const roundItems = checklistItems.filter(item => 
                              item.is_active && 
                              item.round_id === round.id
                            );
                            const rDone = roundItems.filter(i => i.is_done).length;
                            const rTotal = roundItems.length;
                            const rRate = rTotal > 0 ? Math.round((rDone/rTotal)*100) : 0;

                            const inputKey = `r_${round.id}`;

                            return (
                              <div key={round.id} className="bg-slate-100/60 p-4 rounded-2xl border border-slate-200/80 space-y-3 shadow-3xs">
                                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                                  <span className="font-extrabold text-slate-850 text-slate-800 text-[11px]">
                                    [{round.round_no}차] {round.round_name}
                                  </span>
                                  {rTotal > 0 ? (
                                    <span className="text-[10px] font-black text-cyan-655 text-cyan-600 font-mono bg-cyan-50 border border-cyan-100 px-1.5 py-0.5 rounded">
                                      {rRate}% ({rDone}/{rTotal})
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-slate-400 font-bold">준비 등록 없음</span>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  {roundItems.map(item => (
                                    <div 
                                      key={item.id} 
                                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all shadow-3xs ${
                                        item.is_done 
                                          ? 'bg-cyan-50/20 border-cyan-100 hover:bg-cyan-50/40' 
                                          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                      }`}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => handleToggleCheck(item)}
                                        className="flex items-center gap-2.5 text-xs text-left text-slate-700 font-medium flex-1 cursor-pointer"
                                      >
                                        {item.is_done ? (
                                          <CheckSquare size={16} className="text-cyan-600 shrink-0" />
                                        ) : (
                                          <Square size={16} className="text-slate-300 shrink-0 hover:text-slate-400" />
                                        )}
                                        <span className={`transition-all ${
                                          item.is_done 
                                            ? 'line-through text-slate-400 font-normal' 
                                            : 'text-slate-800 font-extrabold'
                                        }`}>
                                          {item.title}
                                        </span>
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="text-slate-350 hover:text-rose-500 p-0.5 cursor-pointer"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                <form 
                                  onSubmit={(e) => handleAddItem(null, round.id, inputKey, e)}
                                  className="flex gap-1.5 pt-1"
                                >
                                  <input 
                                    type="text"
                                    value={newTitles[inputKey] || ''}
                                    onChange={(e) => setNewTitles(prev => ({ ...prev, [inputKey]: e.target.value }))}
                                    placeholder="차수 체크 추가..."
                                    className="flex-1 text-[11px] border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-600"
                                  />
                                  <button 
                                    type="submit"
                                    className="bg-slate-700 hover:bg-slate-800 text-white font-bold p-1.5 px-3.5 rounded-lg text-[10px] shrink-0 cursor-pointer"
                                  >
                                    등록
                                  </button>
                                </form>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

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

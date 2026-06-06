import React, { useState, useEffect } from 'react';
import { Project, Member } from '../../types';
import { X, AlertTriangle, ShieldCheck, EyeOff, Eye } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  onDelete: (id: string) => void;
  project?: Project; // If editing
  members: Member[];
}

export default function ProjectModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  project,
  members
}: ProjectModalProps) {
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [projectType, setProjectType] = useState('출강');
  const [startMonth, setStartMonth] = useState('2026-06');
  const [endMonth, setEndMonth] = useState('2026-06');
  const [locationType, setLocationType] = useState<'온라인' | '외근' | '숙박'>('온라인');
  const [status, setStatus] = useState<'준비중' | '운영중' | '완료' | '보류' | '취소'>('준비중');
  const [businessManagerId, setBusinessManagerId] = useState('');
  const [pmManagerId, setPmManagerId] = useState('');
  const [plManagerId, setPlManagerId] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  // States for deleting verification
  const [isDeletingMode, setIsDeletingMode] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Synchronize on edit mode
  useEffect(() => {
    if (project) {
      setProjectName(project.project_name || '');
      setClientName(project.client_name || '');
      setTargetAudience(project.target_audience || '');
      setProjectType(project.project_type || '출강');
      setStartMonth(project.start_month || '2026-06');
      setEndMonth(project.end_month || '2026-06');
      setLocationType(project.location_type || '온라인');
      setStatus(project.status || '준비중');
      setBusinessManagerId(project.business_manager_id || '');
      setPmManagerId(project.pm_manager_id || '');
      setPlManagerId(project.pl_manager_id || '');
      setNotes(project.notes || '');
      setIsActive(project.is_active !== undefined ? project.is_active : true);
    } else {
      // Defaults for a new project
      setProjectName('');
      setClientName('');
      setTargetAudience('');
      setProjectType('출강');
      const now = new Date();
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setStartMonth(currentMonthStr);
      setEndMonth(currentMonthStr);
      setLocationType('온라인');
      setStatus('준비중');
      setBusinessManagerId('');
      setPmManagerId('');
      setPlManagerId('');
      setNotes('');
      setIsActive(true);
    }
    // Reset deleting sub-states
    setIsDeletingMode(false);
    setDeleteConfirmName('');
    setDeletePassword('');
    setDeleteError('');
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      alert('프로젝트명은 필수 항목입니다.');
      return;
    }
    const updated: Project = {
      id: project?.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      project_name: projectName.trim(),
      client_name: clientName.trim() || '일반고객',
      target_audience: targetAudience.trim(),
      project_type: projectType,
      start_month: startMonth,
      end_month: endMonth,
      location_type: locationType,
      status,
      business_manager_id: businessManagerId || null,
      pm_manager_id: pmManagerId || null,
      pl_manager_id: plManagerId || null,
      notes: notes.trim(),
      sort_order: project?.sort_order || 999,
      is_active: isActive
    };
    onSave(updated);
    onClose();
  };

  const handleDeleteSubmit = () => {
    setDeleteError('');
    if (deleteConfirmName !== projectName) {
      setDeleteError('프로젝트명(삭제 대상명)이 정확하게 일치하지 않습니다.');
      return;
    }
    if (deletePassword !== 'hrd2025') {
      setDeleteError('비밀번호가 올바르지 않습니다.');
      return;
    }

    if (project?.id) {
      onDelete(project.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div 
        id="project-edit-modal-content"
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">
            {project ? '🛠️ 프로젝트 운영 정보 수정' : '🆕 신규 과정운영 프로젝트 등록'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal views switch: Deleting prompt vs Registration form */}
        {isDeletingMode ? (
          <div className="p-6 space-y-6">
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex gap-3">
              <AlertTriangle className="shrink-0 text-rose-600 mt-0.5" size={24} />
              <div className="text-xs">
                <h4 className="font-bold text-rose-900 text-sm mb-1">⚠️ 데이터 원천 삭제 주의</h4>
                <p className="leading-snug">
                  삭제된 데이터(프로젝트와 이에 달린 모든 하위 세부 차수 기록)는 복구가 불가능할 수 있습니다. 
                  단순히 화면에서 가리고 비활성화하려면 삭제 대신 <strong className="font-extrabold text-slate-800">숨김 처리(비활성화)</strong> 설정을 사용하세요!
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  삭제 확인 대상명 입력:
                </label>
                <input 
                  type="text" 
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder={projectName}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 font-bold bg-slate-50 focus:bg-white text-slate-800"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  프로젝트명 "<strong>{projectName}</strong>" 을 오타 없이 똑같이 적어주세요.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  관리자 삭제 비밀번호 (Password):
                </label>
                <input 
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  삭제 비밀번호는 <code className="font-mono bg-slate-100 px-1 py-0.2 rounded font-bold text-rose-700">hrd2025</code> 입니다.
                </span>
              </div>

              {deleteError && (
                <div className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-100 p-3 rounded-lg flex items-center gap-2">
                  <ShieldCheck size={14} />
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsDeletingMode(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                취소 (돌아가기)
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
              >
                영구 삭제 확인
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Project Name & Client Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  프로젝트명 (과정명) <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="예: 반도체 공무 핵심인재 육성 리더십 과정"
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  고객사명 / 위탁사 <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="예: SK하이닉스"
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5"
                />
              </div>
            </div>

            {/* Target Audience & Project Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  교육 대상층
                </label>
                <input 
                  type="text" 
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="예: 신임 선임 / 책임연구원"
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  프로젝트 타입분류
                </label>
                <select 
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:bg-white bg-slate-50"
                >
                  <option value="출강">출강</option>
                  <option value="위탁">위탁</option>
                </select>
              </div>
            </div>

            {/* Start Month, End Month & Location type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  운영 시작월
                </label>
                <input 
                  type="month" 
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  운영 종료월
                </label>
                <input 
                  type="month" 
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  종합 장소유형
                </label>
                <select 
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:bg-white bg-slate-50"
                >
                  <option value="온라인">온라인 (비대면)</option>
                  <option value="외근">외근(1일)</option>
                  <option value="숙박">합숙(출장)</option>
                </select>
              </div>
            </div>

            {/* PM / PL / Business manager assignments */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  사업 담당업무 PM
                </label>
                <select 
                  value={businessManagerId}
                  onChange={(e) => setBusinessManagerId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 bg-slate-50"
                >
                  <option value="">미정</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.position})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  과정운영 총괄 PM
                </label>
                <select 
                  value={pmManagerId}
                  onChange={(e) => setPmManagerId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 bg-slate-50"
                >
                  <option value="">미정</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.position})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  운영 실무자 PL
                </label>
                <select 
                  value={plManagerId}
                  onChange={(e) => setPlManagerId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 bg-slate-50"
                >
                  <option value="">미정</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.position})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status & is_active */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  프로젝트 종합 진행상태
                </label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:bg-white bg-slate-50"
                >
                  <option value="준비중">준비중 (운영 대기)</option>
                  <option value="운영중">운영중 (과정 진행)</option>
                  <option value="완료">완료 (행정 완료)</option>
                  <option value="보류">보류 (일시 연기)</option>
                  <option value="취소">취소 (폐강/종료)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  숨김 처리 여부 (노출 비활성화)
                </label>
                <div className="flex items-center gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold transition-all duration-200 ${
                      isActive 
                        ? 'bg-slate-50 border-slate-300 text-slate-700' 
                        : 'bg-rose-50 border-rose-200 text-rose-700 font-extrabold'
                    }`}
                  >
                    {isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    {isActive ? '활성화 상태 (기본 노출)' : '숨김 상태 (보관함 보관)'}
                  </button>
                </div>
              </div>
            </div>

            {/* Special remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                특이사항 / 현장 메모 (비고)
              </label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="예: 고객사와 체결한 교안 저작권 명의 확인 필요. 수강인원 90명 초과 시 연수실 분할 대안 검토"
                rows={3}
                className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:bg-white bg-slate-50 font-sans"
              />
            </div>

            {/* Footer buttons */}
            <div className="border-t border-slate-100 pt-4 flex gap-2 justify-between items-center">
              {project ? (
                <button
                  type="button"
                  onClick={() => setIsDeletingMode(true)}
                  className="bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 px-3.5 py-2 rounded-xl text-xs font-extrabold"
                >
                  과정 영구 삭제
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-cyan-700 hover:bg-cyan-800 rounded-xl shadow-xs"
                >
                  {project ? '수정 내용 저장' : '새 프로젝트 등록'}
                </button>
              </div>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}

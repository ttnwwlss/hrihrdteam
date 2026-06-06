import React, { useState, useEffect } from 'react';
import { Project, Round, Member } from '../../types';
import { X, AlertTriangle, ShieldCheck, Copy, CheckCircle } from 'lucide-react';
import { formatDateLabel } from '../../utils/dateUtils';

interface RoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (round: Round) => void;
  onCopy: (round: Round, originalRoundId: string) => void;
  onDelete: (id: string) => void;
  project: Project; // Parent Project
  round?: Round; // If editing
  members: Member[];
  rounds: Round[];
}

export default function RoundModal({
  isOpen,
  onClose,
  onSave,
  onCopy,
  onDelete,
  project,
  round,
  members,
  rounds
}: RoundModalProps) {
  const [roundNo, setRoundNo] = useState(1);
  const [roundName, setRoundName] = useState('');
  const [startDate, setStartDate] = useState('2026-06-06');
  const [endDate, setEndDate] = useState('2026-06-06');
  const [status, setStatus] = useState<Round['status']>('준비중');
  const [locationType, setLocationType] = useState<Round['location_type']>('온라인');
  const [venueDetail, setVenueDetail] = useState('');
  const [selectedSupportIds, setSelectedSupportIds] = useState<string[]>([]);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [roundMemo, setRoundMemo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [operationHours, setOperationHours] = useState(8);
  const [participantCount, setParticipantCount] = useState(0);
  
  // Satisfaction metrics
  const [satisfaction, setSatisfaction] = useState<string>('');
  const [instructorSatisfaction, setInstructorSatisfaction] = useState<string>('');
  const [operationSatisfaction, setOperationSatisfaction] = useState<string>('');

  const [isActive, setIsActive] = useState(true);

  // Deleting authentication
  const [isDeletingMode, setIsDeletingMode] = useState(false);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Synchronize on load/change
  useEffect(() => {
    if (round) {
      setRoundNo(round.round_no || 1);
      setRoundName(round.round_name || '');
      setStartDate(round.start_date || '2026-06-06');
      setEndDate(round.end_date || '2026-06-06');
      setStatus(round.status || '준비중');
      setLocationType(round.location_type || '온라인');
      setVenueDetail(round.venue_detail || '');
      setSelectedSupportIds(round.support_manager_ids || []);
      setSelectedFieldIds(round.field_manager_ids || []);
      setRoundMemo(round.round_memo || '');
      setRemarks(round.remarks || '');
      setOperationHours(round.operation_hours !== undefined ? round.operation_hours : 8);
      setParticipantCount(round.participant_count !== undefined ? round.participant_count : 0);
      
      setSatisfaction(round.satisfaction !== null && round.satisfaction !== undefined ? String(round.satisfaction) : '');
      setInstructorSatisfaction(round.instructor_satisfaction !== null && round.instructor_satisfaction !== undefined ? String(round.instructor_satisfaction) : '');
      setOperationSatisfaction(round.operation_satisfaction !== null && round.operation_satisfaction !== undefined ? String(round.operation_satisfaction) : '');
      
      setIsActive(round.is_active !== undefined ? round.is_active : true);
    } else {
      // Create defaults for a new Round
      setRoundNo(1);
      setRoundName('');
      setStartDate('2026-06-06');
      setEndDate('2026-06-06');
      setStatus('준비중');
      setLocationType(project.location_type || '온라인');
      setVenueDetail('');
      setSelectedSupportIds([]);
      setSelectedFieldIds([]);
      setRoundMemo('');
      setRemarks('');
      setOperationHours(8);
      setParticipantCount(0);
      setSatisfaction('');
      setInstructorSatisfaction('');
      setOperationSatisfaction('');
      setIsActive(true);
    }
    // Clean deletes
    setIsDeletingMode(false);
    setDeleteConfirmTitle('');
    setDeletePassword('');
    setDeleteError('');
  }, [round, project, isOpen]);

  if (!isOpen) return null;

  const handleSupportCheck = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedSupportIds(prev => [...prev, id]);
    } else {
      setSelectedSupportIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleFieldCheck = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedFieldIds(prev => [...prev, id]);
    } else {
      setSelectedFieldIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roundName.trim()) {
      alert('세부 차수명 또는 주간과정 타이틀을 입력하세요.');
      return;
    }

    // Process float parsing
    const satValue = satisfaction.trim() !== '' ? parseFloat(satisfaction) : null;
    const instSatValue = instructorSatisfaction.trim() !== '' ? parseFloat(instructorSatisfaction) : null;
    const operSatValue = operationSatisfaction.trim() !== '' ? parseFloat(operationSatisfaction) : null;

    if (satValue !== null && (isNaN(satValue) || satValue < 0 || satValue > 5)) {
      alert('전반 만족도는 0에서 5 사이여야 합니다.');
      return;
    }
    if (instSatValue !== null && (isNaN(instSatValue) || instSatValue < 0 || instSatValue > 5)) {
      alert('강사 만족도는 0에서 5 사이여야 합니다.');
      return;
    }
    if (operSatValue !== null && (isNaN(operSatValue) || operSatValue < 0 || operSatValue > 5)) {
      alert('운영 만족도는 0에서 5 사이여야 합니다.');
      return;
    }

    const payload: Round = {
      id: round?.id || `rnd_${String(Date.now())}_${Math.random().toString(36).substring(2, 9)}`,
      project_id: project.id,
      round_no: Number(roundNo),
      round_name: roundName.trim(),
      start_date: startDate,
      end_date: endDate,
      date_label: formatDateLabel(startDate, endDate),
      status,
      location_type: locationType,
      venue_detail: venueDetail.trim(),
      support_manager_ids: selectedSupportIds,
      field_manager_ids: selectedFieldIds,
      round_memo: roundMemo.trim(),
      remarks: remarks.trim(),
      operation_hours: Number(operationHours) || 0,
      participant_count: Number(participantCount) || 0,
      satisfaction: satValue,
      instructor_satisfaction: instSatValue,
      operation_satisfaction: operSatValue,
      is_active: isActive
    };

    onSave(payload);
    onClose();
  };

  const handleCopyAction = () => {
    const payload: Round = {
      id: `rnd_copy_${String(Date.now())}_${Math.random().toString(36).substring(2, 9)}`,
      project_id: project.id,
      round_no: Number(roundNo) + 1, // Auto increment round index
      round_name: `${roundName} (복사본)`,
      start_date: startDate,
      end_date: endDate,
      date_label: formatDateLabel(startDate, endDate),
      status: '준비중', // Reset stats on copy
      location_type: locationType,
      venue_detail: venueDetail.trim(),
      support_manager_ids: selectedSupportIds,
      field_manager_ids: selectedFieldIds,
      round_memo: roundMemo.trim(),
      remarks: '',
      operation_hours: Number(operationHours) || 8,
      participant_count: 0, // Reset participant metrics
      satisfaction: null,   // Reset satisfaction metrics
      instructor_satisfaction: null,
      operation_satisfaction: null,
      is_active: true
    };
    if (round?.id) {
      onCopy(payload, round.id);
    }
    onClose();
  };

  const handleDeleteSubmit = () => {
    setDeleteError('');
    if (deleteConfirmTitle !== roundName) {
      setDeleteError('차수 대상명이 정확하지 않습니다.');
      return;
    }
    if (deletePassword !== 'hrd2025') {
      setDeleteError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (round?.id) {
      onDelete(round.id);
      onClose();
    }
  };

  const uniqueVenues = Array.from(
    new Set(
      rounds
        ?.map(r => r.venue_detail?.trim())
        .filter(Boolean)
    )
  ).sort();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-500 mb-1 inline-block">
              상위 프로젝트: {project.project_name} ({project.client_name})
            </span>
            <h3 className="font-bold text-slate-900 text-sm truncate">
              {round ? `🛠️ [${roundNo}차수] 세부 차수 정보 수정` : `🆕 신규 세부 과정/차수 등록`}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Delete view vs Main view */}
        {isDeletingMode ? (
          <div className="p-6 space-y-6">
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex gap-3">
              <AlertTriangle className="shrink-0 text-rose-600 mt-0.5" size={24} />
              <div className="text-xs">
                <h4 className="font-bold text-rose-900 text-sm mb-1">⚠️ 세부 차수 삭제 경고</h4>
                <p className="leading-snug">
                  해당 세부 차수 데이터가 영구히 제거됩니다. 
                  대시보드와 담당자별 업무 로드 통계에서 이 차수가 제외되며 복구하기 힘듭니다. 
                  임시 제외를 하려면 차수 상태를 <strong className="font-bold text-slate-900">비활성화(숨김)</strong> 처리해 보관하시기 바랍니다!
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  삭제 대상 차수명 확인 입력:
                </label>
                <input 
                  type="text" 
                  value={deleteConfirmTitle}
                  onChange={(e) => setDeleteConfirmTitle(e.target.value)}
                  placeholder={roundName}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 font-bold bg-slate-50 text-slate-800 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  차수명 "<strong>{roundName}</strong>" 을 오타 없이 똑같이 적어주세요.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  삭제 확인 비밀번호:
                </label>
                <input 
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  삭제 비밀번호는 <code className="font-mono bg-slate-100 px-1 font-bold text-rose-700">hrd2025</code> 입니다.
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
                차수 영구 삭제 승인
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
            
            {/* Round Name & No */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  차수 번호 <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="number" 
                  required
                  min={1}
                  value={roundNo}
                  onChange={(e) => setRoundNo(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  세부 차수명/과정 타이틀 <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                  placeholder="예: 2차수 - 소자 불량분석 실전 과정"
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5"
                />
              </div>
            </div>

            {/* Dates & Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  교육 시작일
                </label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  교육 종료일
                </label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  진행 상태
                </label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:bg-white bg-slate-50"
                >
                  <option value="준비중">준비중 (대기)</option>
                  <option value="운영중">운영중 (진행)</option>
                  <option value="완료">완료 (행정 완료)</option>
                  <option value="보류">보류</option>
                  <option value="취소">취소</option>
                </select>
              </div>
            </div>

            {/* Location Type & Venue detail */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  세부 장소유형
                </label>
                <select 
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:bg-white bg-slate-50"
                >
                  <option value="온라인">온라인</option>
                  <option value="서울">서울</option>
                  <option value="경기">경기</option>
                  <option value="인천">인천</option>
                  <option value="강원">강원</option>
                  <option value="충북">충북</option>
                  <option value="충남">충남</option>
                  <option value="대전">대전</option>
                  <option value="세종">세종</option>
                  <option value="전북">전북</option>
                  <option value="전남">전남</option>
                  <option value="광주">광주</option>
                  <option value="경북">경북</option>
                  <option value="경남">경남</option>
                  <option value="대구">대구</option>
                  <option value="울산">울산</option>
                  <option value="부산">부산</option>
                  <option value="제주">제주</option>
                  <option value="숙박">합숙(출장)</option>
                  <option value="외근">외근(1일)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  세부 운영 장소명
                </label>
                <input 
                  type="text" 
                  value={venueDetail}
                  onChange={(e) => setVenueDetail(e.target.value)}
                  placeholder="예: 경기 이천 수펙스홀 2층 혹은 줌 라이브 4개 분반"
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5"
                  list="venues-list"
                />
                <datalist id="venues-list">
                  {uniqueVenues.map((v, idx) => (
                    <option key={idx} value={v} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Support and Field Manager Checklist selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border mb-2 uppercase tracking-wide">
                  📋 메인 담당자 배정 (중복 가능)
                </label>
                <div className="grid grid-cols-2 gap-2 bg-white border border-slate-200 p-2.5 rounded-xl max-h-[140px] overflow-y-auto">
                  {members.map(m => (
                    <label key={m.id} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer p-0.5 hover:bg-slate-50 rounded">
                      <input 
                        type="checkbox"
                        checked={selectedSupportIds.includes(m.id)}
                        onChange={(e) => handleSupportCheck(m.id, e.target.checked)}
                        className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5"
                      />
                      <span className="truncate">{m.name} ({m.position})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border mb-2 uppercase tracking-wide">
                  🏃 운영지원 담당자 배정 (중복 가능)
                </label>
                <div className="grid grid-cols-2 gap-2 bg-white border border-slate-200 p-2.5 rounded-xl max-h-[140px] overflow-y-auto">
                  {members.map(m => (
                    <label key={m.id} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer p-0.5 hover:bg-slate-50 rounded">
                      <input 
                        type="checkbox"
                        checked={selectedFieldIds.includes(m.id)}
                        onChange={(e) => handleFieldCheck(m.id, e.target.checked)}
                        className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5"
                      />
                      <span className="truncate">{m.name} ({m.position})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance metrics (Operational hours & participant count) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  운영 시간 (Hours / H)
                </label>
                <input 
                  type="number" 
                  min={0}
                  value={operationHours}
                  onChange={(e) => setOperationHours(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  실 수료 교육인원 (명)
                </label>
                <input 
                  type="number" 
                  min={0}
                  value={participantCount}
                  onChange={(e) => setParticipantCount(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5"
                />
              </div>
            </div>

            {/* Satisfaction fields */}
            <div className={`p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-200 ${
              status !== '완료' ? 'opacity-50 hover:opacity-90' : 'bg-emerald-50/20 border-emerald-100'
            }`}>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-600" />
                <span className="text-xs font-bold text-slate-700">인풋 관리: 교육만족도 입력</span>
                {status !== '완료' && (
                  <span className="text-[10px] text-slate-400 font-semibold">(준비중/운영중 차수는 교육 완료 시 주로 등록합니다)</span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    전반 교육 만족도 (0.00 ~ 5.00)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    max="5"
                    value={satisfaction}
                    onChange={(e) => setSatisfaction(e.target.value)}
                    placeholder="예: 4.85"
                    className="w-full text-xs border border-slate-300 rounded-xl px-2.5 py-2 text-center"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    강사 만족도 평점 (0.00 ~ 5.00)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    max="5"
                    value={instructorSatisfaction}
                    onChange={(e) => setInstructorSatisfaction(e.target.value)}
                    placeholder="예: 4.90"
                    className="w-full text-xs border border-slate-300 rounded-xl px-2.5 py-2 text-center"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    운영 및 교재 평점 (0.00 ~ 5.00)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    max="5"
                    value={operationSatisfaction}
                    onChange={(e) => setOperationSatisfaction(e.target.value)}
                    placeholder="예: 4.75"
                    className="w-full text-xs border border-slate-300 rounded-xl px-2.5 py-2 text-center"
                  />
                </div>
              </div>
            </div>

            {/* Memo & Remarks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  차수 운영지원 메모
                </label>
                <textarea 
                  value={roundMemo}
                  onChange={(e) => setRoundMemo(e.target.value)}
                  placeholder="예: 강의실 인터넷 대역폭 체크, 다과 및 현수막 이천 발주 진행"
                  rows={2}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  소감 및 사후 비고(수익등)
                </label>
                <textarea 
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="예: 우수 수료자 상품 시상 및 설문조사 결과 고객사 공유 완료"
                  rows={2}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>
            </div>

            {/* Hidden visibility */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 font-semibold">
                <input 
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                />
                <span>이 차수를 활성화하여 화면에 표시합니다. (체크 해제 시 숨김 보존)</span>
              </label>
            </div>

            {/* Action buttons */}
            <div className="border-t border-slate-100 pt-4 flex gap-2 justify-between items-center">
              <div className="flex gap-2">
                {round ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsDeletingMode(true)}
                      className="bg-rose-50 text-rose-650 border border-slate-250 text-rose-600 hover:bg-rose-100 px-3 py-2 rounded-xl text-xs font-extrabold"
                    >
                      차수 영구 삭제
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyAction}
                      className="bg-sky-50 text-sky-800 border border-sky-100 hover:bg-sky-100 px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1"
                      title="이 차수의 정보(담당자, 장소, 메모 등)를 복제하여 새 차수를 신속하게 개설합니다."
                    >
                      <Copy size={12} /> 차수 복사
                    </button>
                  </>
                ) : (
                  <div />
                )}
              </div>

              <div className="flex gap-2 font-sans">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  취소(닫기)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-xs"
                >
                  {round ? '차수 정보 저장' : '등록'}
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}

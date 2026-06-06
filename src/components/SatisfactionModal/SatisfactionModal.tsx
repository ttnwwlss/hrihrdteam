import React, { useState, useEffect } from 'react';
import { Round } from '../../types';
import { X, Award, Percent, Star, MessageSquare } from 'lucide-react';

interface SatisfactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (satisfactionData: {
    roundId: string;
    satisfaction: number | null;
    instructorSatisfaction: number | null;
    operationSatisfaction: number | null;
    remarks: string;
  }) => void;
  round?: Round;
}

export default function SatisfactionModal({
  isOpen,
  onClose,
  onSave,
  round
}: SatisfactionModalProps) {
  const [satisfaction, setSatisfaction] = useState<string>('');
  const [instructorSatisfaction, setInstructorSatisfaction] = useState<string>('');
  const [operationSatisfaction, setOperationSatisfaction] = useState<string>('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (round) {
      setSatisfaction(round.satisfaction !== null && round.satisfaction !== undefined ? String(round.satisfaction) : '');
      setInstructorSatisfaction(round.instructor_satisfaction !== null && round.instructor_satisfaction !== undefined ? String(round.instructor_satisfaction) : '');
      setOperationSatisfaction(round.operation_satisfaction !== null && round.operation_satisfaction !== undefined ? String(round.operation_satisfaction) : '');
      setRemarks(round.remarks || '');
    }
  }, [round, isOpen]);

  if (!isOpen || !round) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const satVal = satisfaction.trim() !== '' ? parseFloat(satisfaction) : null;
    const instVal = instructorSatisfaction.trim() !== '' ? parseFloat(instructorSatisfaction) : null;
    const operVal = operationSatisfaction.trim() !== '' ? parseFloat(operationSatisfaction) : null;

    if (satVal !== null && (isNaN(satVal) || satVal < 0 || satVal > 5)) {
      alert('전반 만족도는 0과 5 사이의 소수여야 합니다.');
      return;
    }
    if (instVal !== null && (isNaN(instVal) || instVal < 0 || instVal > 5)) {
      alert('강사 만족도는 0과 5 사이의 소수여야 합니다.');
      return;
    }
    if (operVal !== null && (isNaN(operVal) || operVal < 0 || operVal > 5)) {
      alert('운영 및 교재 만족도는 0과 5 사이의 소수여야 합니다.');
      return;
    }

    onSave({
      roundId: round.id,
      satisfaction: satVal,
      instructorSatisfaction: instVal,
      operationSatisfaction: operVal,
      remarks: remarks.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full scale-100 p-6 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-sm">
              사후 품질 만족도 관리
            </span>
            <h3 className="font-bold text-slate-900 text-sm mt-1">
              ⭐ 만족도 추후 입력 / 평점 기록
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Selected round description */}
        <div className="bg-slate-50 p-3.5 border border-slate-200 rounded-2xl text-xs space-y-1">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">
            대상 교육 차수
          </span>
          <span className="font-bold text-slate-800 block text-xs">
            {round.round_name}
          </span>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1">
            <span>수리시간: {round.operation_hours || 0}H</span>
            <span>수료인원: {round.participant_count || 0}명</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Star size={12} className="text-amber-500 fill-amber-500" />
                1. 전반 교육 만족도 평점 (0.00 ~ 5.00)
              </label>
              <input 
                type="number"
                step="0.01"
                min="0"
                max="5"
                value={satisfaction}
                onChange={(e) => setSatisfaction(e.target.value)}
                placeholder="예: 4.86"
                className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 text-center font-bold text-slate-800"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                ※ 수강생 교육만족 설문지 종합 전반적인 평점입니다.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Award size={12} className="text-emerald-500" />
                2. 강사 전달 및 콘텐츠 평점 (0.00 ~ 5.00)
              </label>
              <input 
                type="number"
                step="0.01"
                min="0"
                max="5"
                value={instructorSatisfaction}
                onChange={(e) => setInstructorSatisfaction(e.target.value)}
                placeholder="예: 4.90"
                className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Percent size={12} className="text-blue-500" />
                3. 운영 지원 및 교재 평점 (0.00 ~ 5.00)
              </label>
              <input 
                type="number"
                step="0.01"
                min="0"
                max="5"
                value={operationSatisfaction}
                onChange={(e) => setOperationSatisfaction(e.target.value)}
                placeholder="예: 4.75"
                className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                <MessageSquare size={12} className="text-slate-500" />
                종합평가 / 사후 특이 비고
              </label>
              <textarea 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="예: 설문조사 결과, 강의 자료가 업무 해결에 매우 유용했다는 임직원 피드백 다수 확인."
                rows={3}
                className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 font-sans"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md"
            >
              만족도 결과 저장
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

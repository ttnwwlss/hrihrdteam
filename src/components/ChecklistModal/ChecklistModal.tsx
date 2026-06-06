import React, { useState, useEffect } from 'react';
import { Project, Round, ChecklistItem } from '../../types';
import { dbService } from '../../services/dbService';
import { X, CheckSquare, Square, Plus, Trash2, ClipboardCheck, Percent } from 'lucide-react';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  round?: Round; // Optional: if provided, we show round checks, otherwise project checks
  checklistItems: ChecklistItem[];
  onUpdateChecklist: () => void;
}

export default function ChecklistModal({
  isOpen,
  onClose,
  project,
  round,
  checklistItems,
  onUpdateChecklist
}: ChecklistModalProps) {
  const [newTitle, setNewTitle] = useState('');

  if (!isOpen) return null;

  // Filter items based on whether we are showing for round OR project
  const currentItems = checklistItems.filter(item => {
    if (!item.is_active) return false;
    if (round) {
      return item.round_id === round.id;
    } else {
      return item.project_id === project.id && (item.round_id === null || item.round_id === undefined);
    }
  });

  const doneCount = currentItems.filter(i => i.is_done).length;
  const totalCount = currentItems.length;
  const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const handleToggleCheck = async (item: ChecklistItem) => {
    const updated = { ...item, is_done: !item.is_done };
    await dbService.saveChecklist(updated);
    onUpdateChecklist();
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: ChecklistItem = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      project_id: round ? null : project.id,
      round_id: round ? round.id : null,
      title: newTitle.trim(),
      is_done: false,
      sort_order: totalCount + 1,
      is_active: true
    };

    await dbService.saveChecklist(newItem);
    setNewTitle('');
    onUpdateChecklist();
  };

  const handleDeleteItem = async (id: string) => {
    await dbService.deleteChecklist(id);
    onUpdateChecklist();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex-1 min-w-0 pr-4">
            <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded-sm inline-block">
              {round ? '세부 차수 준비율 체크' : '상위 과정 총괄 체크'}
            </span>
            <h3 className="font-bold text-slate-900 text-sm mt-1 truncate">
              {round ? `📋 [${round.round_no}차수] 준비 체크리스트` : `📋 [${project.client_name}] 과정 준비 사항`}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress block */}
        <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
            <span className="flex items-center gap-1">
              <Percent size={14} className="text-cyan-600" />
              과정 운영 준비율
            </span>
            <span className="text-cyan-700 font-mono text-sm">{completionRate}% ({doneCount}/{totalCount})</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-cyan-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* List of items */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {currentItems.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed">
              등록된 체크사항이 없습니다. 아래 간편 입력기로 추가해 준비상태를 추적하세요.
            </div>
          ) : (
            currentItems.map(item => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/50 transition-colors shadow-3xs"
              >
                <button
                  type="button"
                  onClick={() => handleToggleCheck(item)}
                  className="flex items-center gap-2.5 text-xs text-left text-slate-700 font-medium flex-1"
                >
                  {item.is_done ? (
                    <CheckSquare size={18} className="text-cyan-600 shrink-0 fill-cyan-50/50" />
                  ) : (
                    <Square size={18} className="text-slate-300 shrink-0" />
                  )}
                  <span className={`${item.is_done ? 'line-through text-slate-400' : 'text-slate-800 font-semibold'}`}>
                    {item.title}
                  </span>
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Input area */}
        <form onSubmit={handleAddItem} className="flex gap-2">
          <input 
            type="text" 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="예: 강의장 방음상태 실사, 교재 대중교통 배송"
            className="flex-1 text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:border-cyan-600 outline-none"
          />
          <button
            type="submit"
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1 shrink-0"
          >
            <Plus size={16} /> 추가
          </button>
        </form>

        {/* Footer info text */}
        <p className="text-[10px] text-slate-400 text-center select-none font-mono">
          ※ 체크리스트 변동사항은 창을 닫아도 실시간 적용 유지됩니다.
        </p>

      </div>
    </div>
  );
}

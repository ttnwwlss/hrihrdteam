import React, { useState, useEffect } from 'react';
import { Member } from '../../types';
import { dbService } from '../../services/dbService';
import { X, UserPlus, Trash2, Edit, Save, Plus } from 'lucide-react';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onUpdateMembers: () => void;
}

export default function MemberModal({
  isOpen,
  onClose,
  members,
  onUpdateMembers
}: MemberModalProps) {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('팀원');
  const [sortOrder, setSortOrder] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);

  // States for edit row
  const [editName, setEditName] = useState('');
  const [editPosition, setEditPosition] = useState('팀원');
  const [editSortOrder, setEditSortOrder] = useState(1);
  const [editIsActive, setEditIsActive] = useState(true);

  if (!isOpen) return null;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newMember: Member = {
      id: `m_${Date.now()}`,
      name: name.trim(),
      position,
      sort_order: Number(sortOrder) || members.length + 1,
      is_active: true
    };

    await dbService.saveMember(newMember);
    setName('');
    setPosition('팀원');
    setSortOrder(members.length + 2);
    onUpdateMembers();
  };

  const startEdit = (m: Member) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditPosition(m.position);
    setEditSortOrder(m.sort_order);
    setEditIsActive(m.is_active);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;

    const updated: Member = {
      id,
      name: editName.trim(),
      position: editPosition,
      sort_order: Number(editSortOrder),
      is_active: editIsActive
    };

    await dbService.saveMember(updated);
    setEditingId(null);
    onUpdateMembers();
  };

  const handleDeleteMember = async (id: string) => {
    if (confirm('이 담당자를 정말 주소록에서 영구 삭제하겠습니까? 이 담당자가 배정되어 있는 다른 프로젝트 통계에 영향을 줄 수 있습니다. 만약 보존하려면 단순히 비활성화(활성 여부 끄기)를 추천합니다.')) {
      await dbService.deleteMember(id);
      onUpdateMembers();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-cyan-600 bg-cyan-50 font-bold px-2.5 py-0.5 rounded-sm uppercase">팀 리소스 파트</span>
            <h3 className="font-bold text-slate-900 text-sm mt-1">
              👥 HRD사업팀 과정 운영자 주소록 관리
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form to Add New User */}
        <form onSubmit={handleAddMember} className="bg-slate-50 border p-3.5 rounded-2xl flex flex-wrap gap-2.5 items-end justify-between">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-[9px] font-extrabold text-slate-500 mb-1">이름</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 홍길동"
              className="w-full text-xs border border-slate-300 rounded-xl px-2.5 py-2 whitespace-nowrap bg-white"
            />
          </div>

          <div className="w-[110px]">
            <label className="block text-[9px] font-extrabold text-slate-500 mb-1">직책</label>
            <select 
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl px-2.5 py-2 bg-white"
            >
              <option value="팀원">팀원</option>
              <option value="팀장">팀장</option>
            </select>
          </div>

          <div className="w-[60px]">
            <label className="block text-[9px] font-extrabold text-slate-500 mb-1">정렬</label>
            <input 
              type="number" 
              min={1}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full text-xs border border-slate-300 rounded-xl px-2 py-2 text-center bg-white"
            />
          </div>

          <button
            type="submit"
            className="bg-cyan-700 hover:bg-cyan-800 text-white font-bold p-2 px-3 rounded-xl text-xs flex items-center gap-1 shrink-0 h-9.5"
          >
            <Plus size={14} /> 등록
          </button>
        </form>

        {/* Members list */}
        <div className="border border-slate-200 rounded-2xl max-h-[240px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 font-bold text-[10px] uppercase text-slate-400 border-b border-slate-100 sticky top-0">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">정렬</th>
                <th className="py-2.5 px-2">이름</th>
                <th className="py-2.5 px-2">직책</th>
                <th className="py-2.5 px-2 text-center">활성여부</th>
                <th className="py-2.5 px-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map(m => {
                const isEditing = editingId === m.id;

                return (
                  <tr key={m.id} className="hover:bg-slate-50/40">
                    <td className="py-2 px-3 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editSortOrder}
                          onChange={(e) => setEditSortOrder(Number(e.target.value))}
                          className="w-10 border border-slate-350 p-1 text-center rounded bg-slate-50"
                        />
                      ) : (
                        <span className="font-mono text-slate-400">{m.sort_order}</span>
                      )}
                    </td>
                    <td className="py-2 px-2 font-bold text-slate-800">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-20 border border-slate-350 px-1.5 py-0.5 rounded bg-slate-50"
                        />
                      ) : (
                        <span>{m.name}</span>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      {isEditing ? (
                        <select
                          value={editPosition}
                          onChange={(e) => setEditPosition(e.target.value)}
                          className="text-[11px] border border-slate-350 p-0.5 rounded bg-slate-50"
                        >
                          <option value="팀원">팀원</option>
                          <option value="팀장">팀장</option>
                        </select>
                      ) : (
                        <span className="text-slate-500 bg-slate-100 border px-1.5 py-0.2 rounded-sm text-[10px] font-medium">{m.position}</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={editIsActive}
                          onChange={(e) => setEditIsActive(e.target.checked)}
                          className="rounded text-cyan-600 focus:ring-cyan-500"
                        />
                      ) : (
                        <span className={`inline-block w-2 h-2 rounded-full ${m.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} title={m.is_active ? '정상 활동' : '비활성 보류'} />
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {isEditing ? (
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => handleSaveEdit(m.id)}
                            className="bg-emerald-50 text-emerald-700 font-bold p-1 px-2 rounded text-[10px] hover:bg-emerald-100"
                          >
                            저장
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="bg-slate-100 text-slate-500 p-1 px-2 rounded text-[10px]"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => startEdit(m)}
                            className="text-slate-400 hover:text-slate-700"
                            title="담당자 정보 수정"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(m.id)}
                            className="text-slate-400 hover:text-rose-500"
                            title="주소록에서 이 회원 삭제"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-slate-400 text-center font-sans tracking-wide leading-normal select-none">
          ※ 비활성화된 담당자는 새로운 프로젝트 개설/수정의 드롭다운 선택상자에서만 제외되고, 기존 매핑된 자료 내에서는 정상 노출을 유지합니다.
        </p>

      </div>
    </div>
  );
}

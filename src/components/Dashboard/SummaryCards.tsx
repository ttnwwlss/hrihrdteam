import React from 'react';
import { Project, Round, Member } from '../../types';
import { 
  Briefcase, 
  Users, 
  Star, 
  AlertTriangle,
  Calendar
} from 'lucide-react';

interface SummaryCardsProps {
  filteredProjects: Project[];
  filteredRounds: Round[];
  allRounds: Round[];
  members: Member[];
}

export default function SummaryCards({ 
  filteredProjects, 
  filteredRounds, 
  allRounds,
  members 
}: SummaryCardsProps) {
  // 1. 전체 프로젝트 수 및 운영중 프로젝트 수
  const totalProjects = filteredProjects.length;
  const activeProjects = filteredProjects.filter(p => p.status === '운영중').length;

  // 2. 총 교육인원 (완료 차수 기준 누적)
  const completedRounds = filteredRounds.filter(r => r.status === '완료');
  const totalParticipants = completedRounds.reduce((acc, r) => acc + (r.participant_count || 0), 0);

  // 3. 평균 만족도 (만족도 데이터가 있는 완료 차수 대상)
  const satisfactionRounds = filteredRounds.filter(r => r.satisfaction !== null && r.satisfaction !== undefined);
  const avgSatisfaction = satisfactionRounds.length > 0
    ? (satisfactionRounds.reduce((acc, r) => acc + (r.satisfaction || 0), 0) / satisfactionRounds.length).toFixed(2)
    : '-';

  // 4. 이번달 교육 운영 현황 건수 (현재 날짜의 연도/월 기준 - KST 서울 시간 기준)
  const kstOffset = 9 * 60 * 60 * 1000;
  const today = new Date(Date.now() + kstOffset);
  const thisYear = today.getUTCFullYear();
  const thisMonth = today.getUTCMonth();
  const thisMonthRoundsCount = filteredRounds.filter(r => {
    if (!r.start_date) return false;
    const d = new Date(r.start_date);
    return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
  }).length;

  const cards = [
    {
      id: 'stat-total-projects',
      title: '전체 과정 현황',
      value: `${totalProjects}건`,
      desc: `실제 운영 또는 준비중: ${activeProjects}건`,
      icon: Briefcase,
      color: 'bg-[#F8FAFC] border-[#E2E8F0] text-slate-800 hover:border-slate-350',
      iconBg: 'bg-slate-100 text-slate-700'
    },
    {
      id: 'stat-total-participants',
      title: '누적 교육 인원',
      value: `${totalParticipants.toLocaleString()}명`,
      desc: '종료 과정 최종 실적 합계',
      icon: Users,
      color: 'bg-[#F8FAFC] border-[#E2E8F0] text-slate-800 hover:border-slate-350',
      iconBg: 'bg-slate-100 text-slate-700'
    },
    {
      id: 'stat-avg-satisfaction',
      title: '과정 평균 만족도',
      value: avgSatisfaction === '-' ? '-' : `${avgSatisfaction} / 5.00`,
      desc: '피드백 점수 조사 누계 평점',
      icon: Star,
      color: 'bg-[#F8FAFC] border-[#E2E8F0] text-slate-800 hover:border-slate-350',
      iconBg: 'bg-amber-100 text-amber-700'
    },
    {
      id: 'stat-monthly-ops',
      title: '이번달 교육 운영 현황',
      value: `${thisMonthRoundsCount}건`,
      desc: '이번 달 시작 예정 및 진행 차수',
      icon: Calendar,
      color: 'bg-[#F8FAFC] border-[#E2E8F0] text-slate-800 hover:border-slate-350',
      iconBg: 'bg-blue-50 text-blue-700'
    }
  ];

  return (
    <div id="dashboard-summary-grid" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div 
            key={card.id} 
            id={card.id}
            className={`p-5 border rounded-2xl flex items-center justify-between shadow-3xs transition-all duration-200 ${card.color}`}
          >
            <div className="flex-1 min-w-0 pr-2">
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                {card.title}
              </span>
              <span className="block text-2xl font-black tracking-tight mt-1">
                {card.value}
              </span>
              <span className="block text-[10px] mt-1 opacity-80 text-slate-400 font-mono">
                {card.desc}
              </span>
            </div>
            <div className={`p-2.5 rounded-xl shrink-0 ${card.iconBg}`}>
              <IconComponent size={20} className="stroke-[2.2]" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

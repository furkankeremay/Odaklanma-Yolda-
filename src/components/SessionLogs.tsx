import React from "react";
import { SessionLog } from "../types";
import { Award, Calendar, Flame, Clock, Trash2, Coins } from "lucide-react";

interface SessionLogsProps {
  logs: SessionLog[];
  onClearLogs: () => void;
  bonusPoints: number;
}

export default function SessionLogs({ logs, onClearLogs, bonusPoints }: SessionLogsProps) {
  // Aggregate stats
  const totalMinutes = logs.reduce((sum, log) => sum + (log.success ? log.duration : 0), 0);
  const totalSuccessSessions = logs.filter(log => log.success).length;

  // Calculate study streak based on logs date differences
  const calculateStreak = () => {
    if (logs.length === 0) return 0;
    
    const uniqueDates = Array.from(
      new Set(
        logs
          .filter(l => l.success)
          .map(l => new Date(l.completedAt).toDateString())
      )
    ).map(d => new Date(d));

    if (uniqueDates.length === 0) return 0;

    // Sort descending
    uniqueDates.sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    let today = new Date();
    today.setHours(0,0,0,0);
    
    let expectedDate = today;

    // Check if user has focused today, if not check if focused yesterday to continue count
    const topFocusedDate = uniqueDates[0];
    topFocusedDate.setHours(0,0,0,0);

    const diffToToday = (today.getTime() - topFocusedDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffToToday > 1) {
      return 0; // Streak broken
    }

    expectedDate = topFocusedDate;

    for (let i = 0; i < uniqueDates.length; i++) {
      const currentDate = uniqueDates[i];
      currentDate.setHours(0,0,0,0);

      const diff = (expectedDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 0) {
        streak++;
        expectedDate = new Date(expectedDate.getTime() - 24 * 60 * 60 * 1000);
      } else if (diff === 1) {
        streak++;
        expectedDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break; // gap found
      }
    }

    return streak;
  };

  const currentStreak = calculateStreak();

  // Helper translations for modes
  const translateMode = (mode: string) => {
    switch (mode) {
      case "pomodoro": return "Klasik Pomodoro";
      case "extended": return "Uzatılmış Pomodoro";
      case "tyt": return "TYT Sınav Modu";
      case "ayt": return "AYT / Genel Sınav Modu";
      default: return mode;
    }
  };

  return (
    <div className="bg-white border-4 border-black rounded-[24px] md:rounded-[32px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-3 md:p-5 flex-1 flex flex-col min-h-0 overflow-hidden select-none relative box-border" id="stats-panel">
      
      {/* Header section */}
      <div className="flex items-center justify-between mb-1 shrink-0 h-8">
        <div>
          <h2 className="text-sm md:text-base font-black uppercase tracking-tight text-[#3D3D3D] leading-none">BAŞARI KARNEN 🏆</h2>
          <p className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5 leading-none">Başarılı odaklanma serüvenin</p>
        </div>
        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="text-[9px] md:text-[10px] text-[#FF7E67] hover:bg-[#FDEEDC] px-2.5 py-1 rounded-lg border-2 border-black transition-all cursor-pointer flex items-center gap-1 font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none h-6"
            title="Tüm veriyi temizle"
          >
            <Trash2 className="w-2.5 h-2.5" />
            Temizle
          </button>
        )}
      </div>

      {/* Grid Stats - Upgraded to col-2 filling the container area */}
      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 mt-3 p-1 pb-1.5 overflow-hidden rounded-[20px] md:rounded-[24px]">
        
        {/* Study Streak */}
        <div className="bg-[#FDEEDC] rounded-2xl border-4 border-black h-full min-h-0 overflow-hidden w-full flex flex-col justify-center items-center p-2 md:p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rotate-1 box-border">
          <Flame className="w-5 h-5 md:w-8 md:h-8 text-[#FF7E67] mb-1.5 md:mb-2 animate-bounce shrink-0" />
          <div className="text-center min-w-0 w-full px-1">
            <span className="text-[8px] md:text-[10px] text-[#3D3D3D] font-black uppercase tracking-wider block leading-none mb-1 text-center truncate">SERİ GÜNÜ</span>
            <span className="text-xs md:text-base lg:text-lg font-black text-[#FF7E67] leading-none text-center block truncate">{currentStreak} GÜN</span>
          </div>
        </div>

        {/* Total Focus Duration */}
        <div className="bg-[#FFFBF2] rounded-2xl border-4 border-black h-full min-h-0 overflow-hidden w-full flex flex-col justify-center items-center p-2 md:p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -rotate-1 box-border">
          <Clock className="w-5 h-5 md:w-8 md:h-8 text-[#4ECDC4] mb-1.5 md:mb-2 shrink-0" />
          <div className="text-center min-w-0 w-full px-1">
            <span className="text-[8px] md:text-[10px] text-[#3D3D3D] font-black uppercase tracking-wider block leading-none mb-1 text-center truncate">TOPLAM ODAK</span>
            <span className="text-xs md:text-base lg:text-lg font-black text-[#3D3D3D] leading-none text-center block truncate">{totalMinutes} DK</span>
          </div>
        </div>

        {/* Success Sessions Counter */}
        <div className="bg-[#4ECDC4]/20 rounded-2xl border-4 border-black h-full min-h-0 overflow-hidden w-full flex flex-col justify-center items-center p-2 md:p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rotate-1 box-border">
          <Award className="w-5 h-5 md:w-8 md:h-8 text-[#FF7E67] mb-1.5 md:mb-2 shrink-0" />
          <div className="text-center min-w-0 w-full px-1">
            <span className="text-[8px] md:text-[10px] text-[#3D3D3D] font-black uppercase tracking-wider block leading-none mb-1 text-center truncate">BAŞARILI GİRİŞ</span>
            <span className="text-xs md:text-base lg:text-lg font-black text-[#FF7E67] leading-none text-center block truncate">{totalSuccessSessions} SEANS</span>
          </div>
        </div>

        {/* Total Rewards / Bonus Points */}
        <div className="bg-yellow-50 rounded-2xl border-4 border-black h-full min-h-0 overflow-hidden w-full flex flex-col justify-center items-center p-2 md:p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -rotate-1 box-border">
          <Coins className="w-5 h-5 md:w-8 md:h-8 text-amber-500 mb-1.5 md:mb-2 shrink-0 animate-pulse" />
          <div className="text-center min-w-0 w-full px-1">
            <span className="text-[8px] md:text-[10px] text-[#3D3D3D] font-black uppercase tracking-wider block leading-none mb-1 text-center truncate">BAŞARI PUANI</span>
            <span className="text-xs md:text-base lg:text-lg font-black text-amber-600 leading-none text-center block truncate">+{bonusPoints} P</span>
          </div>
        </div>

      </div>
    </div>
  );
}

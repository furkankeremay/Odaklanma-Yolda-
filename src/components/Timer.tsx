import React, { useEffect, useState } from "react";
import { StudyMode, TimerState } from "../types";
import { Play, Pause, RotateCcw, AlertCircle, Volume2, CheckSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TimerProps {
  mode: StudyMode;
  onChangeMode: (mode: StudyMode) => void;
  timerState: TimerState;
  onStateChange: (state: TimerState) => void;
  secondsRemaining: number;
  setSecondsRemaining: React.Dispatch<React.SetStateAction<number>>;
  goal: string;
  setGoal: (val: string) => void;
  onDistraction: () => void;
  onSessionComplete: (durationMinutes: number, success: boolean) => void;
  subTasks: { id: string; text: string; completed: boolean }[];
  setSubTasks: React.Dispatch<React.SetStateAction<{ id: string; text: string; completed: boolean }[]>>;
  bonusPoints: number;
  setBonusPoints: React.Dispatch<React.SetStateAction<number | ((prev: number) => number)>>;
  isZenMode: boolean;
  onToggleZen: () => void;
  
  soundHooks: {
    activePreset: string;
    activeChannels: { binaural: boolean; lofi: boolean; brownnoise: boolean; rain: boolean };
    channelVolumes: { binaural: number; lofi: number; brownnoise: number; rain: number };
    setChannelVolume: (channel: "binaural" | "lofi" | "brownnoise" | "rain", vol: number) => void;
    volume: number;
    setVolume: (v: number) => void;
    isPlaying: boolean;
    handleTogglePlay: (p: string) => void;
    playCozyChirp: () => void;
    playRetroAlarm?: () => void;
  };
}

export default function Timer({
  mode,
  onChangeMode,
  timerState,
  onStateChange,
  secondsRemaining,
  setSecondsRemaining,
  goal,
  setGoal,
  onDistraction,
  onSessionComplete,
  subTasks,
  setSubTasks,
  bonusPoints,
  setBonusPoints,
  isZenMode,
  onToggleZen,
  soundHooks,
}: TimerProps) {
  const [isActive, setIsActive] = useState(false);
  const [isAccordionExpanded, setIsAccordionExpanded] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [wasActiveBeforeConfirm, setWasActiveBeforeConfirm] = useState(false);

  // Focus and break study durations in seconds
  const modeDurations: Record<StudyMode, { focus: number; break: number }> = {
    pomodoro: { focus: 25 * 60, break: 5 * 60 },
    extended: { focus: 50 * 60, break: 10 * 60 },
    tyt: { focus: 165 * 60, break: 0 },
    ayt: { focus: 180 * 60, break: 0 },
  };

  const currentMaxDuration =
    timerState === "break"
      ? modeDurations[mode].break
      : modeDurations[mode].focus;

  // Active Countdown Effect
  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isActive) {
      handleCountdownComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, secondsRemaining]);

  const handleCountdownComplete = () => {
    setIsActive(false);
    
    // Trigger neo-brutalist retro school bell beep chime
    if (soundHooks.playRetroAlarm) {
      soundHooks.playRetroAlarm();
    }

    // Trigger Native Browser Background Notification API
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        let title = "Süre Doldu Dostum! ⏰";
        let body = "Yoldaş'la birlikte bir seansı daha tamamladın! Şimdi yeni bir adıma geçelim.";
        
        if (timerState === "focusing") {
          title = "Odaklanma Seansı Başarıyla Tamamlandı! 🥳";
          body = "Süper iş çıkardın şampiyon! Şimdi hak ettiğin dinlendirici bir molaya geçelim.";
        } else if (timerState === "break") {
          title = "Mola Sona Erdi Şampiyon! ⏰";
          body = "Mola bitti şampiyon, masaya dönüp yeni bir hedefe kilitlenme zamanı!";
        }
        
        try {
          new Notification(title, {
            body: body
          });
        } catch (notifierErr) {
          console.warn("Notification construct error", notifierErr);
        }
      }
    }
    
    if (timerState === "focusing") {
      const focusDurationMin = Math.round(modeDurations[mode].focus / 60);
      onSessionComplete(focusDurationMin, true);
      
      if (modeDurations[mode].break > 0) {
        onStateChange("break");
        setSecondsRemaining(modeDurations[mode].break);
      } else {
        onStateChange("finished");
        setSecondsRemaining(0);
      }
    } else if (timerState === "break") {
      onStateChange("finished");
      setSecondsRemaining(0);
    }
  };

  const handleStart = () => {
    if (timerState === "planning" || timerState === "finished") {
      onStateChange("focusing");
      setSecondsRemaining(modeDurations[mode].focus);
    } else if (timerState === "break") {
      onStateChange("focusing");
    }
    setIsActive(true);
    soundHooks.playCozyChirp();
  };

  const handlePause = () => {
    setIsActive(false);
    soundHooks.playCozyChirp();
  };

  const handleReset = () => {
    setIsActive(false);
    onStateChange("planning");
    setSecondsRemaining(modeDurations[mode].focus);
    soundHooks.playCozyChirp();
  };

  const handleEarlyEnd = () => {
    setWasActiveBeforeConfirm(isActive);
    setIsActive(false);
    setShowFinishConfirm(true);
    soundHooks.playCozyChirp();
  };

  const handleConfirmEarlyEnd = () => {
    setShowFinishConfirm(false);
    const focusedSec = modeDurations[mode].focus - secondsRemaining;
    const focusDurationMin = focusedSec > 0 ? Math.max(1, Math.ceil(focusedSec / 60)) : 1;
    
    // Early end is a session cut by the user, mark as unsuccessful structure
    onSessionComplete(focusDurationMin, false);
    
    onStateChange("finished");
    setSecondsRemaining(0);
  };

  const handleCancelEarlyEnd = () => {
    setShowFinishConfirm(false);
    if (wasActiveBeforeConfirm) {
      setIsActive(true);
    }
    soundHooks.playCozyChirp();
  };

  // Dedicated distraction handler: forces Pause first
  const handleDistractionClick = () => {
    setIsActive(false); // PAUSE count down
    onDistraction();
  };

  // SVG parameters for progress ring counting
  const r = 115;
  const strokeWidth = 11;
  const perimeter = 2 * Math.PI * r;
  const progressPercent = secondsRemaining / currentMaxDuration || 0;
  const strokeOffset = perimeter - progressPercent * perimeter;

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    
    const fillZ = (n: number) => String(n).padStart(2, "0");

    if (h > 0) {
      return `${fillZ(h)}:${fillZ(m)}:${fillZ(s)}`;
    }
    return `${fillZ(m)}:${fillZ(s)}`;
  };

  const handleModeSelection = (targetMode: StudyMode) => {
    if (isActive) return;
    setIsActive(false);
    onStateChange("planning");
    onChangeMode(targetMode);
    setSecondsRemaining(modeDurations[targetMode].focus);
    soundHooks.playCozyChirp();
  };

  return (
    <div className={`bg-white border-4 border-black rounded-[32px] md:rounded-[40px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between items-center h-full p-6 relative transition-all duration-500 ease-in-out box-border ${isZenMode ? "scale-[1.01]" : ""}`} id="timer-panel">
      {/* Neo-brutalist custom confirmation overlay */}
      {showFinishConfirm && (
        <div className="absolute inset-0 bg-[#FFFBF2]/95 backdrop-blur-[2px] flex flex-col justify-center items-center p-6 text-center border-4 border-black rounded-[28px] md:rounded-[36px] z-50">
          <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-1">
            <span className="text-3xl mb-3 block">⏰</span>
            <h3 className="text-base font-black text-[#3D3D3D] uppercase tracking-wider mb-2">Seansı Bitir?</h3>
            <p className="text-xs font-semibold text-gray-600 mb-5 leading-relaxed">
              Dostum bu odaklanma seansını erken bitirmek istediğinden emin misin? Şimdiye kadar çalıştığın süre başarıyla kaydedilecektir.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleConfirmEarlyEnd}
                className="w-full py-3 bg-[#4ECDC4] text-[#3D3D3D] border-3 border-[#3D3D3D] rounded-xl font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#3D3D3D] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer font-sans"
              >
                EVET, DURDUR VE KAYDET 👍
              </button>
              <button
                type="button"
                onClick={handleCancelEarlyEnd}
                className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-[#3D3D3D] border-3 border-[#3D3D3D] rounded-xl font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#3D3D3D] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer font-sans"
              >
                HAYIR, SÜREYE DEVAM ET ↩️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Watermark Time Indicator - perfectly centered in clock context */}
      <div className="absolute inset-x-0 top-18 bottom-16 flex items-center justify-center opacity-[0.02] select-none pointer-events-none pr-4 pl-4 overflow-hidden z-0">
        <span className={`${secondsRemaining >= 3600 ? "text-[65px] md:text-[85px]" : "text-[100px] md:text-[140px]"} font-black uppercase tracking-widest`}>
          {formatTime(secondsRemaining)}
        </span>
      </div>

      {/* 0. Top Panel Header with Zen Mode Controls */}
      <div className="flex items-center justify-between pb-2 border-b-2 border-dashed border-[#3D3D3D] relative z-10 w-full shrink-0">
        <span className="text-xs font-black uppercase text-[#3D3D3D] tracking-widest flex items-center gap-1.5">
          ⏱️ ODAKLANMA MASASI 
          {isZenMode && (
            <span className="text-[9px] bg-[#FF7E67] text-white font-black px-2 py-0.5 rounded-sm animate-pulse tracking-normal normal-case">
              ZEN MODU AKTİF
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={onToggleZen}
          className="px-3.5 py-1.5 bg-[#4ECDC4] text-[#3D3D3D] border-2 border-[#3D3D3D] rounded-xl text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#3D3D3D] active:translate-y-[2px] active:shadow-none hover:bg-[#3dbbb1] transition-all flex items-center gap-1.5 cursor-pointer selection:bg-transparent font-sans"
        >
          <span>{isZenMode ? "Zen Çık" : "Zen Modu"}</span>
          <span>📺</span>
        </button>
      </div>

      {/* 1. Devasa Süre (Zamanlayıcı - Bağımsız ve Çakılı Orta Kısım) */}
      <div className="mt-4 md:mt-6 mb-4 relative z-10 w-full flex flex-col items-center justify-center shrink-0" id="clock-wrapper">
        <div className="relative w-44 h-44 xs:w-48 xs:h-48 sm:w-56 sm:h-56 lg:w-[240px] lg:h-[240px] mx-auto flex items-center justify-center transition-all duration-300 shrink-0">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 300 300">
            {/* White bold frame under shadow */}
            <circle
              cx="150"
              cy="150"
              r={r}
              fill="none"
              stroke="#FFFBF2"
              strokeWidth={strokeWidth + 4}
            />
            {/* Strong layout dark border */}
            <circle
              cx="150"
              cy="150"
              r={r}
              fill="none"
              stroke="#3D3D3D"
              strokeWidth={strokeWidth}
            />
            {/* Dynamic colored progress indicator */}
            <motion.circle
              cx="150"
              cy="150"
              r={r}
              fill="none"
              stroke={timerState === "break" ? "#4ECDC4" : "#FF7E67"}
              strokeWidth={strokeWidth - 2}
              strokeDasharray={perimeter}
              animate={{ strokeDashoffset: strokeOffset }}
              transition={{ duration: 0.35, ease: "linear" }}
              strokeLinecap="round"
            />
            {/* Smoothly rotating dashed loader track overlay when active */}
            {isActive && (
              <circle
                cx="150"
                cy="150"
                r={r + 8}
                fill="none"
                stroke="#FF7E67"
                strokeWidth="2.5"
                strokeDasharray="6 12"
                className="animate-[spin_12s_linear_infinite]"
                style={{ transformOrigin: "150px 150px" }}
              />
            )}
          </svg>

          <div className="text-center z-10 select-none px-6 flex flex-col items-center justify-center">
            <p className={`${secondsRemaining >= 3600 ? "text-xl md:text-2xl lg:text-3xl" : "text-3xl md:text-4xl lg:text-5xl"} font-black font-mono tracking-tighter text-[#3D3D3D] tabular-nums transition-all duration-300 leading-none pr-1`}>
              {formatTime(secondsRemaining)}
            </p>
            <p className="text-[9px] md:text-[10px] text-[#FF7E67] font-black uppercase tracking-widest mt-3 bg-[#FFFBF2] px-3 py-1 rounded-lg border-2 border-[#3D3D3D] shadow-[2px_2px_0px_#3D3D3D] inline-block font-sans leading-none">
              {timerState === "planning" && "PLANLAMA"}
              {timerState === "focusing" && "ODAK SÜRESİ"}
              {timerState === "break" && "ESNEME MOLASI"}
              {timerState === "finished" && "SEANS TAMAM!"}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Alt Dinamik Alan (Kontrol Butonları) */}
      <div className={`w-full flex-1 flex flex-col items-center justify-center z-20 ${isZenMode ? "mb-0" : "mb-16"}`} id="controls-exam-container">
        
        {/* Kontrol ve Aksiyon Butonları (Tek Yatay Satırda) */}
        <div className="flex flex-row items-center justify-center gap-3 w-full max-w-xs md:max-w-sm shrink-0 h-12 relative transition-all duration-300">
          {isActive ? (
            <button
              type="button"
              onClick={handlePause}
              className="flex-1 py-1 px-5 bg-[#3D3D3D] text-white border-3 border-[#3D3D3D] rounded-full flex items-center justify-center gap-1.5 font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_#FF7E67] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer select-none leading-none h-[42px] font-sans"
            >
              <Pause className="w-4 h-4" /> DURDUR
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              className="flex-1 py-1 px-5 bg-[#FF7E67] text-white border-3 border-[#3D3D3D] rounded-full flex items-center justify-center gap-1.5 font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_#3D3D3D] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer select-none leading-none h-[42px] font-sans"
            >
              <Play className="w-4 h-4" /> BAŞLAT
            </button>
          )}

          {/* Reset button always enabled except when timer is active */}
          {!isActive && (timerState === "focusing" || timerState === "break" || timerState === "finished") && (
            <button
              type="button"
              onClick={handleReset}
              className="w-[42px] h-[42px] bg-white border-3 border-[#3D3D3D] text-[#3D3D3D] hover:bg-neutral-100 rounded-full transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-[2.5px_2.5px_0px_#3D3D3D] shrink-0"
              title="Sıfırla"
            >
              <RotateCcw className="w-4.5 h-4.5" />
            </button>
          )}

          {timerState === "focusing" && (
            <button
              type="button"
              onClick={handleEarlyEnd}
              className="px-5 py-1 bg-[#4ECDC4] text-[#3D3D3D] border-3 border-[#3D3D3D] rounded-full font-black text-xs uppercase tracking-widest active:translate-x-[3px] active:translate-y-[3px] active:shadow-none shadow-[3px_3px_0px_#3D3D3D] transition-all flex items-center justify-center cursor-pointer select-none leading-none h-[42px] font-sans"
              title="Erken Bitir ve Kaydet"
            >
              BİTİR
            </button>
          )}
        </div>
      </div>

      {/* 3. Mod Seçenekleri Grid Sistemi (Sol Kolonun En Altı) */}
      {!isZenMode && (
        <div className="absolute bottom-4 left-4 right-4 z-10" id="absolute-modes-container">
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#FDEEDC] border-3 border-[#3D3D3D] rounded-xl shadow-sm">
            {(["pomodoro", "extended", "tyt", "ayt"] as StudyMode[]).map((m, idx) => {
              const isActiveMode = mode === m;
              const labelMap: Record<StudyMode, string> = {
                pomodoro: "Klasik Pomo",
                extended: "Uzun Pomo",
                tyt: "TYT Modu",
                ayt: "AYT Sınavı",
              };
              
              const rotations = ["-rotate-1", "rotate-1", "-rotate-2", "rotate-2"];
              const currentRot = rotations[idx % rotations.length];

              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleModeSelection(m)}
                  disabled={isActive}
                  className={`text-[9px] md:text-[10px] py-1.5 px-0.5 rounded-lg font-black transition-all ${
                    isActiveMode
                      ? `bg-[#FF7E67] text-white border-2 border-[#3D3D3D] shadow-[2px_2px_0px_#3D3D3D] ${currentRot}`
                      : "text-[#3D3D3D] opacity-70 hover:opacity-100 hover:bg-white/80"
                  } disabled:opacity-50 cursor-pointer select-none font-sans`}
                >
                  {labelMap[m]}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

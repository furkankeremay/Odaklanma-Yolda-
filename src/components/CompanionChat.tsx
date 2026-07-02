import React, { useRef, useEffect, useState } from "react";
import { ChatMessage, StudyMode, TimerState } from "../types";
import { Send, Zap, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CompanionChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isPending: boolean;
  timerState: TimerState;
  currentMode: StudyMode;
  goal: string;
  onSelectQuickSuggestion: (prompt: string) => void;
  avatarState: "idle" | "focusing" | "break" | "finished" | "distracted";
}

export default function CompanionChat({
  messages,
  onSendMessage,
  isPending,
  timerState,
  currentMode,
  goal,
  onSelectQuickSuggestion,
  avatarState,
}: CompanionChatProps) {
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Exam mode detection helper
  const isExamModeActive =
    timerState === "focusing" && (currentMode === "tyt" || currentMode === "ayt");

  // Auto scroll to latest bot messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isExamModeActive || !input.trim() || isPending) return;
    onSendMessage(input);
    setInput("");
  };

  // Render the State Machine-driven SVG Avatar
  const renderAvatar = () => {
    let colorClass = "bg-[#FDEEDC] text-[#3D3D3D] border-[#3D3D3D]";
    let statusLabel = "PLAN BİRLİKTELİĞİ";
    let animationClass = "animate-float"; // default idle state

    if (avatarState === "focusing") {
      colorClass = "bg-white text-[#3D3D3D] border-[#3D3D3D]";
      statusLabel = isExamModeActive ? "SINAV KONSANTRASYONU" : "PÜRDİKKAT ODAKLANMA";
      animationClass = "animate-pulse-slow";
    } else if (avatarState === "break") {
      colorClass = "bg-[#4ECDC4] text-white border-[#3D3D3D]";
      statusLabel = "ÇAY KAHVE MOLASI";
      animationClass = "animate-pulse-slow";
    } else if (avatarState === "finished") {
      colorClass = "bg-[#FF7E67] text-white border-[#3D3D3D]";
      statusLabel = "BAŞARI TEBRİĞİ";
      animationClass = "animate-bounce";
    } else if (avatarState === "distracted") {
      colorClass = "bg-red-50 text-red-600 border-red-500";
      statusLabel = "ACİL MÜDAHALE GEREKLİ!";
      animationClass = "animate-shake";
    }

    return (
      <div className={`flex flex-col items-center justify-center p-5 bg-white border-4 border-[#3D3D3D] rounded-3xl shadow-[4px_4px_0px_#3D3D3D] mb-4 ${animationClass}`}>
        <div className="relative w-24 h-24 mb-3">
          
          {/* Animated Glow depending on active states */}
          <AnimatePresence>
            {avatarState === "focusing" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.4, scale: 1.15 }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
                className={`absolute inset-0 rounded-full filter blur-md ${isExamModeActive ? 'bg-[#FF7E67]' : 'bg-[#4ECDC4]'}`}
              />
            )}
            {avatarState === "finished" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-amber-300 rounded-full filter blur-md"
              />
            )}
            {avatarState === "distracted" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="absolute inset-x-[-12px] inset-y-[-12px] rounded-full border-4 border-[#FF7E67] opacity-60 filter blur-[2px]"
              />
            )}
          </AnimatePresence>

          {/* Chunky Custom Neo-Brutalist Avatar SVG */}
          <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 filter drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)]">
            {/* Outline Face */}
            <circle cx="50" cy="50" r="42" fill="#FAF5FF" stroke="#3D3D3D" strokeWidth="4" />
            
            {/* Red Crown/Hair Elements */}
            <path d="M35,16 Q50,6 65,16 Q50,23 35,16 Z" fill="#FF7E67" stroke="#3D3D3D" strokeWidth="4" />

            {/* Rosy blush cheeks */}
            <circle cx="28" cy="62" r="6" fill="#F472B6" opacity="0.5" />
            <circle cx="72" cy="62" r="6" fill="#F472B6" opacity="0.5" />

            {/* Expressions rendering engine */}
            {avatarState === "idle" && (
              <>
                {/* Cheerful Smiling Eyes */}
                <path d="M 24 45 Q 31 38 38 45" fill="none" stroke="#3D3D3D" strokeWidth="5" strokeLinecap="round" />
                <path d="M 62 45 Q 69 38 76 45" fill="none" stroke="#3D3D3D" strokeWidth="5" strokeLinecap="round" />
                {/* Excited Mouth */}
                <path d="M 40 60 Q 50 72 60 60" fill="none" stroke="#3D3D3D" strokeWidth="5" strokeLinecap="round" />
              </>
            )}

            {avatarState === "focusing" && (
              <>
                {/* Concentrated Glasses */}
                <circle cx="32" cy="46" r="11" fill="none" stroke={isExamModeActive ? "#EAB308" : "#312E81"} strokeWidth="4" />
                <circle cx="68" cy="46" r="11" fill="none" stroke={isExamModeActive ? "#EAB308" : "#312E81"} strokeWidth="4" />
                <line x1="43" y1="46" x2="57" y2="46" stroke={isExamModeActive ? "#EAB308" : "#312E81"} strokeWidth="4" />
                
                {/* Ciddi parlayan lens effect lines for Exam condition */}
                {isExamModeActive && (
                  <>
                    <line x1="28" y1="41" x2="36" y2="51" stroke="#EAB308" strokeWidth="2.5" />
                    <line x1="64" y1="41" x2="72" y2="51" stroke="#EAB308" strokeWidth="2.5" />
                  </>
                )}

                {/* Concentrated Eyes */}
                <circle cx="32" cy="46" r="3" fill="#1E1B4B" />
                <circle cx="68" cy="46" r="3" fill="#1E1B4B" />
                
                {/* Straight Serious Mouth */}
                <line x1="42" y1="64" x2="58" y2="64" stroke="#1E1B4B" strokeWidth="5" strokeLinecap="round" />
              </>
            )}

            {avatarState === "break" && (
              <>
                {/* Relaxed Bandana/Headband around the head */}
                <rect x="20" y="24" width="60" height="8" rx="2" fill="#EAB308" stroke="#3D3D3D" strokeWidth="3" />
                <circle cx="50" cy="28" r="3.5" fill="#FF7E67" stroke="#3D3D3D" strokeWidth="2" />
                
                {/* Relaxed Closed Eyes */}
                <path d="M 24 48 Q 31 53 38 48" fill="none" stroke="#3D3D3D" strokeWidth="5" strokeLinecap="round" />
                <path d="M 62 48 Q 69 53 76 48" fill="none" stroke="#3D3D3D" strokeWidth="5" strokeLinecap="round" />
                {/* Happy Content Smile */}
                <path d="M 42 62 Q 50 68 58 62" fill="none" stroke="#3D3D3D" strokeWidth="4" strokeLinecap="round" />
                
                {/* Tea Cup Elements */}
                <g transform="translate(74, 64) scale(0.18)">
                  <rect x="0" y="20" width="40" height="50" rx="10" fill="#4ECDC4" stroke="#3D3D3D" strokeWidth="6" />
                  <path d="M40,30 C55,30 55,50 40,50" fill="none" stroke="#3D3D3D" strokeWidth="6" />
                  <path d="M10,10 Q15,0 20,10" fill="none" stroke="#3E3E3E" strokeWidth="4" opacity="0.6"/>
                  <path d="M25,10 Q30,0 35,10" fill="none" stroke="#3E3E3E" strokeWidth="4" opacity="0.6"/>
                </g>
              </>
            )}

            {avatarState === "finished" && (
              <>
                {/* Star Eyes & Cheerful wink */}
                <path d="M 23 48 Q 31 38 38 48" fill="none" stroke="#3D3D3D" strokeWidth="5" strokeLinecap="round" />
                {/* Shiny Right eye (Star) */}
                <path d="M 60 45 L 70 51 L 63 56 L 61 64 L 59 56 L 52 51 Z" fill="#EAB308" stroke="#3D3D3D" strokeWidth="2" />
                
                {/* Happy open mouth */}
                <path d="M 40 58 Q 50 74 60 58" fill="#3D3D3D" />
                
                {/* Party Hat */}
                <polygon points="50,2 35,16 65,16" fill="#FF7E67" stroke="#3D3D3D" strokeWidth="4" />
                <circle cx="50" cy="2" r="3" fill="#4ECDC4" stroke="#3D3D3D" strokeWidth="2" />
              </>
            )}

            {avatarState === "distracted" && (
              <>
                {/* Shocked/Sweated worried Eyebrows */}
                <path d="M 22 36 Q 32 30 38 38" fill="none" stroke="#FF7E67" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M 78 36 Q 68 30 62 38" fill="none" stroke="#FF7E67" strokeWidth="4.5" strokeLinecap="round" />
                
                {/* Shocked wide open eyes */}
                <circle cx="32" cy="46" r="7" fill="none" stroke="#3D3D3D" strokeWidth="4" />
                <circle cx="68" cy="46" r="7" fill="none" stroke="#3D3D3D" strokeWidth="4" />
                <circle cx="32" cy="46" r="2.5" fill="#3D3D3D" />
                <circle cx="68" cy="46" r="2.5" fill="#3D3D3D" />

                {/* Big worried Open Mouth */}
                <circle cx="50" cy="65" r="7.5" fill="#3D3D3D" />

                {/* Cold Sweat滴 drop */}
                <path d="M 16,34 Q 14,39 10,39 Q 10,33 16,34" fill="#4ECDC4" stroke="#3D3D3D" strokeWidth="2" />
              </>
            )}
          </svg>
        </div>

        <div className={`px-4 py-1.5 text-xs font-black tracking-widest uppercase rounded-xl border-4 border-[#3D3D3D] ${colorClass} shadow-[2.5px_2.5px_0px_#3D3D3D]`}>
          {statusLabel} • <span className="underline italic">YOLDAŞ</span>
        </div>
      </div>
    );
  };

  // Switch context-specific quick feedback options
  const getSuggestions = () => {
    if (avatarState === "distracted") {
      return [
        "Kısa bir nefes egzersizi yapalım",
        "Hedefimi küçültelim",
        "Sadece 5 dk daha zorlayacağım"
      ];
    }

    if (timerState === "planning") {
      return [
        "Bugün Matematik testini bitireceğiz! 📝",
        "Edebiyat ezber çalışması yapacağım 📖",
        "TYT denemesi çözüp analiz edeceğim 🎯",
        "Kod bloklarını parlatmam lazım 💻"
      ];
    } else if (timerState === "focusing") {
      return [
        "Dikkatim dağıldı, odaklanamıyorum 🥺",
        "Biraz yorulmaya başladım 🥱",
        "Devam etmek için enerjiye ihtiyacım var ⚡"
      ];
    } else if (timerState === "break") {
      return [
        "Molada ne yapabilirim? 🧘‍♂️",
        "Su içtim, esneme yapıyorum! 💧",
        "Bir sonraki oturuma bomba gibi hazırım"
      ];
    } else {
      return [
        "Çalışmayı nasıl değerlendirirsin? 👑",
        "Teşekkürler, harika bir seanstı! 🙌"
      ];
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FFFBF2] border-4 border-[#3D3D3D] rounded-[32px] md:rounded-[40px] shadow-[8px_8px_0px_#3D3D3D] md:shadow-[12px_12px_0px_#3D3D3D] overflow-hidden" id="companion-panel">
      
      {/* Visual Header */}
      <div className="p-5 border-b-4 border-[#3D3D3D] bg-[#FDEEDC] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white border-2 border-[#3D3D3D] text-[#FF7E67]">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase text-[#3D3D3D] tracking-widest leading-none">ODAKLANMA YAKINI</h2>
            <p className="text-[10px] font-bold text-[#FF7E67] tracking-wider uppercase mt-1">SESLİ & YAZILI CAN DESTEK</p>
          </div>
        </div>
        
        {goal && (
          <div className="hidden sm:block text-right max-w-[180px] bg-white border-2 border-[#3D3D3D] px-2.5 py-1 rounded-lg">
            <p className="text-[8px] text-[#3D3D3D] uppercase font-black tracking-widest opacity-60 font-black">SABİT HEDEF</p>
            <p className="text-[10px] text-[#3D3D3D] font-black truncate">{goal}</p>
          </div>
        )}
      </div>

      {/* Dynamic Avatar Container */}
      <div className="px-5 pt-5 bg-[#FFFBF2]">
        {renderAvatar()}
      </div>

      {/* Conversation Thread Area */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 bg-[#FFFBF2] min-h-[180px]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
            <AlertCircle className="w-8 h-8 mb-2 text-[#FF7E67]" />
            <p className="text-xs font-bold">Zihin birlikteliği başlatmak için sorularını yaz dostum.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <motion.div
                key={msg.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-[24px] px-5 py-4 text-xs font-bold leading-relaxed border-4 border-[#3D3D3D] shadow-[3px_3px_0px_#3D3D3D] ${
                    isUser
                      ? "bg-[#FF7E67] text-white rounded-tr-none"
                      : "bg-white text-[#3D3D3D] rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                  <span className={`block text-[9px] mt-2 font-mono ${isUser ? "text-orange-100" : "text-gray-500"}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}

        {isPending && (
          <div className="flex justify-start">
            <div className="bg-white border-4 border-[#3D3D3D] text-[#3D3D3D] rounded-3xl rounded-tl-none px-5 py-3 max-w-[85%] shadow-[3px_3px_0px_#3D3D3D] flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#FF7E67]">Yol arkadaşın düşünüyor</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3D3D3D] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#3D3D3D] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#3D3D3D] animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestions Tray */}
      <div className="px-5 py-3 bg-[#FDEEDC] border-t-4 border-[#3D3D3D]">
        <p className="text-[10px] text-[#3D3D3D] font-black uppercase tracking-widest mb-2.5">HIZLI YANIT ÖNERİLERİ</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {getSuggestions().map((suggestion, idx) => {
            const indexRotations = ["rotate-1", "-rotate-1", "rotate-2", "-rotate-2"];
            const r = indexRotations[idx % indexRotations.length];
            return (
              <button
                key={idx}
                onClick={() => onSelectQuickSuggestion(suggestion)}
                disabled={isPending || isExamModeActive}
                className={`shrink-0 text-[10px] px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FDEEDC] text-[#3D3D3D] font-black uppercase tracking-wider border-2 border-[#3D3D3D] transition-all active:shadow-none shadow-[2px_2px_0px_#3D3D3D] active:translate-y-[2px] disabled:opacity-50 cursor-pointer ${r}`}
              >
                {suggestion}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Submission Panel (Handled disabled in target Exam mode) */}
      <div className="p-4 bg-white border-t-4 border-[#3D3D3D]">
        {isExamModeActive ? (
          <div className="p-3 bg-neutral-100 border-4 border-dashed border-[#FF7E67] rounded-xl text-center text-xs font-black text-[#FF7E67] uppercase tracking-wider">
            Sınav esnasında konuşamazsın şampiyon, sadece işine odaklan!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isPending}
              placeholder={
                timerState === "focusing"
                  ? "Beni bölme şampiyon, şu an hedefe kilitlendin!"
                  : "Sorularını sor veya hedefini gir..."
              }
              className="flex-1 text-xs bg-neutral-50 px-5 py-4 rounded-xl border-4 border-[#3D3D3D] focus:ring-0 outline-none text-[#3D3D3D] font-bold shadow-[3px_3px_0px_#3D3D3D] focus:shadow-none focus:translate-x-[3px] focus:translate-y-[3px] transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isPending}
              className="p-4 rounded-full bg-[#FF7E67] text-white hover:bg-[#ff6950] border-4 border-[#3D3D3D] shadow-[3px_3px_0px_#3D3D3D] disabled:opacity-40 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center cursor-pointer font-black"
              title="Mesaj Gönder"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

    </div>
  );
}

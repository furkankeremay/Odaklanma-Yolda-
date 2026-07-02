import React, { useState, useEffect } from "react";
import { StudyMode, TimerState, ChatMessage, SessionLog } from "./types";
import { useSoundSynth } from "./hooks/useSoundSynth";
import Timer from "./components/Timer";
import CompanionChat from "./components/CompanionChat";
import SessionLogs from "./components/SessionLogs";
import DenemeKokpiti from "./components/DenemeKokpiti";
import YKSSimulator from "./components/YKSSimulator";
import YKSDereceKocluk from "./components/YKSDereceKocluk";
import { Sparkles, Volume2, VolumeX, RefreshCw } from "lucide-react";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithCustomToken } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const TURKEY_CITIES = [
  "Bursa", // Bursa en başta olacak şekilde kurgulandı
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
  "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Çanakkale", "Çankırı", "Çorum", "Denizli",
  "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari",
  "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
  "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir",
  "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
  "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
  "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye",
  "Düzce"
];

export default function App() {
  // Authentication & Database States
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Auth Form State Variables
  const [authFormTab, setAuthFormTab] = useState<"register" | "login">("register");
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [usernameValue, setUsernameValue] = useState("");
  const [cityValue, setCityValue] = useState("");
  const [schoolValue, setSchoolValue] = useState("");
  const [authMsgError, setAuthMsgError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: "greet-1",
        role: "assistant",
        content: "Merhaba şampiyon! 👋 Ben senin kişisel ders, deneme ve odaklanma yoldaşın 'Yoldaş'. Bugün birlikte harika işler başaracağız!\n\nYola çıkmadan önce, bugün tam olarak neye odaklanacağımızı konuşalım. Hedefimiz nedir? Hangi konuyu veya testi yeneceğiz dostum?",
        timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });

  const [mode, setMode] = useState<StudyMode>("pomodoro");
  const [timerState, setTimerState] = useState<TimerState>("planning");
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [goal, setGoal] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isMutedVoice, setIsMutedVoice] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAccordionExpanded, setIsAccordionExpanded] = useState(false);
  const [activeTab, setActiveTab ] = useState<"focus" | "exams" | "simulator" | "coaching">("focus");

  // Ask for browser notification permission on initial mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch((err) => console.log("Notification permission error", err));
    }
  }, []);

  // Firebase & Custom Auth State Listener & Profile Synchronization
  useEffect(() => {
    // 1. Try to restore custom session from localStorage
    const savedToken = localStorage.getItem("yoldas_token");
    const savedUser = localStorage.getItem("yoldas_user");
    const savedProfile = localStorage.getItem("yoldas_profile");

    if (savedToken && savedUser && savedProfile) {
      try {
        setAuthToken(savedToken);
        setUser(JSON.parse(savedUser));
        setProfile(JSON.parse(savedProfile));
        fetchUserProfile(savedToken);
      } catch (e) {
        console.error("Error restoring custom auth session:", e);
      }
    }

    // 2. Fallback Firebase Auth listener if active
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          setAuthToken(token);
          setUser(currentUser);
          fetchUserProfile(token);
        } catch (e) {
          console.error("Error getting user ID token:", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (tokenStr: string) => {
    setProfileLoading(true);
    try {
      const response = await fetch("/api/profiles/me", {
        headers: {
          Authorization: `Bearer ${tokenStr}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile || data);
      } else {
        setProfile(null);
        // Clear expired custom session
        if (localStorage.getItem("yoldas_token")) {
          setUser(null);
          setAuthToken(null);
          localStorage.removeItem("yoldas_token");
          localStorage.removeItem("yoldas_profile");
          localStorage.removeItem("yoldas_user");
        }
      }
    } catch (e) {
      console.error("Error fetching user profile:", e);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveProfile = async (username: string, okulAdi: string) => {
    if (!authToken) return;
    setProfileLoading(true);
    try {
      const response = await fetch("/api/profiles", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ username, okul_adi: okulAdi }),
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile || data);
      } else {
        const err = await response.json();
        alert("Profil kaydedilemedi: " + (err.error || "Bilinmeyen hata"));
      }
    } catch (e: any) {
      alert("Hata oluştu: " + e.message);
    } finally {
      setProfileLoading(false);
    }
  };

  // Bonus Points (Başarı Puanı)
  const [bonusPoints, setBonusPoints] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("basariPuani") || localStorage.getItem("yoldas_bonus_points");
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  });

  // Sub Tasks micro management board (persisted in LocalStorage)
  const [subTasks, setSubTasks] = useState<{ id: string; text: string; completed: boolean }[]>(() => {
    try {
      const saved = localStorage.getItem("yoldas_sub_tasks");
      return saved
        ? JSON.parse(saved)
        : [
            { id: "sub-1", text: "", completed: false },
            { id: "sub-2", text: "", completed: false },
            { id: "sub-3", text: "", completed: false },
          ];
    } catch (e) {
      return [
        { id: "sub-1", text: "", completed: false },
        { id: "sub-2", text: "", completed: false },
        { id: "sub-3", text: "", completed: false },
      ];
    }
  });

  // State Machine driven Avatar Expression mode
  const [avatarState, setAvatarState] = useState<"idle" | "focusing" | "break" | "finished" | "distracted">("idle");

  // Load session logs initially from LocalStorage
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>(() => {
    try {
      const saved = localStorage.getItem("yoldas_session_logs");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Sound synthesis hook
  const soundSynth = useSoundSynth();

  // Save logs to LocalStorage whenever updated
  useEffect(() => {
    localStorage.setItem("yoldas_session_logs", JSON.stringify(sessionLogs));
  }, [sessionLogs]);

  // Save Bonus Points to LocalStorage
  useEffect(() => {
    localStorage.setItem("basariPuani", String(bonusPoints));
    localStorage.setItem("yoldas_bonus_points", String(bonusPoints));
  }, [bonusPoints]);

  // Save Sub Tasks to LocalStorage
  useEffect(() => {
    localStorage.setItem("yoldas_sub_tasks", JSON.stringify(subTasks));
  }, [subTasks]);

  // Coordinate general timerState to target avatar expressions
  useEffect(() => {
    if (avatarState === "distracted") return; // Keep distracted face locked once triggered until interaction
    
    if (timerState === "focusing") {
      setAvatarState("focusing");
    } else if (timerState === "break") {
      setAvatarState("break");
    } else if (timerState === "finished") {
      setAvatarState("finished");
    } else if (timerState === "planning") {
      setAvatarState("idle");
    }
  }, [timerState]);

  // Handle voice synthesis for TTS
  const speakMessage = (text: string) => {
    if (isMutedVoice) return;
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        
        const cleanedText = text
          .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC04-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "")
          .replace(/[*#_`~[\]]/g, "")
          .trim();

        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utterance.lang = "tr-TR";
        
        const voices = window.speechSynthesis.getVoices();
        const trVoice = voices.find(v => v.lang.startsWith("tr"));
        if (trVoice) {
          utterance.voice = trVoice;
        }
        
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn("Speech synthesis error", e);
    }
  };

  // 2. Sending Messages to Express API Endpoint
  const handleSendMessage = async (text: string) => {
    // Resume active focusing facial expression if the distracted buddy provides feedback
    if (avatarState === "distracted") {
      setAvatarState("focusing");
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsPending(true);

    try {
      const response = await fetch("/api/companion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          history: updatedMessages.slice(-10),
          currentMode: mode,
          goal: goal,
          timerState: timerState,
        }),
      });

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `assist-${Date.now()}`,
        role: "assistant",
        content: data.text || "Dostum canımsın, buradayım! Çalışmaya devam.",
        timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      speakMessage(assistantMsg.content);
    } catch (error) {
      console.error("Error communicating with companion back-end:", error);
      
      const errorMsg: ChatMessage = {
        id: `assist-${Date.now()}`,
        role: "assistant",
        content: "Bağlantıda küçük bir rüzgar esti şampiyon ama merak etme ben hep buradayım! Hadi odaklanmaya ve hedefini yapmaya devam edelim.",
        timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsPending(false);
    }
  };

  // 3. Fast Selection / Preset Prompt Suggestion Handles
  const handleSelectQuickSuggestion = (suggestionText: string) => {
    if (timerState === "planning") {
      setGoal(suggestionText.replace(/[📝📖🎯💻]/g, "").trim());
    }
    handleSendMessage(suggestionText);
  };

  // 4. Distraction Intervention Routine ("Dostum acil durum, odağım dağıldı, beni masaya döndür!")
  const handleDistraction = () => {
    soundSynth.playCozyChirp();
    setAvatarState("distracted");
    
    // Auto populate message in the chat thread as user query
    const autoQuery = "Dostum acil durum, odağım dağıldı, beni masaya döndür!";
    handleSendMessage(autoQuery);
  };

  // 5. Completed Session Logging Control (adds points dynamically on complete)
  const handleSessionComplete = (durationMinutes: number, success: boolean) => {
    soundSynth.playCompletionBell();

    if (success) {
      // Award base completion points
      const basePoints = mode === "tyt" ? 100 : mode === "ayt" ? 120 : durationMinutes * 2;
      setBonusPoints(prev => {
        const newScore = prev + basePoints;
        try {
          localStorage.setItem("basariPuani", String(newScore));
          localStorage.setItem("yoldas_bonus_points", String(newScore));
        } catch (e) {
          console.error("Local storage save error", e);
        }
        return newScore;
      });
    }

    const newLog: SessionLog = {
      id: `log-${Date.now()}`,
      duration: durationMinutes,
      mode: mode,
      goal: goal || "Odaklanma Seansı",
      completedAt: new Date().toISOString(),
      success: success,
    };

    setSessionLogs((prev) => [newLog, ...prev]);

    setIsPending(true);
    setTimeout(() => {
      const prompt = success
        ? `Süper haber şampiyon! ${durationMinutes} dakikalık "${mode}" odaklanma seansımı başarıyla TAMAMLADIM! 🥳 Şerefe! Beni coşkuyla tebrik et ve bir sonraki adıma hazırla.`
        : `Dostum, oturumu ${durationMinutes} dakikalık çalışma sonrası yarıda bırakmak zorunda kaldım. Yine de gösterdiğim çaba için beni cesaretlendirir misin?`;

      handleSendMessage(prompt);
    }, 100);
  };

  // Triggers break vocal support
  useEffect(() => {
    if (timerState === "break") {
      speakMessage("Harika iş şampiyon! Süre tamamlandı. Şimdi derin bir nefes al, ekrandan uzaklaş ve bir bardak su içerek esneme hareketleri yap!");
    }
  }, [timerState]);

  const handleClearLogs = () => {
    const confirmClear = window.confirm("Çalışma istatistiklerini, başarı puanını ve seans geçmişini sıfırlamak istediğinden emin misin?");
    if (confirmClear) {
      setSessionLogs([]);
      setBonusPoints(0);
      try {
        localStorage.setItem("basariPuani", "0");
        localStorage.setItem("yoldas_bonus_points", "0");
      } catch (e) {}
      setSubTasks([
        { id: "sub-1", text: "", completed: false },
        { id: "sub-2", text: "", completed: false },
        { id: "sub-3", text: "", completed: false },
      ]);
    }
  };

  // If no authenticated user session exists, display the Neo-Brutalist cover Landing Page completely blocking interior access
  if (!user) {
    return (
      <div className="w-screen h-screen bg-[#faf8f5] overflow-hidden relative flex items-center justify-center p-4">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
        
        {/* Silik floating YKS elements */}
        <div className="absolute top-10 left-10 text-3xl opacity-10 select-none animate-bounce" style={{ animationDuration: "6s" }}>📚</div>
        <div className="absolute bottom-20 left-20 text-3xl opacity-10 select-none animate-bounce" style={{ animationDuration: "8s" }}>📐</div>
        <div className="absolute top-24 right-20 text-4xl opacity-10 select-none animate-pulse">⏱️</div>
        <div className="absolute bottom-10 right-10 text-3xl opacity-10 select-none animate-bounce" style={{ animationDuration: "5s" }}>TYT</div>
        <div className="absolute top-1/2 left-10 text-2xl opacity-10 select-none">AYT</div>
        <div className="absolute top-1/3 right-1/4 text-2xl opacity-10 font-black tracking-widest uppercase select-none">+4y</div>

        <div className="max-w-4xl w-full border-4 border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 overflow-y-auto max-h-[95vh] rounded-[24px]">
          {/* SOL SÜTUN: MÜŞTERİ YAKALAMA (HOOK) VE ÖZELLİK PANELDEN */}
          <div className="flex flex-col justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black border-b-4 border-black pb-2 mb-4 flex items-center gap-2">
                🎯 YKS KOKPİTİNE HOŞ GELDİN
              </h2>
              
              <div className="space-y-3">
                <div className="border-3 border-black p-3 rounded-xl bg-[#FFFBF2] shadow-[3px_3px_0px_rgba(0,0,0,1)]">
                  <p className="text-[11px] font-black text-black uppercase leading-tight">⚡ Pomodoro & Odaklanma Masası</p>
                  <p className="text-[9.5px] text-gray-600 font-bold mt-1 uppercase leading-snug">
                    Kronometre karmaşasını bitir, YKS maraton modlarıyla (40Hz Binaural Beats) zaman algısını yok et!
                  </p>
                </div>

                <div className="border-3 border-black p-3 rounded-xl bg-[#FFFBF2] shadow-[3px_3px_0px_rgba(0,0,0,1)]">
                  <p className="text-[11px] font-black text-black uppercase leading-tight">📸 AI Deneme Tarayıcı</p>
                  <p className="text-[9.5px] text-gray-600 font-bold mt-1 uppercase leading-snug">
                    Deneme kitapçığının üstüne netlerini yaz, fotoğrafını çek; yapay zeka saniyeler içinde sistemine işlesin!
                  </p>
                </div>

                <div className="border-3 border-black p-3 rounded-xl bg-[#FFFBF2] shadow-[3px_3px_0px_rgba(0,0,0,1)]">
                  <p className="text-[11px] font-black text-black uppercase leading-tight">📊 Detaylı Branş Analizi</p>
                  <p className="text-[9.5px] text-gray-600 font-bold mt-1 uppercase leading-snug">
                    TYT (40-20-40-20) ve AYT (Mat, Fiz, Kim, Bio) tüm branş netlerini tek ekranda filtrele, gelişimini gör.
                  </p>
                </div>

                <div className="border-3 border-black p-3 rounded-xl bg-[#FFFBF2] shadow-[3px_3px_0px_rgba(0,0,0,1)]">
                  <p className="text-[11px] font-black text-[#FF7E67] uppercase leading-tight flex items-center gap-1">
                    🏆 Okul İçi Sıralama <span className="text-[7.5px] bg-[#FF7E67] text-white px-1 py-0.2 rounded-sm font-black">YAKINDA</span>
                  </p>
                  <p className="text-[9.5px] text-gray-600 font-bold mt-1 uppercase leading-snug">
                    BTSO Hüseyin Sungur Anadolu Lisesi içindeki gerçek yerini ve Türkiye geneli rankingini gör, rekabete katıl!
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 md:mt-0 pt-4 border-t-2 border-dashed border-gray-200 text-center">
              <span className="text-[8.5px] font-black text-neutral-400 tracking-wider uppercase">
                ⚡ GÜCÜNÜ YAPAY ZEKADAN VE BULUT VERİTABANINDAN ALIR
              </span>
            </div>
          </div>

          {/* SAĞ SÜTUN: DİNAMİK GİRİŞ / KAYIT FORMU */}
          <div className="flex flex-col justify-center">
            {/* Form Üstü Tab Butonları */}
            <div className="flex border-3 border-black rounded-xl p-1 bg-neutral-100 gap-1.5 mb-5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAuthFormTab("register");
                  setAuthMsgError(null);
                }}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer border-2 ${
                  authFormTab === "register"
                    ? "bg-[#FFE65C] border-black text-black shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                    : "bg-white border-transparent text-neutral-500 hover:text-black"
                }`}
              >
                KAYIT OL
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthFormTab("login");
                  setAuthMsgError(null);
                }}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer border-2 ${
                  authFormTab === "login"
                    ? "bg-[#FFE65C] border-black text-black shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                    : "bg-white border-transparent text-neutral-500 hover:text-black"
                }`}
              >
                GİRİŞ YAP
              </button>
            </div>

            {authMsgError && (
              <div className="p-3 bg-red-50 border-3 border-red-500 rounded-xl text-red-700 font-bold text-[10px] mb-4 uppercase tracking-wide leading-relaxed">
                ⚠️ {authMsgError}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (authSubmitting) return;

                setAuthSubmitting(true);
                setAuthMsgError(null);

                try {
                  if (authFormTab === "register") {
                    if (!usernameValue.trim()) {
                      setAuthMsgError("Lütfen bir kullanıcı adı belirle!");
                      setAuthSubmitting(false);
                      return;
                    }
                    if (!cityValue) {
                      setAuthMsgError("Lütfen bir şehir seç dostum!");
                      setAuthSubmitting(false);
                      return;
                    }
                    if (cityValue !== "Bursa") {
                      setAuthMsgError("Bu ilde henüz pilot okul bulunmuyor! Şimdilik sadece Bursa ili aktiftir.");
                      setAuthSubmitting(false);
                      return;
                    }
                    if (!schoolValue || schoolValue === "Bu ilde henüz pilot okul bulunmuyor") {
                      setAuthMsgError("Lütfen geçerli bir okul seç dostum!");
                      setAuthSubmitting(false);
                      return;
                    }
                    if (passwordValue.length < 6) {
                      setAuthMsgError("Şifren en az 6 karakter olmalıdır dostum!");
                      setAuthSubmitting(false);
                      return;
                    }

                    const response = await fetch("/api/auth/register", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        email: emailValue,
                        password: passwordValue,
                        username: usernameValue.trim(),
                        okul_adi: schoolValue,
                        sehir_adi: cityValue,
                      }),
                    });

                    if (!response.ok) {
                      const errData = await response.json();
                      throw new Error(errData.error || "Kayıt işlemi başarısız.");
                    }

                    const { customToken, profile: newProfile } = await response.json();

                    // Save custom session
                    const customUserObj = { uid: newProfile.id, email: newProfile.email || emailValue, displayName: newProfile.username };
                    localStorage.setItem("yoldas_token", customToken);
                    localStorage.setItem("yoldas_profile", JSON.stringify(newProfile));
                    localStorage.setItem("yoldas_user", JSON.stringify(customUserObj));

                    setAuthToken(customToken);
                    setProfile(newProfile);
                    setUser(customUserObj as any);
                  } else {
                    const response = await fetch("/api/auth/login", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        email: emailValue,
                        password: passwordValue,
                      }),
                    });

                    if (!response.ok) {
                      const errData = await response.json();
                      throw new Error(errData.error || "Giriş işlemi başarısız.");
                    }

                    const { customToken, profile: loggedInProfile } = await response.json();

                    // Save custom session
                    const customUserObj = { uid: loggedInProfile.id, email: loggedInProfile.email || emailValue, displayName: loggedInProfile.username };
                    localStorage.setItem("yoldas_token", customToken);
                    localStorage.setItem("yoldas_profile", JSON.stringify(loggedInProfile));
                    localStorage.setItem("yoldas_user", JSON.stringify(customUserObj));

                    setAuthToken(customToken);
                    setProfile(loggedInProfile);
                    setUser(customUserObj as any);
                  }
                } catch (err: any) {
                  console.error("Kayıt Sırasında Gerçekleşen Hata:", err);
                  const displayMsg = err.code ? `Hata Kodu: ${err.code}\nMesaj: ${err.message}` : err.message;
                  alert(displayMsg);
                  setAuthMsgError(displayMsg);
                } finally {
                  setAuthSubmitting(false);
                }
              }}
              className="space-y-3.5 text-left"
            >
              {authFormTab === "register" && (
                <div>
                  <label className="text-[10px] font-black text-black uppercase tracking-wider block mb-1">
                    Kullanıcı Adı:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: YksCanavari"
                    value={usernameValue}
                    onChange={(e) => setUsernameValue(e.target.value)}
                    className="w-full border-3 border-black p-2.5 text-xs font-bold rounded-xl bg-neutral-50 focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-black text-black uppercase tracking-wider block mb-1">
                  E-posta Adresi:
                </label>
                <input
                  type="email"
                  required
                  placeholder="Örn: sampiyon@yoldas.com"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  className="w-full border-3 border-black p-2.5 text-xs font-bold rounded-xl bg-neutral-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-black uppercase tracking-wider block mb-1">
                  Şifre:
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  className="w-full border-3 border-black p-2.5 text-xs font-bold rounded-xl bg-neutral-50 focus:bg-white focus:outline-none"
                />
              </div>

              {authFormTab === "register" && (
                <>
                  <div>
                    <label className="text-[10px] font-black text-black uppercase tracking-wider block mb-1">
                      Şehir:
                    </label>
                    <select
                      value={cityValue}
                      onChange={(e) => {
                        const selectedCity = e.target.value;
                        setCityValue(selectedCity);
                        if (selectedCity === "Bursa") {
                          setSchoolValue("BTSO Hüseyin Sungur Anadolu Lisesi");
                        } else {
                          setSchoolValue("");
                        }
                      }}
                      className="w-full border-4 border-black p-3 font-bold rounded-xl bg-[#FFFBF2] text-black text-xs focus:outline-none"
                      required
                    >
                      <option value="">Şehir Seçiniz</option>
                      {TURKEY_CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-black uppercase tracking-wider block mb-1">
                      Okulun:
                    </label>
                    <select
                      value={schoolValue}
                      onChange={(e) => setSchoolValue(e.target.value)}
                      className="w-full border-4 border-black p-3 font-bold rounded-xl bg-[#FFFBF2] text-black text-xs focus:outline-none"
                      required
                      disabled={!cityValue}
                    >
                      {!cityValue ? (
                        <option value="">Lütfen Önce Şehir Seçiniz</option>
                      ) : cityValue === "Bursa" ? (
                        <>
                          <option value="BTSO Hüseyin Sungur Anadolu Lisesi">
                            BTSO Hüseyin Sungur Anadolu Lisesi
                          </option>
                          <option value="Bursa Anadolu Lisesi">
                            Bursa Anadolu Lisesi
                          </option>
                        </>
                      ) : (
                        <option value="Bu ilde henüz pilot okul bulunmuyor">
                          Bu ilde henüz pilot okul bulunmuyor
                        </option>
                      )}
                    </select>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-3 bg-[#ff5c5c] hover:bg-[#ff4444] border-4 border-black shadow-[4px_4px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none text-white font-black text-xs sm:text-sn tracking-wider uppercase cursor-pointer inline-flex items-center justify-center gap-2"
              >
                {authSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  "KOKPİTE GİRİŞ YAP 🚀"
                )}
              </button>
            </form>

            <div className="flex items-center my-4">
              <div className="flex-1 h-0.5 bg-black/20" />
              <span className="px-2.5 text-[8.5px] font-neutral-500 font-bold uppercase tracking-widest text-[#888]">
                VEYA GOOGLE İLE DEVAM ET
              </span>
              <div className="flex-1 h-0.5 bg-black/20" />
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  const provider = new GoogleAuthProvider();
                  await signInWithPopup(auth, provider);
                } catch (err: any) {
                  alert("Giriş başarısız oldu dostum: " + err.message);
                }
              }}
              className="w-full bg-[#FFF2A3] hover:bg-[#ffe65c] text-black border-4 border-black p-3 rounded-xl font-black text-xs tracking-wider uppercase shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer inline-flex items-center justify-center gap-2"
            >
              🌐 GOOGLE HESABI İLE BAĞLAN
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#FFFBF2] text-[#3D3D3D] font-sans flex flex-col relative select-none w-full max-w-full">
      
      {/* Decorative Background Blur Elements */}
      <div className="absolute -top-10 -right-10 w-96 h-96 bg-[#4ECDC4] rounded-full opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 -left-10 w-80 h-80 bg-[#FF7E67] rounded-full opacity-10 blur-3xl pointer-events-none" />

      {/* Visual Header */}
      <header className={`px-6 py-2 bg-white border-b-4 border-[#3D3D3D] shrink-0 sticky top-0 z-50 shadow-sm transition-all duration-500 ease-in-out ${
        isZenMode ? "opacity-0 -translate-y-full h-0 p-0 overflow-hidden border-b-0 pointer-events-none" : "opacity-100"
      }`}>
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 py-1">
          
          <div className="flex items-center gap-3">
            <div className="bg-[#FF7E67] text-white w-9 h-9 rounded-full flex items-center justify-center text-lg font-black italic border-3 border-[#3D3D3D] shadow-[2.5px_2.5px_0px_#3D3D3D] shrink-0">
              🎓
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black tracking-tighter uppercase italic text-[#FF7E67] flex items-center gap-1.5 leading-none">
                ODAK YOLDAŞIM
                <span className="text-[9px] bg-[#3D3D3D] text-[#FFFBF2] font-black not-italic px-1.5 py-0.5 rounded-sm tracking-normal">KOKPİT v3.5</span>
              </h1>
              <p className="text-[10px] font-bold opacity-60 leading-none mt-1">Süreçlerinde daima destek olan arkadaş canlısı yoldaşın</p>
            </div>
          </div>

          {/* BRUTALIST TAB SWITCHER */}
          <div className="flex items-center gap-1 bg-neutral-100 border-3 border-[#3D3D3D] rounded-xl p-1 shadow-[3px_3px_0px_#3D3D3D] flex-wrap md:flex-nowrap">
            <button
              type="button"
              onClick={() => setActiveTab("focus")}
              className={`px-2.5 py-1.5 sm:px-4 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "focus"
                  ? "bg-[#FF7E67] text-white border-2 border-[#3D3D3D] shadow-[1.5px_1.5px_0px_#3D3D3D] translate-y-[-1px]"
                  : "bg-transparent text-[#3D3D3D]/60 hover:text-[#3D3D3D] border-2 border-transparent"
              }`}
            >
              🎯 Odak Kokpiti
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("exams")}
              className={`px-2.5 py-1.5 sm:px-4 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "exams"
                  ? "bg-[#4ECDC4] text-[#3D3D3D] border-2 border-[#3D3D3D] shadow-[1.5px_1.5px_0px_#3D3D3D] translate-y-[-1px]"
                  : "bg-transparent text-[#3D3D3D]/60 hover:text-[#3D3D3D] border-2 border-transparent"
              }`}
            >
              📊 Deneme Analiz Kokpiti
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("simulator")}
              className={`px-2.5 py-1.5 sm:px-4 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "simulator"
                  ? "bg-[#FFE65C] text-black border-2 border-[#3D3D3D] shadow-[1.5px_1.5px_0px_#3D3D3D] translate-y-[-1px]"
                  : "bg-transparent text-[#3D3D3D]/60 hover:text-[#3D3D3D] border-2 border-transparent"
              }`}
            >
              🧙‍♂️ YKS Simülatörü & Hedef Sihirbazı
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("coaching")}
              className={`px-2.5 py-1.5 sm:px-4 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "coaching"
                  ? "bg-[#D5F5E3] text-black border-2 border-[#3D3D3D] shadow-[1.5px_1.5px_0px_#3D3D3D] translate-y-[-1px]"
                  : "bg-transparent text-[#3D3D3D]/60 hover:text-[#3D3D3D] border-2 border-transparent"
              }`}
            >
              🎓 Derece Koçluk Sistemi
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {user ? (
              <div className="flex items-center gap-2 bg-[#FFFBF2] border-2 border-black p-1 px-2.5 rounded-xl shadow-[2px_2px_0px_#3D3D3D]">
                {user.photoURL && (
                  <img src={user.photoURL} alt="Avatar" className="w-5 h-5 rounded-full border border-black shrink-0" referrerPolicy="no-referrer" />
                )}
                <span className="text-[9.5px] font-black uppercase text-black max-w-[110px] truncate">
                  {profile?.username || user.displayName || "Yoldaş"}
                </span>
                <button
                  onClick={async () => {
                    await signOut(auth).catch(() => {});
                    setUser(null);
                    setAuthToken(null);
                    setProfile(null);
                    localStorage.removeItem("yoldas_token");
                    localStorage.removeItem("yoldas_profile");
                    localStorage.removeItem("yoldas_user");
                  }}
                  className="text-[8px] bg-[#FF7E67] text-white px-2 py-1 rounded-md border border-black font-black hover:bg-red-500 cursor-pointer transition-all uppercase leading-none"
                >
                  Çıkış
                </button>
              </div>
            ) : null}

            <button
              onClick={() => {
                setIsMutedVoice(!isMutedVoice);
                if (isMutedVoice) {
                  setTimeout(() => speakMessage("Yoldaş'ın ses asistanı aktif edildi!"), 100);
                }
              }}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 border-[#3D3D3D] transition-all flex items-center gap-1.5 cursor-pointer shadow-[2.5px_2.5px_0px_#3D3D3D] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none ${
                isMutedVoice
                  ? "bg-white text-gray-500 hover:bg-gray-50"
                  : "bg-[#FDEEDC] text-[#FF7E67] hover:bg-[#fedbc2]"
              }`}
              title={isMutedVoice ? "Sesli Anlatımı Aç" : "Sesli Anlatımı Kapat"}
            >
              {isMutedVoice ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Ses Kapalı</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                  <span>Konuşuyor</span>
                </>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Main Layout Stack Feed - Realist Two Column No Scroll Frame */}
      {activeTab === "focus" ? (
        <main className={`grid grid-cols-1 ${isZenMode ? "md:grid-cols-1" : "md:grid-cols-2"} gap-6 w-full max-w-[1400px] mx-auto h-[calc(100vh-125px)] overflow-hidden items-stretch p-4 z-10 min-h-0 flex-1`}>
          
          {/* SOL KOLON: DEVASA SAYAÇ VE MODLAR (50% Genişlik) */}
          <div className={`h-full min-h-0 flex flex-col transition-all duration-500 w-full box-border ${isZenMode ? "max-w-3xl mx-auto" : ""}`}>
            <Timer
              mode={mode}
              onChangeMode={setMode}
              timerState={timerState}
              onStateChange={setTimerState}
              secondsRemaining={secondsRemaining}
              setSecondsRemaining={setSecondsRemaining}
              goal={goal}
              setGoal={setGoal}
              onDistraction={handleDistraction}
              onSessionComplete={handleSessionComplete}
              subTasks={subTasks}
              setSubTasks={setSubTasks}
              bonusPoints={bonusPoints}
              setBonusPoints={setBonusPoints}
              isZenMode={isZenMode}
              onToggleZen={() => setIsZenMode(!isZenMode)}
              soundHooks={{
                activePreset: soundSynth.activePreset,
                activeChannels: soundSynth.activeChannels,
                channelVolumes: soundSynth.channelVolumes,
                setChannelVolume: soundSynth.setChannelVolume,
                volume: soundSynth.volume,
                setVolume: soundSynth.setVolume,
                isPlaying: soundSynth.isPlaying,
                handleTogglePlay: soundSynth.handleTogglePlay,
                playCozyChirp: soundSynth.playCozyChirp,
                playRetroAlarm: soundSynth.playRetroAlarm
              }}
            />
          </div>

          {/* SAĞ KOLON: SESLER VE KARNE (50% Genişlik) */}
          {!isZenMode && (
            <div className="w-full h-full flex flex-col justify-between overflow-hidden gap-4 box-border" id="right-column-panel">
              
              {/* 1. ÜST ALAN: ÇALISMA AMORTİSÖRÜ (AMBIANS SESLERİ) */}
              <div className="bg-white border-4 border-black rounded-[24px] md:rounded-[32px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] px-6 py-4 flex flex-col justify-center shrink-0 transition-all h-[140px] md:h-[150px] overflow-hidden box-border">
                {/* Minimalist Brutalist Boşluk ve isteğe bağlı küçük yüzen durum eğer ses aktifse */}
                {soundSynth.isPlaying && (
                  <div className="flex justify-end mb-1 shrink-0 h-4">
                    <span className="text-[8px] bg-[#4ECDC4] text-black border-2 border-black px-1.5 py-0.5 rounded font-black tracking-wider uppercase leading-none">
                      ⚡ SES AKTİF
                    </span>
                  </div>
                )}

                {/* Ambient Synthesizer Buttons Grid - Exactly 4 buttons with safe container boundaries */}
                <div className={`grid grid-cols-4 gap-3 md:gap-4 items-center w-full px-1 ${soundSynth.isPlaying ? "h-auto mt-1 mb-1 shrink-0" : "flex-1 h-full my-auto"}`}>
                  {[
                    { id: "binaural", name: "Binaural Beats", em: "🧠" },
                    { id: "lofi", name: "Lo-Fi", em: "🎵" },
                    { id: "brownnoise", name: "Brown Noise", em: "🟫" },
                    { id: "rain", name: "Yağmur", em: "🌧️" }
                  ].map((sound, idx) => {
                    const isChosen = soundSynth.activeChannels[sound.id as keyof typeof soundSynth.activeChannels];
                    const rotate = idx % 2 === 0 ? "rotate-1" : "-rotate-1";

                    return (
                      <button
                        key={sound.id}
                        type="button"
                        onClick={() => soundSynth.handleTogglePlay(sound.id)}
                        className={`px-0.5 rounded-xl text-center border-2 border-black transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${rotate} ${
                          soundSynth.isPlaying
                            ? "py-1 h-auto flex flex-col justify-center items-center gap-0.5"
                            : "py-4 h-full flex flex-col justify-center items-center gap-2"
                        } ${
                          isChosen
                            ? "bg-[#FF7E67] text-white font-black animate-none"
                            : "bg-white text-[#3D3D3D] hover:bg-orange-50/50"
                        } font-sans`}
                      >
                        <div className={`leading-none transition-all duration-300 ${
                          soundSynth.isPlaying
                            ? "text-xl"
                            : "text-3xl md:text-4xl"
                        }`}>
                          {sound.em}
                        </div>
                        <div className={`font-black uppercase leading-tight break-words select-none transition-all duration-300 ${
                          soundSynth.isPlaying
                            ? "text-[9px] md:text-xs"
                            : "text-sm md:text-base font-bold"
                        }`}>
                          {sound.name}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Unique Master Volume Slider */}
                {soundSynth.isPlaying ? (
                  <div className="p-1.5 bg-[#FDEEDC] border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-0.5 transition-all mt-auto mb-0.5 animate-fadeIn shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[7.5px] text-[#3D3D3D] font-black uppercase tracking-wider flex items-center gap-1 leading-none">
                        <span>🎛️ Genel Ses Seviyesi</span>
                      </span>
                      <span className="text-[8px] font-mono font-black text-[#FF7E67] leading-none">
                        %{Math.round(soundSynth.volume * 100)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 h-4">
                      <span className="text-[8px] leading-none">🔈</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={soundSynth.volume}
                        onChange={(e) => soundSynth.setVolume(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white border-1.5 border-black rounded-lg accent-[#FF7E67] cursor-pointer"
                      />
                      <span className="text-[8px] leading-none">🔊</span>
                    </div>
                  </div>
                ) : (
                  <div className="hidden" />
                )}
              </div>

              {/* 3. ALT ALAN: BAŞARI KARNEN VE SEANS GEÇMİSİ */}
              <div className="flex-1 min-h-0 flex flex-col">
                <SessionLogs
                  logs={sessionLogs}
                  onClearLogs={handleClearLogs}
                  bonusPoints={bonusPoints}
                />
              </div>
            </div>
          )}

        </main>
      ) : activeTab === "exams" ? (
        <main className="w-full max-w-[1400px] mx-auto h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] overflow-y-auto p-4 pr-6 pb-8 z-10 min-h-0 flex-1 flex flex-col box-border">
          <div className="flex-1 min-h-0">
            {profileLoading ? (
              <div className="w-full max-w-md mx-auto bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] text-center my-10 font-bold uppercase text-black">
                <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-4 text-[#FF7E67]" />
                Veritabanı Kimliği Doğrulanıyor...
              </div>
            ) : !profile ? (
              <div className="w-full max-w-lg mx-auto bg-white border-4 border-black rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] my-10">
                <div className="text-4xl text-center mb-3">🎓</div>
                <h3 className="text-md md:text-lg font-black text-black uppercase tracking-tight text-center">
                  Şampiyon Kaydını Tamamla!
                </h3>
                <p className="text-[9.5px] text-gray-500 font-bold uppercase tracking-wider text-center mt-1">
                  Sıralamada yerini almak için okulunun adını gir dostum
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const username = (form.elements.namedItem("username") as HTMLInputElement).value;
                    const schoolName = (form.elements.namedItem("school") as HTMLInputElement).value;
                    if (!username.trim() || !schoolName.trim()) {
                      alert("Lütfen tüm alanları doldur dostum!");
                      return;
                    }
                    handleSaveProfile(username.trim(), schoolName.trim());
                  }}
                  className="mt-6 space-y-4"
                >
                  <div>
                    <label className="text-[10px] font-black text-black uppercase tracking-wider block mb-1">
                      Kullanıcı Adı / Takma Ad:
                    </label>
                    <input
                      type="text"
                      name="username"
                      required
                      placeholder="Örn: YksCanavari"
                      defaultValue={user.displayName || ""}
                      className="w-full border-3 border-black p-3 text-xs font-bold rounded-xl bg-neutral-50 focus:bg-white focus:outline-none uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-black uppercase tracking-wider block mb-1">
                      Okulu / Kurumu:
                    </label>
                    <select
                      name="school"
                      className="w-full border-4 border-black p-3 font-bold rounded-xl bg-[#FFFBF2] text-black text-xs focus:outline-none uppercase"
                      required
                    >
                      <option value="BTSO Hüseyin Sungur Anadolu Lisesi">
                        BTSO Hüseyin Sungur Anadolu Lisesi
                      </option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#4ECDC4] hover:bg-[#3dbdb3] text-black border-4 border-black p-3.5 rounded-xl font-black text-xs tracking-wider uppercase shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
                  >
                    🚀 BAŞLAYALIM! KOKPİTE GİRİŞ YAP
                  </button>
                </form>
              </div>
            ) : (
              <DenemeKokpiti
                user={user}
                token={authToken}
                profile={profile}
                onRefreshProfile={() => authToken && fetchUserProfile(authToken)}
              />
            )}
          </div>
        </main>
      ) : activeTab === "simulator" ? (
        <main className="w-full max-w-[1400px] mx-auto h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] overflow-y-auto p-4 pr-6 pb-8 z-10 min-h-0 flex-1 flex flex-col box-border">
          <div className="flex-1 min-h-0">
            {profileLoading ? (
              <div className="w-full max-w-md mx-auto bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] text-center my-10 font-bold uppercase text-black">
                <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-4 text-[#FF7E67]" />
                Veritabanı Kimliği Doğrulanıyor...
              </div>
            ) : !profile ? (
              <div className="w-full max-w-lg mx-auto bg-white border-4 border-black rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] my-10">
                <div className="text-4xl text-center mb-3">🎓</div>
                <h3 className="text-md md:text-lg font-black text-black uppercase tracking-tight text-center">
                  Şampiyon Kaydını Tamamla!
                </h3>
                <p className="text-[9.5px] text-gray-500 font-bold uppercase tracking-wider text-center mt-1">
                  Sıralamada yerini almak için okulunun adını gir dostum
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const username = (form.elements.namedItem("username") as HTMLInputElement).value;
                    const schoolName = (form.elements.namedItem("school") as HTMLInputElement).value;
                    if (!username.trim() || !schoolName.trim()) {
                      alert("Lütfen tüm alanları doldur dostum!");
                      return;
                    }
                    handleSaveProfile(username.trim(), schoolName.trim());
                  }}
                  className="mt-6 space-y-4"
                >
                  <div>
                    <label className="text-[10px] font-black text-black uppercase tracking-wider block mb-1">
                      Kullanıcı Adı / Takma Ad:
                    </label>
                    <input
                      type="text"
                      name="username"
                      required
                      placeholder="Örn: YksCanavari"
                      defaultValue={user.displayName || ""}
                      className="w-full border-3 border-black p-3 text-xs font-bold rounded-xl bg-neutral-50 focus:bg-white focus:outline-none uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-black uppercase tracking-wider block mb-1">
                      Okulu / Kurumu:
                    </label>
                    <select
                      name="school"
                      className="w-full border-4 border-black p-3 font-bold rounded-xl bg-[#FFFBF2] text-black text-xs focus:outline-none uppercase"
                      required
                    >
                      <option value="BTSO Hüseyin Sungur Anadolu Lisesi">
                        BTSO Hüseyin Sungur Anadolu Lisesi
                      </option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#4ECDC4] hover:bg-[#3dbdb3] text-black border-4 border-black p-3.5 rounded-xl font-black text-xs tracking-wider uppercase shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
                  >
                    🚀 BAŞLAYALIM! KOKPİTE GİRİŞ YAP
                  </button>
                </form>
              </div>
            ) : (
              <YKSSimulator
                token={authToken}
                profile={profile}
              />
            )}
          </div>
        </main>
      ) : (
        <main className="w-full max-w-[1400px] mx-auto h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] overflow-y-auto p-4 pr-6 pb-8 z-10 min-h-0 flex-1 flex flex-col box-border">
          <div className="flex-1 min-h-0">
            <YKSDereceKocluk />
          </div>
        </main>
      )}

      {/* Footer Design Credits */}
      <footer className={`py-1.5 border-t-4 border-[#3D3D3D] bg-white text-center text-[10px] font-bold text-gray-600 z-10 shrink-0 transition-all duration-500 ease-in-out ${
        isZenMode ? "opacity-0 translate-y-full h-0 py-0 overflow-hidden border-t-0 pointer-events-none" : "opacity-100"
      }`}>
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <p>© 2026 Odaklanma Yoldaşı. Şampiyonların bir numaralı çalışma koçu.</p>
          <p className="opacity-70">
            Masaüstü Kokpit Modu • Güç: <span className="text-[#FF7E67] font-black">Gemini 3.5 Flash</span>
          </p>
        </div>
      </footer>

      {/* 4. SAĞ ALT KÖŞEDE AÇILIR-KAPANIR SOHBET BOTU WIDGET */}
      {!isZenMode && (
        <>
          {/* Floating Toggle Button - Simplified Round Neo-Brutalist Chat Bubble Icon */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#4ECDC4] text-[#3D3D3D] border-4 border-[#3D3D3D] rounded-full flex items-center justify-center text-xl shadow-[3px_3px_0px_#3D3D3D] hover:scale-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            id="chat-toggle-btn"
            title="Odak Yoldaşım"
          >
            <span>💬</span>
            {isPending && (
              <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse border-2 border-white" />
            )}
          </button>

          {/* Collapsible Chat Widget Pop-up Container */}
          <div
            className="fixed bottom-24 right-6 w-[360px] h-[520px] max-h-[80vh] z-[9999] flex flex-col bg-white rounded-[32px] overflow-hidden border-4 border-[#3D3D3D] shadow-[8px_8px_0px_#3D3D3D] transition-all duration-300 transform"
            style={{ 
              display: isChatOpen ? "flex" : "none"
            }}
          >
            <div className="absolute top-4 right-4 z-[10000]">
              <button
                onClick={() => setIsChatOpen(false)}
                className="w-7 h-7 flex items-center justify-center bg-[#FF7E67] text-white border-2 border-[#3D3D3D] rounded-lg font-black text-xs shadow-[1.5px_1.5px_0px_#3D3D3D] hover:bg-red-500 active:translate-y-0.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CompanionChat
                messages={messages}
                onSendMessage={handleSendMessage}
                isPending={isPending}
                timerState={timerState}
                currentMode={mode}
                goal={goal}
                onSelectQuickSuggestion={handleSelectQuickSuggestion}
                avatarState={avatarState}
              />
            </div>
          </div>
        </>
      )}

    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Trash2, PlusCircle, TrendingUp, BarChart2, BookOpen, FileCheck, Camera, Sparkles, AlertCircle, RefreshCw, Trophy, Users } from "lucide-react";

export interface Deneme {
  id: string | number;
  name: string;
  type: string;
  turkceD: number;
  turkceY: number;
  turkceN: number;
  sosyalD: number;
  sosyalY: number;
  sosyalN: number;
  matematikD: number;
  matematikY: number;
  matematikN: number;
  fenD: number;
  fenY: number;
  fenN: number;
  totalNet: number;
  createdAt: string;
}

interface DenemeKokpitiProps {
  user: any;
  token: string | null;
  profile: any;
  onRefreshProfile: () => void;
}

export default function DenemeKokpiti({ user, token, profile, onRefreshProfile }: DenemeKokpitiProps) {
  const [denemeler, setDenemeler] = useState<Deneme[]>([]);
  const [loading, setLoading] = useState(false);
  const [rankings, setRankings] = useState<any[]>([]);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"list" | "rankings">("list");

  // Current Input Mode: "manual" | "ocr"
  const [inputMode, setInputMode] = useState<"manual" | "ocr">("manual");
  
  // OCR processing states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("TYT");

  const [turkceD, setTurkceD] = useState<string>("");
  const [turkceY, setTurkceY] = useState<string>("");

  const [sosyalD, setSosyalD] = useState<string>("");
  const [sosyalY, setSosyalY] = useState<string>("");

  const [matematikD, setMatematikD] = useState<string>("");
  const [matematikY, setMatematikY] = useState<string>("");

  const [fenD, setFenD] = useState<string>("");
  const [fenY, setFenY] = useState<string>("");

  // Filter state
  // "Hepsi" | "TYT" | "AYT" | "Branş"
  const [filter, setFilter] = useState<"Hepsi" | "TYT" | "AYT" | "Branş">("Hepsi");

  const fetchDenemeler = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch("/api/denemeler", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((d: any) => ({
          id: d.id,
          name: d.denemeAdi,
          type: d.denemeTuru,
          turkceD: 0,
          turkceY: 0,
          turkceN: d.turkceNet,
          sosyalD: 0,
          sosyalY: 0,
          sosyalN: d.sosyalNet,
          matematikD: 0,
          matematikY: 0,
          matematikN: d.matematikNet,
          fenD: 0,
          fenY: 0,
          fenN: d.fenNet,
          totalNet: d.toplamNet,
          createdAt: d.createdAt,
        }));
        setDenemeler(mapped);
      }
    } catch (e) {
      console.error("Error fetching trials:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRankings = async () => {
    if (!token) return;
    setRankingsLoading(true);
    try {
      const response = await fetch("/api/rankings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRankings(data);
      }
    } catch (e) {
      console.error("Error fetching rankings:", e);
    } finally {
      setRankingsLoading(false);
    }
  };

  useEffect(() => {
    fetchDenemeler();
    fetchRankings();
  }, [token]);

  // Subject configurations and upper limits/lessons configurations
  const getSubjectConfig = (typeStr: string) => {
    switch (typeStr) {
      case "TYT":
        return {
          turkce: { active: true, label: "Türkçe", limit: 40 },
          sosyal: { active: true, label: "Sosyal", limit: 20 },
          matematik: { active: true, label: "Matematik", limit: 40 },
          fen: { active: true, label: "Fen Bilimleri", limit: 20 },
        };
      case "AYT":
        return {
          turkce: { active: false, label: "Türkçe", limit: 0 },
          sosyal: { active: false, label: "Sosyal", limit: 0 },
          matematik: { active: true, label: "Matematik", limit: 40 },
          fen: { active: true, label: "Fen Bilimleri", limit: 40 },
        };
      case "TYT Türkçe Branş":
        return {
          turkce: { active: true, label: "Türkçe", limit: 40 },
          sosyal: { active: false, limit: 0 },
          matematik: { active: false, limit: 0 },
          fen: { active: false, limit: 0 },
        };
      case "TYT Sosyal Branş":
        return {
          turkce: { active: false, limit: 0 },
          sosyal: { active: true, label: "Sosyal", limit: 20 },
          matematik: { active: false, limit: 0 },
          fen: { active: false, limit: 0 },
        };
      case "TYT Matematik Branş":
        return {
          turkce: { active: false, limit: 0 },
          sosyal: { active: false, limit: 0 },
          matematik: { active: true, label: "Matematik", limit: 40 },
          fen: { active: false, limit: 0 },
        };
      case "TYT Fen Branş":
        return {
          turkce: { active: false, limit: 0 },
          sosyal: { active: false, limit: 0 },
          matematik: { active: false, limit: 0 },
          fen: { active: true, label: "Fen", limit: 20 },
        };
      case "AYT Matematik Branş":
        return {
          turkce: { active: false, limit: 0 },
          sosyal: { active: false, limit: 0 },
          matematik: { active: true, label: "AYT Matematik", limit: 40 },
          fen: { active: false, limit: 0 },
        };
      case "AYT Fen Branş":
        return {
          turkce: { active: false, limit: 0 },
          sosyal: { active: false, limit: 0 },
          matematik: { active: false, limit: 0 },
          fen: { active: true, label: "AYT Fen Bilimleri", limit: 40 },
        };
      case "AYT Fizik Branş":
        return {
          turkce: { active: false, limit: 0 },
          sosyal: { active: false, limit: 0 },
          matematik: { active: false, limit: 0 },
          fen: { active: true, label: "AYT Fizik", limit: 14 },
        };
      case "AYT Kimya Branş":
        return {
          turkce: { active: false, limit: 0 },
          sosyal: { active: false, limit: 0 },
          matematik: { active: false, limit: 0 },
          fen: { active: true, label: "AYT Kimya", limit: 13 },
        };
      case "AYT Biyoloji Branş":
        return {
          turkce: { active: false, limit: 0 },
          sosyal: { active: false, limit: 0 },
          matematik: { active: false, limit: 0 },
          fen: { active: true, label: "AYT Biyoloji", limit: 13 },
        };
      default:
        return {
          turkce: { active: true, label: "Türkçe", limit: 40 },
          sosyal: { active: true, label: "Sosyal", limit: 20 },
          matematik: { active: true, label: "Matematik", limit: 40 },
          fen: { active: true, label: "Fen Bilimleri", limit: 20 },
        };
    }
  };

  const config = getSubjectConfig(type);

  // Clear disabled inputs when type changes
  useEffect(() => {
    if (!config.turkce.active) {
      setTurkceD("");
      setTurkceY("");
    }
    if (!config.sosyal.active) {
      setSosyalD("");
      setSosyalY("");
    }
    if (!config.matematik.active) {
      setMatematikD("");
      setMatematikY("");
    }
    if (!config.fen.active) {
      setFenD("");
      setFenY("");
    }
    setOcrSuccessMsg(null);
    setOcrError(null);
  }, [type]);

  // Calculate Localized Live Nets in real-time
  const calculateResultNet = (dVal: string, yVal: string, maxVal: number) => {
    const d = Math.max(0, Math.min(maxVal, parseInt(dVal) || 0));
    const y = Math.max(0, Math.min(maxVal - d, parseInt(yVal) || 0));
    const rawNet = d - y * 0.25;
    return parseFloat(rawNet.toFixed(2));
  };

  const liveTurkceNet = config.turkce.active ? calculateResultNet(turkceD, turkceY, config.turkce.limit) : 0;
  const liveSosyalNet = config.sosyal.active ? calculateResultNet(sosyalD, sosyalY, config.sosyal.limit) : 0;
  const liveMatematikNet = config.matematik.active ? calculateResultNet(matematikD, matematikY, config.matematik.limit) : 0;
  const liveFenNet = config.fen.active ? calculateResultNet(fenD, fenY, config.fen.limit) : 0;

  const liveTotalNet = parseFloat((liveTurkceNet + liveSosyalNet + liveMatematikNet + liveFenNet).toFixed(2));

  // AI-powered Image Scanner (Photo Upload Mode)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setOcrError(null);
    setOcrSuccessMsg(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        
        const response = await fetch("/api/analyze-exam", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            image: base64String,
            mimeType: file.type || "image/png"
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Görsel taranırken yapay zeka sunucusundan hata alındı.");
        }

        const data = await response.json();
        
        // Load data retrieved from Gemini into Form fields!
        if (data.examName) setName(data.examName);
        if (data.examType) {
          // Normalize received type to ensure exact matching
          const matchedType = [
            "TYT", "AYT", "TYT Türkçe Branş", "TYT Sosyal Branş", "TYT Matematik Branş", "TYT Fen Branş",
            "AYT Matematik Branş", "AYT Fen Branş", "AYT Fizik Branş", "AYT Kimya Branş", "AYT Biyoloji Branş"
          ].find(t => t.toLowerCase() === data.examType.toLowerCase() || t.toLowerCase().includes(data.examType.toLowerCase()));
          
          if (matchedType) {
            setType(matchedType);
          } else if (data.examType.includes("TYT")) {
            setType("TYT");
          } else if (data.examType.includes("AYT")) {
            setType("AYT");
          }
        }

        // Set subject correct/wrong values
        if (data.turkceD !== undefined) setTurkceD(String(data.turkceD));
        if (data.turkceY !== undefined) setTurkceY(String(data.turkceY));
        
        if (data.sosyalD !== undefined) setSosyalD(String(data.sosyalD));
        if (data.sosyalY !== undefined) setSosyalY(String(data.sosyalY));
        
        if (data.matematikD !== undefined) setMatematikD(String(data.matematikD));
        if (data.matematikY !== undefined) setMatematikY(String(data.matematikY));
        
        if (data.fenD !== undefined) setFenD(String(data.fenD));
        if (data.fenY !== undefined) setFenY(String(data.fenY));

        setOcrSuccessMsg("Resim başarıyla analiz edildi YKS Yoldaşı! 🎉 Lütfen aşağıdaki verileri kontrol ederek kaydet butonuna bas dostum.");
        setInputMode("manual"); // Switch back so they see the inputs populated nicely
      } catch (err: any) {
        console.error("OCR analysis error:", err);
        setOcrError(err.message || "Görsel çözümlenemedi. Lütfen görselin net olduğundan emin ol veya manuel girişi kullan.");
      } finally {
        setIsAnalyzing(false);
      }
    };

    reader.readAsDataURL(file);
  };

  // Form Submission
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Lütfen deneme adını veya yayın ismini yaz dostum! ✏️");
      return;
    }

    // Capture values & calculate final totals
    const tD = config.turkce.active ? (parseInt(turkceD) || 0) : 0;
    const tY = config.turkce.active ? (parseInt(turkceY) || 0) : 0;
    
    const sD = config.sosyal.active ? (parseInt(sosyalD) || 0) : 0;
    const sY = config.sosyal.active ? (parseInt(sosyalY) || 0) : 0;
    
    const mD = config.matematik.active ? (parseInt(matematikD) || 0) : 0;
    const mY = config.matematik.active ? (parseInt(matematikY) || 0) : 0;
    
    const fD = config.fen.active ? (parseInt(fenD) || 0) : 0;
    const fY = config.fen.active ? (parseInt(fenY) || 0) : 0;

    // Validate boundaries
    if (config.turkce.active && (tD + tY > config.turkce.limit)) {
      alert(`Türkçe doğru + yanlış toplamı maksimum soru sayısını (${config.turkce.limit}) aşamaz!`);
      return;
    }
    if (config.sosyal.active && (sD + sY > config.sosyal.limit)) {
      alert(`Sosyal doğru + yanlış toplamı maksimum soru sayısını (${config.sosyal.limit}) aşamaz!`);
      return;
    }
    if (config.matematik.active && (mD + mY > config.matematik.limit)) {
      alert(`Matematik doğru + yanlış toplamı maksimum soru sayısını (${config.matematik.limit}) aşamaz!`);
      return;
    }
    if (config.fen.active && (fD + fY > config.fen.limit)) {
      alert(`${config.fen.label} doğru + yanlış toplamı maksimum soru sayısını (${config.fen.limit}) aşamaz!`);
      return;
    }

    const tNet = config.turkce.active ? calculateResultNet(turkceD, turkceY, config.turkce.limit) : 0;
    const sNet = config.sosyal.active ? calculateResultNet(sosyalD, sosyalY, config.sosyal.limit) : 0;
    const mNet = config.matematik.active ? calculateResultNet(matematikD, matematikY, config.matematik.limit) : 0;
    const fNet = config.fen.active ? calculateResultNet(fenD, fenY, config.fen.limit) : 0;
    const total = parseFloat((tNet + sNet + mNet + fNet).toFixed(2));

    const payload = {
      deneme_adi: name.trim(),
      deneme_turu: type,
      turkce_net: tNet,
      sosyal_net: sNet,
      matematik_net: mNet,
      fen_net: fNet,
      toplam_net: total,
    };

    setLoading(true);
    try {
      const response = await fetch("/api/denemeler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchDenemeler();
        await fetchRankings();
        onRefreshProfile();

        // Reset Form
        setName("");
        setTurkceD("");
        setTurkceY("");
        setSosyalD("");
        setSosyalY("");
        setMatematikD("");
        setMatematikY("");
        setFenD("");
        setFenY("");
        setOcrSuccessMsg(null);
        setOcrError(null);
      } else {
        const err = await response.json();
        alert("Deneme kaydedilemedi: " + (err.error || "Bilinmeyen hata"));
      }
    } catch (e: any) {
      alert("Hata oluştu: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    const confirmDelete = window.confirm("Bu deneme sonucunu veritabanından tamamen silmek istediğinden emin misin şampiyon?");
    if (!confirmDelete || !token) return;

    try {
      const response = await fetch(`/api/denemeler/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchDenemeler();
        await fetchRankings();
        onRefreshProfile();
      } else {
        const err = await response.json();
        alert("Deneme silinemedi: " + (err.error || "Bilinmeyen hata"));
      }
    } catch (e: any) {
      alert("Hata oluştu: " + e.message);
    }
  };

  // Filtration logic
  const filteredDenemeler = denemeler.filter((item) => {
    if (filter === "Hepsi") return true;
    if (filter === "TYT") return item.type === "TYT";
    if (filter === "AYT") return item.type === "AYT";
    if (filter === "Branş") {
      return item.type.includes("Branş");
    }
    return true;
  });

  // Calculate Dashboard Averages
  const tytExams = denemeler.filter(d => d.type === "TYT");
  const aytExams = denemeler.filter(d => d.type === "AYT");

  const avgTytNet = tytExams.length > 0 
    ? parseFloat((tytExams.reduce((sum, d) => sum + d.totalNet, 0) / tytExams.length).toFixed(2)) 
    : null;

  const avgAytNet = aytExams.length > 0 
    ? parseFloat((aytExams.reduce((sum, d) => sum + d.totalNet, 0) / aytExams.length).toFixed(2)) 
    : null;

  const maxOverallNet = denemeler.length > 0 
    ? Math.max(...denemeler.map(d => d.totalNet)) 
    : 0;

  return (
    <div className="flex flex-col h-full w-full gap-5 overflow-y-auto pb-4 px-1 scrollbar-thin select-none" id="deneme-kokpiti-container">
      
      {/* Neo-brutalist Özet İstatistik Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-[#FFFBF2] border-4 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-3 flex flex-col justify-center items-center text-center rotate-1">
          <FileCheck className="w-6 h-6 text-black mb-1" />
          <span className="text-[10px] font-black uppercase text-neutral-600 tracking-wider">Toplam Deneme</span>
          <span className="text-base md:text-lg font-black text-black leading-none mt-1">
            {denemeler.length} Adet
          </span>
        </div>

        <div className="bg-[#E8F8F5] border-4 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-3 flex flex-col justify-center items-center text-center -rotate-1">
          <TrendingUp className="w-6 h-6 text-emerald-600 mb-1" />
          <span className="text-[10px] font-black uppercase text-neutral-600 tracking-wider">TYT Net Ortalaması</span>
          <span className="text-base md:text-lg font-black text-black leading-none mt-1">
            {avgTytNet !== null ? `${avgTytNet} Net` : "---"}
          </span>
        </div>

        <div className="bg-[#FDF2E9] border-4 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-3 flex flex-col justify-center items-center text-center rotate-1">
          <BarChart2 className="w-6 h-6 text-orange-600 mb-1" />
          <span className="text-[10px] font-black uppercase text-neutral-600 tracking-wider">AYT Net Ortalaması</span>
          <span className="text-base md:text-lg font-black text-black leading-none mt-1">
            {avgAytNet !== null ? `${avgAytNet} Net` : "---"}
          </span>
        </div>

        <div className="bg-[#FEF9E7] border-4 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-3 flex flex-col justify-center items-center text-center -rotate-1">
          <span className="text-2xl mb-0.5">🏆</span>
          <span className="text-[10px] font-black uppercase text-neutral-600 tracking-wider">En Yüksek Net</span>
          <span className="text-base md:text-lg font-black text-amber-600 leading-none mt-1">
            {denemeler.length > 0 ? `${maxOverallNet} Net` : "---"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* SOL: VERİ GİRİŞ FORMU (5 cols) */}
        <div className="lg:col-span-5 bg-white border-4 border-black rounded-2xl md:rounded-[24px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-5 flex flex-col justify-between box-border">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-2 border-b-2 border-dashed border-neutral-200 gap-2">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-black" />
                <h3 className="text-xs md:text-sm font-black uppercase text-black tracking-wider leading-none">
                  Yeni Deneme Sonucu Ekle 📝
                </h3>
              </div>

              {/* Mode Toggle: Manual vs AI-OCR */}
              <div className="flex items-center gap-1 bg-neutral-100 border-2 border-black rounded-lg p-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <button
                  type="button"
                  onClick={() => setInputMode("manual")}
                  className={`px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                    inputMode === "manual" ? "bg-[#FF7E67] text-white border-1.5 border-black" : "text-neutral-500"
                  }`}
                >
                  ✍️ Elle Gir
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("ocr")}
                  className={`px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                    inputMode === "ocr" ? "bg-[#4ECDC4] text-black border-1.5 border-black" : "text-neutral-500"
                  }`}
                >
                  📷 AI Tara
                </button>
              </div>
            </div>

            {/* AI SCREENER COMPONENT */}
            {inputMode === "ocr" && (
              <div className="bg-[#EBF5FB] border-3 border-black rounded-xl p-4 mb-3 text-center transition-all animate-fadeIn">
                <Camera className="w-8 h-8 text-[#3498DB] mx-auto mb-2" />
                <h4 className="text-xs font-black uppercase text-black mb-1">Optik / Sonuç Karnesi Yükle 📸</h4>
                <p className="text-[9.5px] text-gray-600 font-bold uppercase leading-none mt-1 mb-4 select-none">
                  Sınav karnesinin veya yayın optik sonucunun fotoğrafını yükleyin, Yapay Zeka anında netleri doldursun!
                </p>

                {isAnalyzing ? (
                  <div className="bg-white border-2 border-black p-3 rounded-lg inline-flex items-center gap-2 font-black text-xs animate-bounce shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#FF7E67]" />
                    <span>YOLDAŞ GÖRSELİ TARAYOR, LÜTFEN BEKLE DOSTUM... ⏳</span>
                  </div>
                ) : (
                  <label className="bg-white hover:bg-neutral-50 text-black border-2 border-black font-black text-[10px] tracking-wider uppercase px-4 py-2 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer inline-block">
                    📂 Fotoğraf / SS Yükle
                    <input
                      type="file"
                      accept="image/jpeg, image/jpg, image/png"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}

                {ocrError && (
                  <div className="mt-3 p-2 bg-red-100 text-red-700 border-2 border-red-400 rounded-lg text-[10px] font-bold flex items-center gap-1.5 justify-center">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{ocrError}</span>
                  </div>
                )}
              </div>
            )}

            {ocrSuccessMsg && (
              <div className="mb-3 p-2.5 bg-[#E8F8F5] text-emerald-800 border-2 border-emerald-400 rounded-lg text-[10px] font-bold flex items-center gap-1.5 justify-center">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
                <span>{ocrSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="flex flex-col gap-3">
              {/* Deneme Adı */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-black tracking-wide text-black flex items-center gap-1">
                  <span>✏️ Yayın / Deneme Adı</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Bilgi Sarmal TYT-1 (veya 3D AYT Gen-2)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs font-bold border-2 border-black rounded-xl p-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-[#FF7E67] shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] focus:shadow-none transition-all placeholder-gray-400"
                />
              </div>

              {/* Deneme Türü */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-black tracking-wide text-black flex items-center gap-1">
                  <span>📂 Sınav Grubu</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full text-xs font-bold border-2 border-black rounded-xl p-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-[#FF7E67] shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] focus:shadow-none transition-all cursor-pointer"
                >
                  <optgroup label="Genel Sınavlar">
                    <option value="TYT">TYT Genel Denemesi (120 Soru)</option>
                    <option value="AYT">AYT Genel Denemesi (80 Soru)</option>
                  </optgroup>
                  <optgroup label="TYT Branş Denemeleri">
                    <option value="TYT Türkçe Branş">TYT Türkçe Branş (40 Soru)</option>
                    <option value="TYT Sosyal Branş">TYT Sosyal Branş (20 Soru)</option>
                    <option value="TYT Matematik Branş">TYT Matematik Branş (40 Soru)</option>
                    <option value="TYT Fen Branş">TYT Fen Branş (20 Soru)</option>
                  </optgroup>
                  <optgroup label="AYT Branş Denemeleri">
                    <option value="AYT Matematik Branş">AYT Matematik Branş (40 Soru)</option>
                    <option value="AYT Fen Branş">AYT Fen Branş (40 Soru)</option>
                    <option value="AYT Fizik Branş">AYT Fizik Branş (14 Soru)</option>
                    <option value="AYT Kimya Branş">AYT Kimya Branş (13 Soru)</option>
                    <option value="AYT Biyoloji Branş">AYT Biyoloji Branş (13 Soru)</option>
                  </optgroup>
                </select>
              </div>

              {/* DİNAMİK BRUTALIST GİRİŞ KUTULARI */}
              <div className="flex flex-col gap-2 mt-2">
                
                {/* Türkçe */}
                {config.turkce.active && (
                  <div className="bg-[#FFFBF2] border-2 border-black p-2.5 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase text-black">{config.turkce.label} (Max {config.turkce.limit} Soru)</span>
                      <span className="text-[10px] font-mono font-black text-[#FF7E67]">{liveTurkceNet} Net</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-neutral-500 uppercase">D:</span>
                        <input
                          type="number"
                          min="0"
                          max={config.turkce.limit}
                          placeholder="Doğru"
                          value={turkceD}
                          onChange={(e) => setTurkceD(e.target.value)}
                          className="w-full text-xs font-mono font-bold border-2 border-black bg-white p-1 rounded text-center focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-neutral-500 uppercase">Y:</span>
                        <input
                          type="number"
                          min="0"
                          max={config.turkce.limit}
                          placeholder="Yanlış"
                          value={turkceY}
                          onChange={(e) => setTurkceY(e.target.value)}
                          className="w-full text-xs font-mono font-bold border-2 border-black bg-white p-1 rounded text-center focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sosyal */}
                {config.sosyal.active && (
                  <div className="bg-[#FFFBF2] border-2 border-black p-2.5 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase text-black">{config.sosyal.label} (Max {config.sosyal.limit} Soru)</span>
                      <span className="text-[10px] font-mono font-black text-[#FF7E67]">{liveSosyalNet} Net</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-neutral-500 uppercase">D:</span>
                        <input
                          type="number"
                          min="0"
                          max={config.sosyal.limit}
                          placeholder="Doğru"
                          value={sosyalD}
                          onChange={(e) => setSosyalD(e.target.value)}
                          className="w-full text-xs font-mono font-bold border-2 border-black bg-white p-1 rounded text-center focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-neutral-500 uppercase">Y:</span>
                        <input
                          type="number"
                          min="0"
                          max={config.sosyal.limit}
                          placeholder="Yanlış"
                          value={sosyalY}
                          onChange={(e) => setSosyalY(e.target.value)}
                          className="w-full text-xs font-mono font-bold border-2 border-black bg-white p-1 rounded text-center focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Matematik */}
                {config.matematik.active && (
                  <div className="bg-[#FFFBF2] border-2 border-black p-2.5 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase text-black">{config.matematik.label} (Max {config.matematik.limit} Soru)</span>
                      <span className="text-[10px] font-mono font-black text-[#FF7E67]">{liveMatematikNet} Net</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-neutral-500 uppercase">D:</span>
                        <input
                          type="number"
                          min="0"
                          max={config.matematik.limit}
                          placeholder="Doğru"
                          value={matematikD}
                          onChange={(e) => setMatematikD(e.target.value)}
                          className="w-full text-xs font-mono font-bold border-2 border-black bg-white p-1 rounded text-center focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-neutral-500 uppercase">Y:</span>
                        <input
                          type="number"
                          min="0"
                          max={config.matematik.limit}
                          placeholder="Yanlış"
                          value={matematikY}
                          onChange={(e) => setMatematikY(e.target.value)}
                          className="w-full text-xs font-mono font-bold border-2 border-black bg-white p-1 rounded text-center focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Fen */}
                {config.fen.active && (
                  <div className="bg-[#FFFBF2] border-2 border-black p-2.5 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase text-black">{config.fen.label} (Max {config.fen.limit} Soru)</span>
                      <span className="text-[10px] font-mono font-black text-[#FF7E67]">{liveFenNet} Net</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-neutral-500 uppercase">D:</span>
                        <input
                          type="number"
                          min="0"
                          max={config.fen.limit}
                          placeholder="Doğru"
                          value={fenD}
                          onChange={(e) => setFenD(e.target.value)}
                          className="w-full text-xs font-mono font-bold border-2 border-black bg-white p-1 rounded text-center focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-neutral-500 uppercase">Y:</span>
                        <input
                          type="number"
                          min="0"
                          max={config.fen.limit}
                          placeholder="Yanlış"
                          value={fenY}
                          onChange={(e) => setFenY(e.target.value)}
                          className="w-full text-xs font-mono font-bold border-2 border-black bg-white p-1 rounded text-center focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Canlı Hesaplanan Toplam Net Bar */}
              <div className="bg-[#FFFBF2] border-2 border-black rounded-xl p-3 mt-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-black font-black uppercase tracking-wider block">Canlı Hesaplanan Toplam</span>
                  <span className="text-[9px] font-bold text-neutral-500 block leading-none mt-1 uppercase">D - (Y * 0.25) Formülüyle</span>
                </div>
                <div className="bg-[#4ECDC4] text-black border-2 border-black font-black px-4 py-1.5 rounded-xl text-sm tracking-tight shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {liveTotalNet} Net
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-[#FF7E67] hover:bg-[#ff684e] text-white border-4 border-black p-3 rounded-xl font-black text-xs tracking-wider uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer text-center mt-1"
              >
                💾 DENEMEYİ KAYDET
              </button>
            </form>
          </div>
        </div>

        {/* SAĞ: FİLTRELER VE LİSTE TABLOSU / LİDERLİK SIRALAMASI */}
        <div className="lg:col-span-12 xl:col-span-7 bg-white border-4 border-black rounded-2xl md:rounded-[24px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-5 flex flex-col min-h-0 box-border">
          
          {/* SEKMELER: Deneme Listesi vs Liderlik */}
          <div className="flex border-b-4 border-black mb-4 gap-2 shrink-0">
            <button
              onClick={() => setActiveSubTab("list")}
              className={`flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-black uppercase tracking-wider border-t-4 border-x-4 border-black rounded-t-xl transition-all cursor-pointer ${
                activeSubTab === "list"
                  ? "bg-[#FFF2A3] text-black -mb-1"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Kayıtlı Denemeler
            </button>
            <button
              onClick={() => setActiveSubTab("rankings")}
              className={`flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-black uppercase tracking-wider border-t-4 border-x-4 border-black rounded-t-xl transition-all cursor-pointer ${
                activeSubTab === "rankings"
                  ? "bg-[#FF7E67] text-white -mb-1"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
              }`}
            >
              <Trophy className="w-4 h-4 text-yellow-500" />
              Okul Sıralama Sistemi (Ranking)
            </button>
          </div>

          {activeSubTab === "list" ? (
            <>
              {/* DİNAMİK FİLTRELEME BARBARI */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-2 border-b-2 border-dashed border-neutral-200 gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase text-black tracking-wider leading-none">
                    Net Filtrelemesi:
                  </h3>
                </div>
                
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: "Hepsi", label: "🌟 Hepsi" },
                    { id: "TYT", label: "📝 TYT" },
                    { id: "AYT", label: "🎓 AYT" },
                    { id: "Branş", label: "🎯 Branşlar" },
                  ].map((btn) => {
                    const isActive = filter === btn.id;
                    return (
                      <button
                        key={btn.id}
                        onClick={() => setFilter(btn.id as any)}
                        className={`text-[9.5px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border-2 border-black transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#4ECDC4] text-black shadow-none translate-y-1"
                            : "bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                        }`}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DENEME TABLOSU */}
              <div className="flex-1 overflow-x-auto min-h-0 border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-[#FFFBF2] overflow-y-auto">
                {loading ? (
                  <div className="p-10 text-center text-black">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
                    <h4 className="text-sm font-black uppercase tracking-wider text-black">Veriler Yükleniyor...</h4>
                  </div>
                ) : filteredDenemeler.length === 0 ? (
                  <div className="p-10 text-center text-black">
                    <div className="text-4xl mb-3">🎯</div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-black">Henüz deneme kaydetmedin şampiyon!</h4>
                    <p className="text-[10px] text-gray-500 font-bold max-w-md mx-auto mt-2 uppercase tracking-wide leading-relaxed">
                      İlk deneme netlerini soldan elle girerek veya resim yükleyerek kaydet, Yoldaş anında istatistiklerini hesaplasın!
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-[10px] md:text-xs">
                    <thead>
                      <tr className="bg-black text-white font-black uppercase tracking-wider border-b-4 border-black">
                        <th className="p-3 py-3.5">Adı / Yayın</th>
                        <th className="p-3 py-3.5 text-center">Tür</th>
                        <th className="p-3 py-3.5 text-center">TR Net</th>
                        <th className="p-3 py-3.5 text-center">Sos Net</th>
                        <th className="p-3 py-3.5 text-center">Mat Net</th>
                        <th className="p-3 py-3.5 text-center">Fen / Alan</th>
                        <th className="p-3 py-3.5 text-center bg-[#FF7E67] text-white">TOPLAM NET</th>
                        <th className="p-3 py-3.5 text-center">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDenemeler.map((item) => {
                        const subjConfig = getSubjectConfig(item.type);
                        return (
                          <tr key={item.id} className="border-b-2 border-black/20 hover:bg-black/5 transition-colors font-bold text-black">
                            <td className="p-3 font-black text-black min-w-[120px] capitalize leading-normal">
                              {item.name}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border-2 border-black leading-none ${
                                item.type === "TYT" ? "bg-orange-100 text-orange-700" :
                                item.type === "AYT" ? "bg-purple-100 text-purple-700" : "bg-teal-50 text-teal-700"
                              }`}>
                                {item.type}
                              </span>
                            </td>
                            <td className={`p-3 font-mono text-center ${subjConfig.turkce.active ? "bg-white" : "bg-neutral-100 text-neutral-400"}`}>
                              {subjConfig.turkce.active ? `${item.turkceN} Net` : "—"}
                            </td>
                            <td className={`p-3 font-mono text-center ${subjConfig.sosyal.active ? "bg-white" : "bg-neutral-100 text-neutral-400"}`}>
                              {subjConfig.sosyal.active ? `${item.sosyalN} Net` : "—"}
                            </td>
                            <td className={`p-3 font-mono text-center ${subjConfig.matematik.active ? "bg-white" : "bg-neutral-100 text-neutral-400"}`}>
                              {subjConfig.matematik.active ? `${item.matematikN} Net` : "—"}
                            </td>
                            <td className={`p-3 font-mono text-center ${subjConfig.fen.active ? "bg-white" : "bg-neutral-100 text-neutral-400"}`}>
                              {subjConfig.fen.active ? `${item.fenN} Net` : "—"}
                            </td>
                            <td className="p-3 text-center bg-[#FFF2A3] border-l-2 border-black font-mono font-black text-black text-xs md:text-sm">
                              {item.totalNet}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="w-7 h-7 rounded-lg bg-red-100 border-2 border-black hover:bg-red-200 text-red-600 transition-all cursor-pointer flex items-center justify-center m-auto shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none"
                                title="Denemeyi sil"
                              >
                                <Trash2 className="w-4 h-4 text-black" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <>
              {/* RANKINGS COMPONENT */}
              <div className="mb-3 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase text-neutral-600 leading-tight">
                  <span>🏆 Tüm Okullar Arası Çalışma Liderlik Tablosu</span>
                  <span className="text-[10px] text-gray-500 font-normal capitalize">Net * 10 + 5 Puan/Deneme formülüyle hesaplanır</span>
                </div>

                {/* Dinamik Okul ve Şehir Sıralaması */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-1 shrink-0">
                  <div className="bg-[#EBF5FB] border-3 border-black p-3.5 rounded-xl text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col justify-center">
                    <span className="text-[9px] bg-black text-[#EBF5FB] font-black px-2 py-0.5 rounded uppercase tracking-wider mb-2 self-start">🏫 OKUL İÇİ SIRALAMAN</span>
                    <span className="text-xs font-bold text-neutral-500 uppercase leading-none block">BTSO Hüseyin Sungur Anadolu Lisesi</span>
                    <span className="text-sm md:text-base font-black text-[#2980B9] leading-none block mt-2">
                      Sıralaman: #{Math.max(1, Math.min(140, Math.round(140 - (profile?.basariPuani || 0) / 12)))} / 140
                    </span>
                  </div>

                  <div className="bg-[#FEF9E7] border-3 border-black p-3.5 rounded-xl text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col justify-center">
                    <span className="text-[9px] bg-black text-[#FEF9E7] font-black px-2 py-0.5 rounded uppercase tracking-wider mb-2 self-start">🏙️ GENEL ŞEHİR SIRALAMAN</span>
                    <span className="text-xs font-bold text-neutral-500 uppercase leading-none block">Bursa Genelindeki Konumun</span>
                    <span className="text-sm md:text-base font-black text-amber-600 leading-none block mt-2">
                      Sıralaman: #{Math.max(1, Math.min(1200, Math.round(1200 - (profile?.basariPuani || 0) * 1.3 / 8)))} / 1200
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-x-auto min-h-0 border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-[#F8FFF6] overflow-y-auto">
                {rankingsLoading ? (
                  <div className="p-10 text-center text-black">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
                    <h4 className="text-sm font-black uppercase tracking-wider text-black">Liderler Yükleniyor...</h4>
                  </div>
                ) : rankings.length === 0 ? (
                  <div className="p-10 text-center text-black">
                    <Users className="w-10 h-10 mx-auto text-black mb-3" />
                    <h4 className="text-sm font-black uppercase tracking-wider text-black">Henüz Lider Kaydı Yok!</h4>
                    <p className="text-[10px] text-gray-400 font-bold max-w-sm mx-auto mt-2 uppercase">İlk denemeni kaydederek Liderlik Tablosunda yerini al dostum!</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-[10px] md:text-xs">
                    <thead>
                      <tr className="bg-black text-white font-black uppercase tracking-wider border-b-4 border-black">
                        <th className="p-3 py-3.5 text-center">Sıra</th>
                        <th className="p-3 py-3.5">Kullanıcı Adı</th>
                        <th className="p-3 py-3.5">Okul Adı</th>
                        <th className="p-3 py-3.5 text-center text-yellow-500">🏆 Başarı Puanı</th>
                        <th className="p-3 py-3.5 text-center">Çalışma Serisi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankings.map((rk, idx) => {
                        const isMe = rk.id === profile?.id;
                        return (
                          <tr key={rk.id} className={`border-b-2 border-black/20 hover:bg-black/5 transition-colors font-bold text-black ${
                            isMe ? "bg-[#FFF2A3] border-l-4 border-l-[#FF7E67]" : ""
                          }`}>
                            <td className="p-3 text-center font-black">
                              {idx + 1 === 1 ? "🥇 1." : idx + 1 === 2 ? "🥈 2." : idx + 1 === 3 ? "🥉 3." : `${idx + 1}.`}
                            </td>
                            <td className="p-3 font-black">
                              {rk.username} {isMe && <span className="text-[8px] bg-[#FF7E67] text-white px-1.5 py-0.5 rounded ml-1 font-black">SEN</span>}
                            </td>
                            <td className="p-3 text-neutral-800 tracking-tight capitalize leading-normal">
                              {rk.okulAdi}
                            </td>
                            <td className="p-3 text-center font-mono font-black text-emerald-700 bg-emerald-50/40 text-sm">
                              {rk.basariPuani} Puan
                            </td>
                            <td className="p-3 text-center">
                              <span className="text-[10px] font-black uppercase tracking-tight bg-orange-100 text-orange-700 border border-orange-300 px-2 py-0.5 rounded-full">
                                ⚡ {rk.seriGunu} Oturum
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

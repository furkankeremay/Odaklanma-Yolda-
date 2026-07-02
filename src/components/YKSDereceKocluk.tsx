import React, { useState } from "react";
import { Search, Sparkles, Award, GraduationCap, MapPin, DollarSign, Calendar, MessageSquare, Check, PhoneCall } from "lucide-react";

interface Coach {
  id: string;
  name: string;
  rank: string;
  field: "SAY" | "EA" | "SOZ" | "DIL";
  university: string;
  department: string;
  highSchool: string;
  bio: string;
  imageUrl: string;
  price: string;
  tags: string[];
}

const INITIAL_COACHES: Coach[] = [
  {
    id: "coach-1",
    name: "Kerem Ay",
    rank: "YKS 2024 Sayısal TR 842.si",
    field: "SAY",
    university: "Bilkent Üniversitesi",
    department: "Endüstri Mühendisliği",
    highSchool: "Bursa Anadolu Lisesi Mezunu",
    bio: "Derece taktikleri, kaynak yönetimi, deneme analizi ve haftalık programlama uzmanı. Birlikte kazanacağız!",
    imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    price: "450 TL / Aylık",
    tags: ["Kaynak Tavsiyesi", "Haftalık Takip", "Mental Destek"]
  },
  {
    id: "coach-2",
    name: "Selin Şahin",
    rank: "YKS 2024 Eşit Ağırlık TR 215.si",
    field: "EA",
    university: "Boğaziçi Üniversitesi",
    department: "İşletme",
    highSchool: "BTSO Hüseyin Sungur Anadolu Lisesi Mezunu",
    bio: "Edebiyat ve Matematik netlerini uçuracak özel soru çözüm stratejileri ve her hafta detaylı ilerleme raporu.",
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    price: "Seans Başı 150 TL",
    tags: ["Edebiyat Kampı", "Matematik Taktikleri", "Canlı Seans"]
  },
  {
    id: "coach-3",
    name: "Batuhan Demir",
    rank: "YKS 2023 Sayısal TR 1205.si",
    field: "SAY",
    university: "ODTÜ",
    department: "Bilgisayar Mühendisliği",
    highSchool: "Bursa Fen Lisesi Mezunu",
    bio: "AYT Fizik ve Matematik konularında zorlanan öğrencilere özel pratik anlatım tarzı ve derece programı.",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    price: "400 TL / Aylık",
    tags: ["Ayt Fizik", "Zaman Yönetimi", "Yazılım Koçluğu"]
  },
  {
    id: "coach-4",
    name: "Elif Karaca",
    rank: "YKS 2024 Sözel/Dil TR 96.sı",
    field: "SOZ",
    university: "Galatasaray Üniversitesi",
    department: "İletişim",
    highSchool: "Bursa Anadolu Lisesi Mezunu",
    bio: "Paragraf, Tarih, Coğrafya ve Dil bölümlerine hazırlıkta derece garantili çalışma programları sunuyorum.",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    price: "Seans Başı 120 TL",
    tags: ["Hızlı Okuma", "Sözel Kampı", "Dil Taktikleri"]
  }
];

export default function YKSDereceKocluk() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedField, setSelectedField] = useState<"ALL" | "SAY" | "EA" | "SOZ">("ALL");
  const [schoolFilter, setSchoolFilter] = useState<"ALL" | "BTSO" | "BAL">("ALL");
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Filter coaches logic
  const filteredCoaches = INITIAL_COACHES.filter(coach => {
    const matchesSearch = 
      coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesField = selectedField === "ALL" || coach.field === selectedField;

    const matchesSchool = 
      schoolFilter === "ALL" ||
      (schoolFilter === "BTSO" && coach.highSchool.includes("BTSO")) ||
      (schoolFilter === "BAL" && coach.highSchool.includes("Bursa Anadolu Lisesi"));

    return matchesSearch && matchesField && matchesSchool;
  });

  const handleBookCoaching = (coach: Coach) => {
    setSelectedCoach(coach);
    setBookingSuccess(false);
  };

  const submitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setSelectedCoach(null);
      setBookingSuccess(false);
    }, 2500);
  };

  return (
    <div className="flex flex-col h-full w-full gap-6 select-none" id="yks-coaching-marketplace">
      
      {/* 1. ÜST ALAN: MARKTPLACE HEADER */}
      <div className="bg-[#4ECDC4] border-4 border-black rounded-[24px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-5 rotate-[-0.5deg] relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="text-left">
          <div className="inline-flex items-center gap-1.5 bg-black text-[#4ECDC4] text-[9px] font-black uppercase px-2 py-0.5 rounded border border-black mb-1.5">
            <Award className="w-3 h-3 text-[#FFE65C] animate-bounce" />
            <span>YKS DERECE KOÇLUK SİSTEMİ v1.2</span>
          </div>
          <h2 className="text-lg md:text-xl font-black text-black uppercase tracking-tight leading-none">DERECE YAPMIŞ KOÇUNLA HEDEFİNE UÇ! 🚀</h2>
          <p className="text-[10px] md:text-xs font-bold text-black/80 mt-1 uppercase leading-none">
            Hayalindeki okul ve bölümleri kazanmış başarılı mezunlardan birebir rehberlik ve ders çalışma taktikleri al!
          </p>
        </div>
        
        {/* Statistics tag */}
        <div className="bg-white border-2 border-black px-4 py-2 rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,1)] text-center shrink-0">
          <span className="text-[10px] font-black text-black uppercase block">AKTİF MEZUN KOÇLAR</span>
          <span className="text-sm font-black text-[#FF7E67] font-mono">140+ Derece Koçu</span>
        </div>
      </div>

      {/* 2. FILTRELEME VE ARAMA ALANI */}
      <div className="bg-white border-4 border-black rounded-[20px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 flex flex-col gap-4 md:flex-row md:items-center justify-between">
        
        {/* Search input with brutalist borders */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Koç adı, üniversite veya bölüm ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-3 border-black pl-10 pr-4 py-2.5 text-xs font-bold rounded-xl bg-neutral-50 focus:bg-white focus:outline-none uppercase"
          />
        </div>

        {/* Dynamic filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex border-2 border-black rounded-lg p-0.5 bg-neutral-100 shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]">
            <button
              onClick={() => setSelectedField("ALL")}
              className={`px-2.5 py-1 text-[9px] font-black uppercase rounded transition-all cursor-pointer ${
                selectedField === "ALL" ? "bg-[#FFE65C] text-black border-1 border-black" : "text-neutral-500 hover:text-black"
              }`}
            >
              Hepsi
            </button>
            <button
              onClick={() => setSelectedField("SAY")}
              className={`px-2.5 py-1 text-[9px] font-black uppercase rounded transition-all cursor-pointer ${
                selectedField === "SAY" ? "bg-[#FF7E67] text-white border-1 border-black" : "text-neutral-500 hover:text-black"
              }`}
            >
              🔬 SAY
            </button>
            <button
              onClick={() => setSelectedField("EA")}
              className={`px-2.5 py-1 text-[9px] font-black uppercase rounded transition-all cursor-pointer ${
                selectedField === "EA" ? "bg-[#4ECDC4] text-black border-1 border-black" : "text-neutral-500 hover:text-black"
              }`}
            >
              ⚖️ EA
            </button>
            <button
              onClick={() => setSelectedField("SOZ")}
              className={`px-2.5 py-1 text-[9px] font-black uppercase rounded transition-all cursor-pointer ${
                selectedField === "SOZ" ? "bg-[#FFF2A3] text-black border-1 border-black" : "text-neutral-500 hover:text-black"
              }`}
            >
              📚 SÖZ/DİL
            </button>
          </div>

          <div className="flex border-2 border-black rounded-lg p-0.5 bg-neutral-100 shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]">
            <button
              onClick={() => setSchoolFilter("ALL")}
              className={`px-2.5 py-1 text-[9px] font-black uppercase rounded transition-all cursor-pointer ${
                schoolFilter === "ALL" ? "bg-black text-white border-1 border-black" : "text-neutral-500 hover:text-black"
              }`}
            >
              Tüm Liseler
            </button>
            <button
              onClick={() => setSchoolFilter("BTSO")}
              className={`px-2.5 py-1 text-[9px] font-black uppercase rounded transition-all cursor-pointer ${
                schoolFilter === "BTSO" ? "bg-[#E8F8F5] text-emerald-800 border-1 border-emerald-400" : "text-neutral-500 hover:text-black"
              }`}
            >
              🏫 Bizim Okul (BTSO HSAL)
            </button>
            <button
              onClick={() => setSchoolFilter("BAL")}
              className={`px-2.5 py-1 text-[9px] font-black uppercase rounded transition-all cursor-pointer ${
                schoolFilter === "BAL" ? "bg-[#FFFBF2] text-black border-1 border-black" : "text-neutral-500 hover:text-black"
              }`}
            >
              🏫 Bursa Anadolu Lisesi (BAL)
            </button>
          </div>
        </div>

      </div>

      {/* 3. KOÇ LİSTESİ - GRID SYSTEM */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCoaches.length > 0 ? (
          filteredCoaches.map((coach) => (
            <div
              key={coach.id}
              className="bg-white border-4 border-black rounded-[24px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-5 flex flex-col justify-between hover:translate-x-0.5 hover:translate-y-0.5 transition-all relative overflow-hidden"
            >
              
              {/* Field Label on card top-right */}
              <div className="absolute top-4 right-4 shrink-0">
                <span className={`text-[8.5px] font-black px-2 py-0.5 rounded border-2 border-black uppercase ${
                  coach.field === "SAY" ? "bg-[#FF7E67] text-white" :
                  coach.field === "EA" ? "bg-[#4ECDC4] text-black" :
                  "bg-[#FFE65C] text-black"
                }`}>
                  {coach.field} DERECESİ
                </span>
              </div>

              {/* Main Info */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-full border-3 border-black overflow-hidden bg-neutral-100 shrink-0 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <img src={coach.imageUrl} alt={coach.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-black text-black uppercase leading-tight">{coach.name}</h4>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-[10px] font-black text-[#FF7E67] uppercase">{coach.rank}</span>
                    </div>
                  </div>
                </div>

                {/* University and School */}
                <div className="space-y-1.5 pb-3 border-b-2 border-dashed border-neutral-100 mb-3">
                  <div className="flex items-center gap-1.5 text-neutral-700">
                    <GraduationCap className="w-4 h-4 text-black shrink-0" />
                    <span className="text-[10px] font-black uppercase text-black">
                      {coach.university} - {coach.department}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span className="text-[9.5px] font-bold uppercase">{coach.highSchool}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {coach.tags.map((tag, idx) => (
                    <span key={idx} className="text-[8px] bg-neutral-100 border border-black px-2 py-0.5 rounded-md font-bold uppercase text-gray-700">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Bio text */}
                <p className="text-[11px] font-bold text-gray-600 uppercase leading-snug mb-4 text-left">
                  "{coach.bio}"
                </p>
              </div>

              {/* Bottom Row: Price & Button */}
              <div className="pt-3 border-t-2 border-dashed border-neutral-100 flex items-center justify-between gap-2 mt-auto">
                <div className="bg-[#FFE65C] border-2 border-black px-2.5 py-1 rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,1)] shrink-0">
                  <span className="text-[10px] font-black text-black tracking-tight">{coach.price}</span>
                </div>

                <button
                  onClick={() => handleBookCoaching(coach)}
                  className="bg-[#4ECDC4] hover:bg-[#3dbdb3] text-black border-2 border-black font-black text-[10px] uppercase px-3 py-1.5 rounded-lg shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none transition-all cursor-pointer flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Koçluk Al
                </button>
              </div>

            </div>
          ))
        ) : (
          <div className="col-span-full bg-white border-4 border-black rounded-[24px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 text-center">
            <span className="text-3xl block mb-2">🔍</span>
            <h4 className="text-sm font-black text-black uppercase">Kriterlerine Uygun Koç Bulunamadı Şampiyon!</h4>
            <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">
              Arama kelimelerini değiştirebilir veya diğer liseleri seçerek şansını deneyebilirsin.
            </p>
          </div>
        )}
      </div>

      {/* 4. MODAL: KOÇLUK BAŞVURU FORMU */}
      {selectedCoach && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black rounded-[28px] shadow-[10px_10px_0px_rgba(0,0,0,1)] max-w-md w-full p-6 relative animate-fadeIn">
            
            <button
              onClick={() => setSelectedCoach(null)}
              className="absolute top-4 right-4 bg-red-100 hover:bg-red-200 border-2 border-black w-7 h-7 rounded-full flex items-center justify-center text-xs font-black cursor-pointer"
            >
              ✕
            </button>

            {bookingSuccess ? (
              <div className="text-center py-6">
                <span className="text-5xl block mb-3">🎉</span>
                <h3 className="text-md md:text-lg font-black text-black uppercase leading-tight">BAŞVURUN ALINDI ŞAMPİYON!</h3>
                <p className="text-[11px] font-bold text-[#FF7E67] uppercase tracking-wider mt-2">
                  {selectedCoach.name} seni 24 saat içinde e-posta/telefon ile bilgilendirecektir.
                </p>
                <div className="mt-4 inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border-2 border-emerald-400 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase">
                  <Check className="w-4 h-4" />
                  Kayıt İşlemi Tamamlandı
                </div>
              </div>
            ) : (
              <form onSubmit={submitBooking} className="space-y-4">
                <div className="text-left">
                  <span className="text-[8.5px] bg-[#FFE65C] border border-black px-2 py-0.5 rounded font-black uppercase">BİREBİR REHBERLİK REZERVASYONU</span>
                  <h3 className="text-md font-black text-black uppercase leading-tight mt-2">
                    {selectedCoach.name} ile Başarıya Yol Al 🌟
                  </h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mt-1 leading-none">
                    Seçilen Paket / Tarife: <span className="text-black font-black">{selectedCoach.price}</span>
                  </p>
                </div>

                <div className="bg-neutral-50 border-2 border-black p-3 rounded-xl flex items-center gap-3">
                  <img src={selectedCoach.imageUrl} className="w-10 h-10 rounded-full border border-black object-cover" />
                  <div className="text-left">
                    <span className="text-[9px] font-black text-black uppercase block">{selectedCoach.university}</span>
                    <span className="text-[10px] font-bold text-[#FF7E67] uppercase block">{selectedCoach.rank}</span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="text-[9.5px] font-black text-black uppercase block mb-1">Telefon Numaranı Bırak:</label>
                    <input
                      type="tel"
                      required
                      placeholder="Örn: 0555 123 4567"
                      className="w-full border-2 border-black p-2.5 text-xs font-bold rounded-xl bg-neutral-50 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9.5px] font-black text-black uppercase block mb-1">Mesajın veya Beklentin:</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Lütfen derece koçuna kendinden ve eksik olduğun alanlardan bahset..."
                      className="w-full border-2 border-black p-2.5 text-xs font-bold rounded-xl bg-neutral-50 focus:bg-white focus:outline-none uppercase"
                    ></textarea>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#FF7E67] hover:bg-red-500 text-white border-3 border-black p-3 rounded-xl font-black text-xs uppercase shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <PhoneCall className="w-4 h-4" />
                  Rezervasyonu Tamamla & İletişime Geç
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { db } from "./src/db/index.ts";
import { profiles, denemeler } from "./src/db/schema.ts";
import { requireAuth, generateToken } from "./src/middleware/auth.ts";
import type { AuthRequest } from "./src/middleware/auth.ts";
import { eq, desc } from "drizzle-orm";
import { adminAuth } from "./src/lib/firebase-admin.ts";
import crypto from "crypto";

dotenv.config();

console.log('[BOOT] DB sürücüsü: SQLite (better-sqlite3) — PostgreSQL DEĞİL');

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy-loaded Gemini client to prevent crashes if key is omitted on startup
let aiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Fallback pre-scripted Turkish responses if no API key is set
const FALLBACK_RESPONSES = [
  "Harika gidiyorsun dostum! Her büyük başarı, kararlılıkla atılan küçük bir adımla başlar. Hadi odaklanmaya devam edelim!",
  "Şampiyon, bugün hedefin için buradayız! Masandaki suyu yudumla ve hedefine kilitlen. Ben her zaman buradayım.",
  "Kral, dikkatini toparla ve o kitaba/ekrana geri dön! Sınav günü veya başarı anında bu dakikaların değerini çok iyi anlayacaksın.",
  "Dostum, pes etmek yok! Kendine bir bardak su al, derin bir nefes al ve yapabileceğinin en iyisini yapmaya odaklan."
];

// Helper to get random fallback
function getRandomFallback() {
  const index = Math.floor(Math.random() * FALLBACK_RESPONSES.length);
  return FALLBACK_RESPONSES[index];
}

// Endpoint: Companion AI assistant with injected states and history
app.post("/api/companion", async (req, res) => {
  try {
    const { message, history, currentMode, goal, timerState } = req.body;

    const ai = getGeminiClient();

    if (!ai) {
      // Return a warm static message indicating key is missing but staying perfectly in character
      return res.json({
        text: getRandomFallback() + " (Not: Odaklanma Yoldaşın şu an yapay zeka entegrasyonu olmadan çalışıyor, ancak kalpten desteği tam!)"
      });
    }

    // Format mode names in Turkish
    const modeNameMap: Record<string, string> = {
      pomodoro: "Klasik Pomodoro (25 dk Odaklanma + 5 dk Mola)",
      extended: "Uzatılmış Pomodoro (50 dk Odaklanma + 10 dk Mola)",
      tyt: "TYT Deneme Modu (Kesintisiz 165 dk)",
      ayt: "AYT / Genel Deneme Modu (Kesintisiz 180 dk)",
    };

    const timerStateMap: Record<string, string> = {
      planning: "Planlama (Çalışmaya başlamadan önceki hazırlık aşaması)",
      focusing: "Odaklanma Süreci (Zamanlayıcı aktif çalışıyor, odaklanması gerek)",
      break: "Mola (Kullanıcının dinlenme ve esneme vakti)",
      finished: "Tamamlandı (Oturum başarıyla bitti veya tamamlandı)",
    };

    const localizedMode = modeNameMap[currentMode] || currentMode || "Belirtilmedi";
    const localizedState = timerStateMap[timerState] || timerState || "Planlama";

    // Build standard high-quality prompt rules conforming to the support buddy persona
    const systemInstruction = `Sen, kullanıcıların odaklanma sürelerini yöneten, onları motive eden ve çalışma süreçlerinde yanlarında olan "Arkadaş Canlısı ve Destekleyici Bir Odaklanma Yoldaşı"sın.
Adın "Yoldaş". Tonun her zaman samimi, enerjik, yapıcı, teşvik edici ve anlayışlı olmalıdır. Kullanıcıya bir robot gibi değil, onun başarısını gerçekten önemseyen yakın bir çalışma arkadaşı gibi hitap et.
Kullanıcıya "dostum", "şampiyon", "kral", "dost" gibi samimi, motive edici hitaplar kullanabilirsin (aşırıya kaçmadan).
Kullanıcı seninle Türkçe konuşacaktır. Sen de her zaman Türkçe konuşacaksın.

MEVCUT OTURUM BİLGİLERİ (Göz önünde bulundur):
- Kullanıcının Seçtiği Çalışma Modu: ${localizedMode}
- Zamanlayıcı Durumu: ${localizedState}
- Kullanıcının Belirlediği Hedef: ${goal || "Henüz tam olarak belirtilmedi."}

OPERASYONEL KURALLAR:
1. Oturum Başlangıcında (timerState: planning): Kullanıcının "Bugün neye odaklanıyoruz?" sorusuna verdiği cevaba göre hedeflerini motive et, planını netleştir. TYT/AYT gibi sınav modlarındaysa, masasında suyunun, optik formunun ve kalemlerinin hazır olup olmadığını arkadaşça hatırlat. Sonra "Hadi süreyi başlatalım şampiyon!" diyerek onu coştur.
2. Odaklanma Sürecinde (timerState: focusing): Başarılar dile ve "Ben buradayım, sen işine odaklan. Süre bitene kadar bildirimlerini kapatmayı unutma!" de. Dikkati dağılırsa veya sohbet etmek isterse onu yargılamadan arkadaşça masaya döndür (Örn: "Hadi dostum, pes etmek yok! Sınavda bu anları hatırlayıp gurur duyacaksın, az kaldı, devam edelim!").
3. Mola ve Oturum Sonunda (timerState: break veya finished): Onu büyük bir coşkuyla tebrik et. Esneme hareketleri yapmasını, derin nefes almasını, bir bardak su içmesini ve ekrandan kesinlikle uzaklaşmasını öner.

Mesajlarını çok uzun tutma. Maksimum 2-3 kısa paragraf olsun, göz yormasın ve çok cana yakın olsun.`;

    // Map client chat history format to Gemini API contents format:
    // Client: { role: 'user' | 'assistant', content: string }
    // Gemini: [{ role: 'user' | 'model', parts: [{ text: string }] }]
    const formattedContents = [];
    
    if (history && Array.isArray(history)) {
      for (const h of history) {
        formattedContents.push({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }]
        });
      }
    }

    // Add current user message
    formattedContents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
      }
    });

    res.json({ text: response.text || getRandomFallback() });
  } catch (error: any) {
    console.error("Gemini API error in /api/companion:", error);
    res.status(500).json({
      error: "Bir sorun oluştu ama ben yine de yanındayım şampiyon! Hadi odaklanmaya devam et.",
      text: getRandomFallback()
    });
  }
});

// Endpoint: AI-powered Exam analysis from OCR photo upload
app.post("/api/analyze-exam", async (req, res) => {
  try {
    const { image, mimeType: bodyMimeType } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Lütfen bir deneme resmi yükle dostum!" });
    }

    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({
        error: "Yoldaş'ın yapay zeka analiz motoru şu an devrede değil. Lütfen Settings > Secrets bölümünden GEMINI_API_KEY anahtarını ekle şampiyon! Ya da elle girişi kullanabilirsin."
      });
    }

    let mimeType = bodyMimeType || "image/jpeg";
    let base64Data = image;
    if (image.includes(";base64,")) {
      const parts = image.split(";base64,");
      if (!bodyMimeType) {
        mimeType = parts[0].replace("data:", "");
      }
      base64Data = parts[1];
    } else if (image.startsWith("data:")) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        if (!bodyMimeType) {
          mimeType = match[1];
        }
        base64Data = match[2];
      }
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };

    const promptText = `Sen YKS deneme optiği veya karne sonucunu analiz eden uzman bir asistansın.
Gönderilen deneme görselini, karne çıktısını veya el yazısı notunu hassas şekilde analiz et.
Lütfen yayının adını veya deneme adını tahmin et/çöz.
Ardından hangi Türkçe, Sosyal, Matematik, Fen, Fizik, Kimya veya Biyoloji derslerinden kaç Doğru (D) ve Yanlış (Y) yapıldığını çıkar.
Doğru ve Yanlış sayılarını tam sayı olarak doldur. (Eğer o ders görselde yoksa veya saptanmadıysa 0 olarak bırak veya boş geç).
Özellikle TYT Genel Denemesi mi, AYT mi yoksa bir dersin Branş Denemesi mi olduğunu tespit et.

Geri döndüreceğin JSON şeması tam olarak şu alanları içermelidir:
- examName: Denemenin veya yayının adı (örn: "Bilgi Sarmal TYT-1", "3D AYT Gen-2")
- examType: Tespit edilen tür. Şu değerlerden biri olmalıdır: "TYT" (TYT Genel için), "AYT" (AYT Genel için), "Türkçe Branş", "Sosyal Branş", "Matematik Branş", "Fen Branş", "AYT Fizik Branş", "AYT Kimya Branş", "AYT Biyoloji Branş"
- turkceD: Türkçe Doğru sayısı
- turkceY: Türkçe Yanlış sayısı
- sosyalD: Sosyal Bilimler Doğru sayısı
- sosyalY: Sosyal Bilimler Yanlış sayısı
- matematikD: Matematik Doğru sayısı
- matematikY: Matematik Yanlış sayısı
- fenD: Fen Bilimleri / Alan dersi Doğru sayısı (AYT ise Fen Bilimleri toplamı; branş ise ilgili branşın doğrusu)
- fenY: Fen Bilimleri / Alan dersi Yanlış sayısı

Lütfen kesinlikle geçerli bir JSON objesi döndür.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, promptText],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            examName: { type: Type.STRING, description: "Denemenin veya yayının adı." },
            examType: { type: Type.STRING, description: "Grup veya branş türü: 'TYT', 'AYT', 'Türkçe Branş', 'Sosyal Branş', 'Matematik Branş', 'Fen Branş', 'AYT Fizik Branş', 'AYT Kimya Branş', 'AYT Biyoloji Branş'." },
            turkceD: { type: Type.INTEGER, description: "Türkçe Doğru Sayısı" },
            turkceY: { type: Type.INTEGER, description: "Türkçe Yanlış Sayısı" },
            sosyalD: { type: Type.INTEGER, description: "Sosyal Bilimler Doğru Sayısı" },
            sosyalY: { type: Type.INTEGER, description: "Sosyal Bilimler Yanlış Sayısı" },
            matematikD: { type: Type.INTEGER, description: "Matematik Doğru Sayısı" },
            matematikY: { type: Type.INTEGER, description: "Matematik Yanlış Sayısı" },
            fenD: { type: Type.INTEGER, description: "Fen Bilimleri / Alan ders Doğru Sayısı" },
            fenY: { type: Type.INTEGER, description: "Fen Bilimleri / Alan ders Yanlış Sayısı" },
          },
          required: ["examName", "examType", "turkceD", "turkceY", "sosyalD", "sosyalY", "matematikD", "matematikY", "fenD", "fenY"]
        },
        temperature: 0.2,
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Gemini API error in /api/analyze-exam:", error);
    res.status(500).json({ error: "Görsel analiz edilirken bir hata oluştu: " + error.message });
  }
});

// Helper for hashing passwords securely
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Custom Authentication endpoints to bypass "auth/operation-not-allowed" on the client
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, username, okul_adi, sehir_adi } = req.body;
    if (!email || !password || !username || !okul_adi) {
      return res.status(400).json({ error: "Lütfen tüm gerekli alanları doldurun!" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if email already exists in our database
    const existingProfile = await db.query.profiles.findFirst({
      where: eq(profiles.email, normalizedEmail),
    });
    if (existingProfile) {
      const passwordHash = hashPassword(password);
      if (existingProfile.passwordHash === passwordHash) {
        const customToken = generateToken(existingProfile.id);
        return res.status(200).json({ customToken, profile: existingProfile });
      }
      return res.status(400).json({ error: "Bu e-posta adresi zaten kullanımda şampiyon!" });
    }

    // 2. Try to create the user in Firebase Auth using Admin SDK or fetch existing
    let uid: string;
    try {
      const userRecord = await adminAuth.createUser({
        email: normalizedEmail,
        password: password,
        displayName: username,
      });
      uid = userRecord.uid;
    } catch (fbErr: any) {
      if (fbErr.code === "auth/email-already-in-use") {
        const userRecord = await adminAuth.getUserByEmail(normalizedEmail);
        uid = userRecord.uid;
      } else {
        console.error("Firebase Admin user creation failed:", fbErr);
        uid = crypto.randomUUID();
      }
    }

    // 3. Save profile to PostgreSQL
    const passwordHash = hashPassword(password);
    const [newProfile] = await db
      .insert(profiles)
      .values({
        id: uid,
        username: username,
        okulAdi: okul_adi,
        sehirAdi: sehir_adi || "",
        basariPuani: 0,
        seriGunu: 1,
        email: normalizedEmail,
        passwordHash: passwordHash,
      })
      .returning();

    // 4. Create custom token
    const customToken = generateToken(uid);
    return res.status(200).json({ customToken, profile: newProfile });
  } catch (error: any) {
    console.error("VERİTABANI BAĞLANTI HATASI DETAYI [register]:", error.message);
    console.error("[register] Stack:", error.stack);
    return res.status(500).json({ error: "Kayıt işlemi sırasında bir hata oluştu: " + error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Lütfen e-posta ve şifrenizi girin!" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = hashPassword(password);

    // 1. Find profile in Postgres by email and password hash
    let userProfile = await db.query.profiles.findFirst({
      where: eq(profiles.email, normalizedEmail),
    });

    if (!userProfile) {
      // Backwards compatibility for users created in Firebase Auth but missing details in Postgres
      try {
        const userRecord = await adminAuth.getUserByEmail(normalizedEmail);
        if (userRecord) {
          const profileByUid = await db.query.profiles.findFirst({
            where: eq(profiles.id, userRecord.uid),
          });
          if (profileByUid) {
            const [updatedProfile] = await db
              .update(profiles)
              .set({
                email: normalizedEmail,
                passwordHash: passwordHash,
              })
              .where(eq(profiles.id, userRecord.uid))
              .returning();
            userProfile = updatedProfile;
          }
        }
      } catch (fbErr) {
        // Not found or failed
      }
    }

    if (!userProfile || userProfile.passwordHash !== passwordHash) {
      return res.status(401).json({ error: "E-posta veya şifre hatalı! Tekrar dene şampiyon." });
    }

    // 2. Generate custom token
    const customToken = generateToken(userProfile.id);
    return res.status(200).json({ customToken, profile: userProfile });
  } catch (error: any) {
    console.error("VERİTABANI BAĞLANTI HATASI DETAYI [login]:", error.message);
    console.error("[login] Stack:", error.stack);
    return res.status(500).json({ error: "Giriş işlemi sırasında bir hata oluştu: " + error.message });
  }
});

// Profile Upsert (Supports POST or PUT)
const handleProfileUpsert = async (req: AuthRequest, res: any) => {
  try {
    const { username, okul_adi, sehir_adi } = req.body;
    if (!username || !okul_adi) {
      return res.status(400).json({ error: "Lütfen kullanıcı adı ve okul adı alanlarını doldurun!" });
    }
    const uid = req.user.uid;

    const [updatedProfile] = await db
      .insert(profiles)
      .values({
        id: uid,
        username,
        okulAdi: okul_adi,
        sehirAdi: sehir_adi || "",
        basariPuani: 0,
        seriGunu: 1,
      })
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          username,
          okulAdi: okul_adi,
          sehirAdi: sehir_adi || "",
        },
      })
      .returning();

    return res.status(200).json({ profile: updatedProfile });
  } catch (error: any) {
    console.error("Error upserting profile:", error);
    return res.status(500).json({ error: "Profil kaydedilirken hata oluştu: " + error.message });
  }
};

app.post("/api/profiles", requireAuth, handleProfileUpsert);
app.put("/api/profiles", requireAuth, handleProfileUpsert);

// Profile Me Get
app.get("/api/profiles/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user.uid;
    const userProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, uid),
    });
    return res.status(200).json({ profile: userProfile || null });
  } catch (error: any) {
    console.error("Error fetching profile me:", error);
    return res.status(500).json({ error: "Profil alınırken hata oluştu: " + error.message });
  }
});

// Helper to update profile's basari_puani based on deneme records
async function updateProfileStats(uid: string) {
  try {
    const userTrials = await db.select().from(denemeler).where(eq(denemeler.userId, uid));
    if (userTrials.length === 0) {
      await db.update(profiles).set({ basariPuani: 0 }).where(eq(profiles.id, uid));
      return;
    }
    const totalNet = userTrials.reduce((sum, item) => sum + item.toplamNet, 0);
    const calculatedSuccessScore = Math.round(totalNet * 10 + (userTrials.length * 5));
    
    await db.update(profiles).set({
      basariPuani: calculatedSuccessScore,
      seriGunu: Math.min(30, userTrials.length),
    }).where(eq(profiles.id, uid));
  } catch (err) {
    console.error("Error updating profile stats:", err);
  }
}

// Denemeler CRUD: LIST
app.get("/api/denemeler", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user.uid;
    const trials = await db
      .select()
      .from(denemeler)
      .where(eq(denemeler.userId, uid))
      .orderBy(desc(denemeler.createdAt));
    return res.status(200).json(trials);
  } catch (error: any) {
    console.error("Error getting denemeler:", error);
    return res.status(500).json({ error: "Denemeler yüklenirken hata oluştu: " + error.message });
  }
});

// Denemeler CRUD: CREATE
app.post("/api/denemeler", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user.uid;
    const { deneme_adi, deneme_turu, turkce_net, sosyal_net, matematik_net, fen_net, toplam_net } = req.body;

    if (!deneme_adi || !deneme_turu) {
      return res.status(400).json({ error: "Deneme adı ve türü zorunludur!" });
    }

    const [newDeneme] = await db
      .insert(denemeler)
      .values({
        userId: uid,
        denemeAdi: deneme_adi,
        denemeTuru: deneme_turu,
        turkceNet: Number(turkce_net) || 0,
        sosyalNet: Number(sosyal_net) || 0,
        matematikNet: Number(matematik_net) || 0,
        fenNet: Number(fen_net) || 0,
        toplamNet: Number(toplam_net) || 0,
      })
      .returning();

    await updateProfileStats(uid);

    return res.status(201).json(newDeneme);
  } catch (error: any) {
    console.error("Error creating deneme:", error);
    return res.status(500).json({ error: "Deneme kaydedilemedi: " + error.message });
  }
});

// Denemeler CRUD: DELETE
app.delete("/api/denemeler/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user.uid;
    const trialId = Number(req.params.id);

    if (isNaN(trialId)) {
      return res.status(400).json({ error: "Geçersiz deneme kimliği!" });
    }

    const [deleted] = await db
      .delete(denemeler)
      .where(eq(denemeler.id, trialId))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "Deneme bulunamadı veya silinemedi." });
    }

    await updateProfileStats(uid);

    return res.status(200).json({ message: "Deneme başarıyla silindi", deleted });
  } catch (error: any) {
    console.error("Error deleting deneme:", error);
    return res.status(500).json({ error: "Deneme silinirken hata oluştu: " + error.message });
  }
});

// Leaderboard / rankings (Sorted by success points)
app.get("/api/rankings", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rankings = await db
      .select()
      .from(profiles)
      .orderBy(desc(profiles.basariPuani))
      .limit(100);
    return res.status(200).json(rankings);
  } catch (error: any) {
    console.error("Error getting rankings:", error);
    return res.status(500).json({ error: "Sıralama listesi alınırken hata oluştu: " + error.message });
  }
});

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Focus Companion] Server is running on port ${PORT}`);
  });
}

startServer();

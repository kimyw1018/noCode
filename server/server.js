import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_INSTRUCTION = `
너는 "오메추"라는 이름의 음식 메뉴 추천 챗봇이야.
사용자의 기분, 날씨, 예산, 같이 먹는 사람, 매운맛 선호, 알레르기 등을 참고해서
한국에서 실제로 사 먹을 수 있는 구체적인 메뉴 2~3개를 친근한 반말/존댓말 섞인 말투로 추천해줘.
정보가 너무 부족하면 짧게 한 가지만 되물어봐도 돼.

답변은 아래 형식을 반드시 지켜:
1. 먼저 자연스러운 대화체 추천 멘트를 1~3문장으로 작성한다.
2. 그 다음 줄바꿈 후, 아래와 같은 JSON 코드블록을 반드시 추가한다. (추천할 메뉴가 없으면 빈 배열 [])
\`\`\`json
[
  {"name": "메뉴명", "reason": "추천 이유 한 줄", "category": "한식|중식|일식|양식|분식|야식|기타"}
]
\`\`\`
JSON 코드블록 외의 다른 설명은 추가하지 마.
`.trim();

app.get("/api/health", (req, res) => {
  res.json({ ok: true, model: GEMINI_MODEL });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY가 설정되지 않았습니다. 서버 .env 파일을 확인하세요.",
      });
    }

    const { message, history } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message 필드가 필요합니다." });
    }

    const contents = [];
    if (Array.isArray(history)) {
      for (const turn of history.slice(-10)) {
        if (!turn || !turn.text) continue;
        contents.push({
          role: turn.role === "bot" ? "model" : "user",
          parts: [{ text: String(turn.text) }],
        });
      }
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      return res.status(502).json({ error: "Gemini API 호출에 실패했습니다.", detail: errText });
    }

    const data = await response.json();
    const rawText =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";

    const { reply, recommendations } = parseReply(rawText);
    res.json({ reply, recommendations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

function parseReply(rawText) {
  const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/i);
  let recommendations = [];
  let reply = rawText.trim();

  if (jsonMatch) {
    reply = rawText.slice(0, jsonMatch.index).trim();
    try {
      const parsed = JSON.parse(jsonMatch[1].trim());
      if (Array.isArray(parsed)) recommendations = parsed;
    } catch (e) {
      console.warn("JSON 파싱 실패:", e.message);
    }
  }

  return { reply: reply || "추천을 준비하지 못했어요. 다시 말씀해 주세요.", recommendations };
}

app.listen(PORT, () => {
  console.log(`오메추 챗봇 서버 실행 중: http://localhost:${PORT}`);
});

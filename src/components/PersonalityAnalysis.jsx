import { useState } from "react";

const C = {
  blue: "#185FA5", blueBg: "#E6F1FB", blueLt: "#B5D4F4",
  teal: "#0F6E56", tealBg: "#E1F5EE",
  success: "#3B6D11", successBg: "#EAF3DE",
  danger: "#A32D2D", dangerBg: "#FCEBEB",
  warn: "#854F0B", warnBg: "#FAEEDA",
  amber: "#D97706", amberBg: "#FEF3C7",
  gray: "#5F5E5A", grayBg: "#F1EFE8",
};

const AXIS_COLORS = [C.blue, C.teal, C.amber, C.gray];
const AXIS_BG = [C.blueBg, "#E1F5EE", C.amberBg, C.grayBg];

async function callClaude(sys, usr, maxTok = 2000) {
  const r = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTok,
      system: sys,
      messages: [{ role: "user", content: usr }],
    }),
  });
  if (!r.ok) {
    const d = await r.json();
    const msg =
      typeof d.error === "string"
        ? d.error
        : d.error?.message || `HTTP ${r.status}`;
    throw new Error(msg);
  }
  const d = await r.json();
  const text = d.content?.[0]?.text || d.text || "";
  if (!text) throw new Error("빈 응답");
  return text;
}

function parseJSON(raw) {
  const cleaned = raw.replace(/```json\n?|```\n?/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {}
  const match = cleaned.match(/\{[\s\S]+\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }
  return null;
}

export default function PersonalityAnalysis({ cl, upd }) {
  const saved = cl.personalityAnalysis || null;
  const [inputText, setInputText] = useState(saved?.inputText || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [toast, setToast] = useState("");

  const result = saved?.result || null;
  const hasStt = !!(cl.extractedQuestions || cl.transcript);

  const loadStt = () => {
    const text =
      cl.transcript ||
      cl.extractedQuestions ||
      [cl.notes?.q1, cl.notes?.q2, cl.notes?.q3].filter(Boolean).join("\n\n") ||
      "";
    setInputText(text);
  };

  const runAnalysis = async () => {
    if (!inputText.trim()) {
      alert("녹취록 텍스트를 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError(false);

    const sys = `당신은 비즈니스 제안 전문가입니다.
인터뷰 녹취록을 분석해서 클라이언트의 의사결정 성향을 파악하고
최적의 제안 전략을 JSON으로만 출력하세요.
다른 텍스트, 설명, 마크다운 없이 JSON만 출력하세요.`;

    const usr = `다음 인터뷰 녹취록을 분석해서 아래 JSON 형식으로만 응답하세요.

[녹취록 텍스트]
${inputText}

응답 JSON 형식:
{
  "axes": [
    { "name": "논리 vs 감정", "left": "감정(F)", "right": "논리(T)", "score": 75, "evidence": "근거 발언" },
    { "name": "결론 vs 옵션", "left": "옵션(P)", "right": "결론(J)", "score": 80, "evidence": "근거 발언" },
    { "name": "구체 vs 개념", "left": "개념(N)", "right": "구체(S)", "score": 85, "evidence": "근거 발언" },
    { "name": "빠른결정 vs 신중", "left": "신중", "right": "빠른결정", "score": 65, "evidence": "근거 발언" }
  ],
  "topInterests": ["관심사1", "관심사2", "관심사3"],
  "resistancePoints": ["저항포인트1", "저항포인트2"],
  "strategy": {
    "proposalOrder": "제안서 구성 순서 설명",
    "emphasize": "강조할 포인트",
    "avoid": "피해야 할 표현",
    "meetingStyle": "미팅 운영 방식"
  },
  "summary": "이 클라이언트는 ___한 사람이므로, ___방식으로 제안하라."
}`;

    try {
      const raw = await callClaude(sys, usr, 2000);
      const parsed = parseJSON(raw);
      if (!parsed) {
        setError(true);
        setLoading(false);
        return;
      }
      const analysisData = {
        analyzedAt: new Date().toISOString(),
        inputText,
        result: parsed,
      };
      upd({ personalityAnalysis: analysisData });
      setToast("성향 분석 결과가 저장되었습니다.");
      setTimeout(() => setToast(""), 3000);
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        border: "0.5px solid var(--color-border-tertiary)",
        borderLeft: `4px solid ${C.blue}`,
        borderRadius: 12,
        padding: "1.1rem 1.25rem",
        marginBottom: "1rem",
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 500,
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 7,
        }}
      >
        <span style={{ fontSize: 16 }}>🧠</span>
        클라이언트 성향 분석
      </div>

      {toast && (
        <div
          style={{
            background: C.successBg,
            color: C.success,
            padding: "8px 14px",
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 12,
            fontWeight: 500,
          }}
        >
          ✓ {toast}
        </div>
      )}

      <div
        style={{
          fontSize: 12,
          color: "var(--color-text-secondary)",
          marginBottom: 8,
        }}
      >
        인터뷰 녹취록 텍스트를 입력하면 AI가 클라이언트 성향과 최적 제안 전략을
        분석합니다.
      </div>

      {hasStt && (
        <button
          onClick={loadStt}
          style={{
            fontSize: 12,
            padding: "4px 12px",
            borderRadius: 20,
            border: `0.5px solid ${C.blueLt}`,
            background: C.blueBg,
            color: C.blue,
            cursor: "pointer",
            fontFamily: "inherit",
            marginBottom: 8,
            display: "inline-block",
          }}
        >
          📥 STT 결과 불러오기
        </button>
      )}

      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="인터뷰 녹취록을 붙여넣으세요..."
        rows={8}
        style={{
          width: "100%",
          fontSize: 13,
          padding: "8px 10px",
          borderRadius: 8,
          border: "1.5px solid #C5C5C5",
          background: "var(--color-background-primary)",
          color: "var(--color-text-primary)",
          resize: "vertical",
          boxSizing: "border-box",
          fontFamily: "inherit",
          marginBottom: 10,
          display: "block",
        }}
      />

      <button
        onClick={loading ? undefined : runAnalysis}
        disabled={loading}
        className="btn-ai"
        style={{ opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "⟳ AI가 분석 중입니다..." : "🧠 성향 분석 실행"}
      </button>

      {error && !loading && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 14px",
            background: C.dangerBg,
            color: C.danger,
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          ⚠ 분석 결과를 불러오지 못했습니다. 다시 시도해 주세요.
          <button
            onClick={runAnalysis}
            style={{
              marginLeft: 8,
              color: C.blue,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              textDecoration: "underline",
              fontFamily: "inherit",
            }}
          >
            다시 시도
          </button>
        </div>
      )}

      {result && !loading && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: C.blue,
              marginBottom: 12,
            }}
          >
            ✦ 성향 분석 완료
            {saved?.analyzedAt
              ? " · " +
                new Date(saved.analyzedAt).toLocaleString("ko-KR", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </div>

          {/* ① 의사결정 성향 */}
          <div
            style={{
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: 10,
              padding: "14px",
              marginBottom: 10,
            }}
          >
            <div
              style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}
            >
              ① 의사결정 성향
            </div>
            {(result.axes || []).map((ax, i) => {
              const color = AXIS_COLORS[i % AXIS_COLORS.length];
              const axBg = AXIS_BG[i % AXIS_BG.length];
              const score = Math.min(100, Math.max(0, ax.score ?? 50));
              const dominantLabel = score >= 50 ? ax.right : ax.left;
              const dominantPct = score >= 50 ? score : 100 - score;
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 500 }}>
                      {ax.name}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        background: axBg,
                        color,
                        padding: "2px 8px",
                        borderRadius: 10,
                        fontWeight: 500,
                      }}
                    >
                      {dominantLabel} ({dominantPct}%)
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-secondary)",
                        minWidth: 52,
                        textAlign: "right",
                        lineHeight: 1.3,
                      }}
                    >
                      {ax.left}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        position: "relative",
                        height: 8,
                        background: "#E5E7EB",
                        borderRadius: 4,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          height: "100%",
                          width: `${score}%`,
                          background: color,
                          borderRadius: 4,
                          transition: "width 0.4s",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: `${score}%`,
                          transform: "translate(-50%, -50%)",
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: color,
                          border: "2px solid #fff",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-secondary)",
                        minWidth: 52,
                        lineHeight: 1.3,
                      }}
                    >
                      {ax.right}
                    </span>
                  </div>
                  {ax.evidence && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-secondary)",
                        marginTop: 5,
                        fontStyle: "italic",
                        paddingLeft: 60,
                        lineHeight: 1.5,
                      }}
                    >
                      "{ax.evidence}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ② 핵심 관심사 */}
          {(result.topInterests || []).length > 0 && (
            <div
              style={{
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: 10,
                padding: "14px",
                marginBottom: 10,
              }}
            >
              <div
                style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}
              >
                ② 핵심 관심사 Top 3
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {result.topInterests.map((interest, i) => (
                  <span
                    key={i}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 20,
                      background: C.blueBg,
                      color: C.blue,
                      fontSize: 12,
                      border: `0.5px solid ${C.blueLt}`,
                      fontWeight: 500,
                    }}
                  >
                    {i + 1}. {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ③ 저항 가능성 */}
          {(result.resistancePoints || []).length > 0 && (
            <div
              style={{
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: 10,
                padding: "14px",
                marginBottom: 10,
              }}
            >
              <div
                style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}
              >
                ③ 저항 가능성 포인트
              </div>
              {result.resistancePoints.map((pt, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      background: C.dangerBg,
                      color: C.danger,
                      padding: "1px 6px",
                      borderRadius: 10,
                      flexShrink: 0,
                      marginTop: 2,
                      fontWeight: 500,
                    }}
                  >
                    ⚠
                  </span>
                  <span style={{ fontSize: 13, lineHeight: 1.6 }}>{pt}</span>
                </div>
              ))}
            </div>
          )}

          {/* ④ 제안 전략 */}
          {result.strategy && (
            <div
              style={{
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: 10,
                padding: "14px",
                marginBottom: 10,
              }}
            >
              <div
                style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}
              >
                ④ 제안 전략 권고
              </div>
              {[
                ["📋 제안서 구성 순서", result.strategy.proposalOrder],
                ["✅ 강조할 포인트", result.strategy.emphasize],
                ["⛔ 피해야 할 표현", result.strategy.avoid],
                ["🤝 미팅 운영 방식", result.strategy.meetingStyle],
              ].map(([label, value]) =>
                value ? (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: "var(--color-text-secondary)",
                        marginBottom: 3,
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>{value}</div>
                  </div>
                ) : null
              )}
            </div>
          )}

          {/* ⑤ 한줄 요약 */}
          {result.summary && (
            <div
              style={{
                background: C.blueBg,
                border: `1px solid ${C.blueLt}`,
                borderRadius: 10,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: C.blue,
                  marginBottom: 6,
                }}
              >
                ⑤ 한줄 요약
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                {result.summary}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

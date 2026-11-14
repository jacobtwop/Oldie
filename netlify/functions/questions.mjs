// Asks the model for lock-in questions. The API key lives only in Netlify's settings.
export default async (req) => {
  if (req.method !== "POST") return new Response("POST only", { status: 405 });
  const need = process.env.WILDWOOD_PASSPHRASE;
  if (need && req.headers.get("x-wildwood-key") !== need) return new Response("nope", { status: 401 });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return new Response("no key set", { status: 500 });
  let prompt = "";
  try { prompt = String((await req.json()).prompt || ""); } catch (e) {}
  if (!prompt || prompt.length > 30000) return new Response("bad prompt", { status: 400 });
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) return new Response("upstream " + r.status, { status: 502 });
  const data = await r.json();
  const text = (data.content || []).map((c) => c.text || "").join("");
  const m = text.match(/\[[\s\S]*\]/);
  let questions = [];
  try { questions = JSON.parse(m ? m[0] : "[]"); } catch (e) {}
  if (!Array.isArray(questions) || !questions.length) return new Response("no questions", { status: 502 });
  return new Response(JSON.stringify({ questions: questions.slice(0, 3).map(String) }), {
    headers: { "content-type": "application/json" },
  });
};

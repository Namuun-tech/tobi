// Тоби AI — Qwen (Alibaba Cloud Model Studio) руу дамжуулах серверийн функц.
// Түлхүүр зөвхөн Vercel-ийн Environment Variable-д байна, хөтөч рүү хэзээ ч очихгүй.
//
// Env:
//   DASHSCOPE_API_KEY   (заавал)  Model Studio API түлхүүр
//   DASHSCOPE_BASE_URL  (сонголт) OpenAI-compatible endpoint, хакатоны нээлтээр өгнө
//   QWEN_MODEL          (сонголт) анхдагч: qwen3.8-flash
//   DAILY_CAP           (сонголт) нэг серверийн инстанц дээрх өдрийн дээд хүсэлт, анхдагч 500
//   RATE_PER_MIN        (сонголт) нэг IP-гээс минутад, анхдагч 10

const BASE = (process.env.DASHSCOPE_BASE_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1").replace(/\/+$/, "");
const MODEL = process.env.QWEN_MODEL || "qwen3.8-flash";
const DAILY_CAP = parseInt(process.env.DAILY_CAP || "500", 10);
const RATE_PER_MIN = parseInt(process.env.RATE_PER_MIN || "10", 10);

// Энгийн санах ойн хязгаарлагч. Инстанц бүрт тусдаа тоологдоно; хакатоны демод хангалттай.
const hits = new Map();
let day = "", dayCount = 0;

const SYSTEM = `Чи бол "Тоби" — монгол гэр бүлийн гэрийн менежер апп-ын AI туслах.
- Үргэлж монголоор, товч, найрсаг, 1–4 өгүүлбэрээр хариул. Мөнгийг "84,500₮" хэлбэрээр бич.
- Гэр бүлийн өгөгдлийг зөвхөн хэрэгслээр (tools) ав. Өгөгдөлд байхгүй зүйлийг бүү зохио.
- Худалдан авалтын жагсаалтад нэмэх хүсэлтэд add_shopping_items хэрэгслийг дууд. Хэрэглэгч дараа нь баталгаажуулна.
- Эрүүл мэндийн асуултад эмчийн зөвлөгөө өгөхгүй; хуваарийг сануулж, эмчтэйгээ зөвлөхийг санал болго.
- Апп-ын сэдвээс гадуурх хүсэлтийг эелдгээр татгалзаж, юу хийж чадахаа хэл.`;

const TOOLS = [
  { type: "function", function: { name: "get_budget_summary", description: "Энэ сарын төсөв, зарцуулалт, ангилал тус бүрийн дүн, сүүлийн гүйлгээнүүд", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_events", description: "Гэр бүлийн хуанлийн үйл явдлууд (өнөөдрөөс 14 хоног)", parameters: { type: "object", properties: { date: { type: "string", description: "YYYY-MM-DD, тодорхой өдөр шүүх бол" } } } } },
  { type: "function", function: { name: "get_shopping_list", description: "Худалдан авалтын жагсаалтын авах ёстой зүйлс", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "get_health_schedule", description: "Бяцхан хүүхдийн вакцин, эмчийн үзлэгийн хуваарь", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "get_chores", description: "Хүүхдүүдийн гэрийн ажил, цуглуулсан оноо, урамшууллын зорилго", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "get_inventory", description: "Гэрийн эд хөрөнгийн бүртгэл - байгаа зүйлс, ангилал", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "search_items", description: "Эд хөрөнгөөс нэр эсвэл ангилалаар хайх", parameters: { type: "object", properties: { query: { type: "string", description: "Хайх үг (нэр эсвэл ангилал)" } }, required: ["query"] } } },
  { type: "function", function: { name: "add_shopping_items", description: "Худалдан авалтын жагсаалтад зүйл нэмэх санал (хэрэглэгч баталгаажуулна)", parameters: { type: "object", properties: { items: { type: "array", items: { type: "string" }, description: "Жишээ: ['Сүү 1л', 'Талх']" } }, required: ["items"] } } }
];

function runTool(name, args, ctx) {
  switch (name) {
    case "get_budget_summary":
      if (ctx.viewer.child) return { error: "Төсвийн мэдээлэл зөвхөн эцэг эхэд харагдана." };
      return { today: ctx.today, budget: ctx.budget, transactions: ctx.transactions };
    case "get_chores": return { chores: ctx.chores, points: ctx.points };
    case "list_events": return { today: ctx.today, events: (ctx.events || []).filter(e => !args.date || e.date === args.date) };
    case "get_shopping_list": return { items: ctx.shopping };
    case "get_health_schedule": return { today: ctx.today, schedule: ctx.health };
    case "get_inventory": return { assets: ctx.assets || [], categories: ctx.assetCats || [] };
    case "search_items": {
      const q = (args.query || "").toLowerCase();
      const found = (ctx.assets || []).filter(a => a.name.toLowerCase().includes(q) || (a.category || "").toLowerCase().includes(q));
      return { query: args.query, found: found, total: found.length };
    }
    default: return { error: "unknown tool" };
  }
}

function clip(v, n) { return String(v == null ? "" : v).slice(0, n); }

// Хөтчөөс ирсэн өгөгдлийг хэмжээгээр нь хязгаарлаж цэвэрлэнэ.
function cleanContext(c) {
  c = c && typeof c === "object" ? c : {};
  const arr = (a, n) => (Array.isArray(a) ? a.slice(0, n) : []);
  const v = c.viewer && typeof c.viewer === "object" ? c.viewer : {};
  return {
    viewer: { name: clip(v.name, 30), role: clip(v.role, 30), child: v.child !== false },
    chores: arr(c.chores, 40).map(x => ({ who: clip(x.who, 30), title: clip(x.title, 80), points: Number(x.points) || 0, done: !!x.done })),
    points: Object.fromEntries(Object.entries((c.points && typeof c.points === "object") ? c.points : {}).slice(0, 6).map(([k, p]) => [clip(k, 30), { points: Number(p && p.points) || 0, goal: Number(p && p.goal) || 0, reward: clip(p && p.reward, 60) }])),
    today: clip(c.today, 10),
    members: arr(c.members, 8).map(m => ({ name: clip(m.name, 30), role: clip(m.role, 30) })),
    events: arr(c.events, 40).map(e => ({ date: clip(e.date, 10), time: clip(e.time, 5), title: clip(e.title, 80), who: clip(e.who, 30) })),
    shopping: arr(c.shopping, 50).map(s => clip(s, 60)),
    budget: !c.budget ? null : { limit: Number(c.budget && c.budget.limit) || 0, spent: Number(c.budget && c.budget.spent) || 0, by_category: Object.fromEntries(Object.entries((c.budget && c.budget.by_category) || {}).slice(0, 12).map(([k, v]) => [clip(k, 30), Number(v) || 0])) },
    transactions: arr(c.transactions, 20).map(t => ({ date: clip(t.date, 10), name: clip(t.name, 60), category: clip(t.category, 30), amount: Number(t.amount) || 0 })),
    health: arr(c.health, 10).map(h => ({ member: clip(h.member, 40), name: clip(h.name, 80), date: clip(h.date, 10), place: clip(h.place, 60) })),
    assets: arr(c.assets, 50).map(a => ({ name: clip(a.name, 60), category: clip(a.category, 30), qty: Number(a.qty) || 0, unit: clip(a.unit, 10), location: clip(a.location, 40), note: clip(a.note, 60) })),
    assetCats: arr(c.assetCats, 20).map(c => ({ id: Number(c.id) || 0, name: clip(c.name, 30), icon: clip(c.icon, 4), count: Number(c.count) || 0 }))
  };
}

async function qwen(messages) {
  const r = await fetch(BASE + "/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.DASHSCOPE_API_KEY },
    body: JSON.stringify({ model: MODEL, messages, tools: TOOLS, max_tokens: 400, temperature: 0.4 }),
    signal: AbortSignal.timeout(15000)
  });
  if (!r.ok) throw new Error("qwen " + r.status);
  return r.json();
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const hasKey = !!process.env.DASHSCOPE_API_KEY;

  if (req.method === "GET") return res.status(200).json({ live: hasKey, model: hasKey ? MODEL : null });
  if (req.method !== "POST") return res.status(405).json({ ok: false, reason: "method" });
  if (!hasKey) return res.status(200).json({ ok: false, reason: "no_key" });

  // Зөвхөн өөрийн домэйноос
  const origin = req.headers.origin || "";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  if (!origin || origin !== "https://" + host) return res.status(403).json({ ok: false, reason: "origin" });

  // IP тутмын хурдны хязгаар
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < 60000);
  if (list.length >= RATE_PER_MIN) return res.status(429).json({ ok: false, reason: "rate_limited" });
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();

  // Өдрийн нийт дээд хэмжээ
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) { day = today; dayCount = 0; }
  if (dayCount >= DAILY_CAP) return res.status(429).json({ ok: false, reason: "daily_cap" });
  dayCount++;

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  if (JSON.stringify(body).length > 30000) return res.status(413).json({ ok: false, reason: "too_large" });
  const ctx = cleanContext(body.context);
  const history = (Array.isArray(body.messages) ? body.messages : []).slice(-8)
    .filter(m => m && (m.role === "user" || m.role === "assistant"))
    .map(m => ({ role: m.role, content: clip(m.content, 600) }));
  if (!history.length || history[history.length - 1].role !== "user") return res.status(400).json({ ok: false, reason: "bad_request" });

  const viewerLine = ctx.viewer.child
    ? `Одоо ${ctx.viewer.name} (${ctx.viewer.role}) — хүүхэд ярьж байна. Энгийн, урамтай үгээр хариул. Төсөв, мөнгөний мэдээлэл бүү өг.`
    : `Одоо ${ctx.viewer.name} (${ctx.viewer.role}) — эцэг эх ярьж байна.`;
  const messages = [{ role: "system", content: SYSTEM + `\nӨнөөдөр: ${ctx.today}. Гэр бүл: ${ctx.members.map(m => m.name + " (" + m.role + ")").join(", ")}.\n${viewerLine}` }, ...history];
  const used = [];
  let action = null;

  try {
    for (let round = 0; round < 3; round++) {
      const data = await qwen(messages);
      const msg = data.choices && data.choices[0] && data.choices[0].message;
      if (!msg) throw new Error("empty");
      const calls = msg.tool_calls || [];
      if (!calls.length) return res.status(200).json({ ok: true, reply: clip(msg.content, 2000), model: MODEL, tools: used, action });
      messages.push({ role: "assistant", content: msg.content || "", tool_calls: calls });
      for (const c of calls) {
        let args = {};
        try { args = JSON.parse(c.function.arguments || "{}"); } catch (e) {}
        used.push(c.function.name);
        let result;
        if (c.function.name === "add_shopping_items") {
          const items = (Array.isArray(args.items) ? args.items : []).slice(0, 15).map(s => clip(s, 60)).filter(Boolean);
          action = { type: "add_shopping_items", items };
          result = { status: "pending_user_confirmation", items };
        } else {
          result = runTool(c.function.name, args, ctx);
        }
        messages.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify(result) });
      }
    }
    return res.status(200).json({ ok: true, reply: "Уучлаарай, хариуг бэлдэж чадсангүй. Дахин асууна уу.", model: MODEL, tools: used, action });
  } catch (e) {
    console.error("tobi error:", e && e.message);
    return res.status(200).json({ ok: false, reason: "error" });
  }
};

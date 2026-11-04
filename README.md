# tobi — Гэр бүл нэг дор

Гэр бүлийн төлөвлөгөө, хоол, хүнс, хуваарь, санхүү, эрүүл мэнд, дурсамжийг нэг апп-д хөтөлдөг **гэрийн менежер**. AI туслах нь Alibaba Cloud Model Studio дээрх **Qwen** загваруудаар ажиллана. Төлбөрийг **QPay**-ээр урьдчилж төлнө.

> Gerege × Qwen Hackathon · 2026.11.03 13:00 – 11.06 13:00 · Баг: `[багийн нэр]`
>
> Демо: **https://tobi-demo-beige.vercel.app** · Слайд: [`docs/TOBI_Demo.pptx`](docs/TOBI_Demo.pptx) · Брэндбук: [`docs/brandbook.html`](docs/brandbook.html)

---

## Одоогийн демо (энэ репо)

Энэ репо дахь ажилладаг демо нь Vercel дээр байршсан, хоёр хэсэгтэй хөнгөн хувилбар. Доорх 3–15-р хэсэгт бүрэн хувилбарын (Next.js) төлөвлөгөөг бичсэн.

| Файл | Үүрэг |
|---|---|
| `index.html` | Апп-ын бүх дэлгэц: нүүр, хуанли, худалдан авалт, төсөв, Тоби чат, QPay sandbox урсгал. Өгөгдөл зохиомол, хөтчийн `localStorage`-д хадгалагдана |
| `api/tobi.js` | Vercel серверийн функц. Чатын асуултыг Qwen (Model Studio, OpenAI-compatible) руу tool calling-оор дамжуулна. Түлхүүр зөвхөн сервер дээр |
| `docs/` | Брэндбук, демо слайд |

**Qwen-ийг асаах:** Vercel → Project → Settings → Environment Variables:

| Нэр | Утга |
|---|---|
| `DASHSCOPE_API_KEY` | Model Studio API түлхүүр (заавал) |
| `DASHSCOPE_BASE_URL` | Хакатоны нээлтээр өгсөн base URL (анхдагч: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`) |
| `QWEN_MODEL` | Анхдагч `qwen3.8-flash` |
| `DAILY_CAP`, `RATE_PER_MIN` | Өдрийн нийт (500), нэг IP-гийн минутын (10) хязгаар |

Тохируулсны дараа `vercel deploy --prod` хийнэ. Түлхүүргүй үед чат урьдчилан бэлтгэсэн дуурайлгаар ажиллаж, «Демо горим» гэж бичигдэнэ.

**Хамгаалалт:** түлхүүр хөтөч рүү очдоггүй; зөвхөн өөрийн домэйноос хүсэлт хүлээн авна; IP болон өдрийн хязгаар; хариулт ≤ 400 токен; бичих үйлдэл (жагсаалтад нэмэх) хэрэглэгчийн баталгаажуулалт шаардана. Хязгаарлагч нь инстанц тутмын санах ойд ажилладаг тул бодит хэрэглээнд Alibaba Cloud-ийн зардлын сэрэмжлүүлэгтэй хамт хэрэглэнэ.

**Орон нутагт ажиллуулах:** `vercel dev` (эсвэл `index.html`-ийг хөтчөөр шууд нээвэл чат дуурайлгаар ажиллана).

---

## Агуулга

1. [Бүтээгдэхүүн](#1-бүтээгдэхүүн)
2. [Хакатоны шаардлагатай уялдаа](#2-хакатоны-шаардлагатай-уялдаа)
3. [Технологи](#3-технологи)
4. [Архитектур](#4-архитектур)
5. [Qwen AI функцууд](#5-qwen-ai-функцууд)
6. [QPay урьдчилсан төлбөр](#6-qpay-урьдчилсан-төлбөр)
7. [Өгөгдлийн бүтэц](#7-өгөгдлийн-бүтэц)
8. [Хавтасны бүтэц](#8-хавтасны-бүтэц)
9. [Ажиллуулах](#9-ажиллуулах)
10. [Байршуулах (deploy)](#10-байршуулах-deploy)
11. [72 цагийн төлөвлөгөө](#11-72-цагийн-төлөвлөгөө)
12. [Аюулгүй байдал, хүртээмж](#12-аюулгүй-байдал-хүртээмж)
13. [Үнэ, ашгийн тооцоо](#13-үнэ-ашгийн-тооцоо)
14. [Демо сценари](#14-демо-сценари)
15. [Хүлээлгэн өгөх зүйлс](#15-хүлээлгэн-өгөх-зүйлс)

---

## 1. Бүтээгдэхүүн

### Хэрэглэгчид

| Үүрэг | Хэн | Юу хийнэ |
|---|---|---|
| Шийдвэр гаргагч | Аав, ээж | Гэр бүл үүсгэх, төлбөр төлөх, төсөв, хуваарь хөтлөх |
| Оролцогч | Хүүхдүүд (6–17 нас) | Хичээл, ном, гэрийн ажлаа тэмдэглэх |
| Хамааралтай | Нялх, бага насны хүүхэд (0–5 ой) | Эрүүл мэнд, өсөлт, дурсамжийг эцэг эх нь хөтөлнө |
| Анхны хэрэглэгч | Gerege-ийн ажилтнуудын гэр бүл | Компани урамшуулал болгон олгож, дотооддоо туршина |

### 14 модуль (4 бүлэг)

| Бүлэг | Модуль | MVP (хакатон) |
|---|---|---|
| Төлөвлөлт | Сар, жилийн төлөвлөгөө | ✅ |
| | Хичээл, ажлын хуваарь | ✅ |
| | Баяр, тэмдэглэлт өдөр, зардлын төлөвлөгөө | ⏳ |
| Гэр ахуй | Хоолны цэс | ✅ AI |
| | Хүнсний худалдан авалт | ✅ AI |
| | Цэвэрлэгээний хуваарь | ✅ |
| | Засвар, тохижилтын төлөвлөгөө | ⏳ |
| | Эд хөрөнгийн бүртгэл (аяллын хэрэгсэл г.м) | ⏳ |
| Санхүү | Орлого, зарлага, төсөв | ✅ AI |
| | Өр, орлогын харьцаа | ⏳ |
| Хүмүүс, дурсамж | Эрүүл мэндийн тэмдэглэл | ⏳ |
| | Уншсан номын тэмдэглэл | ⏳ |
| | Чөлөөт цаг: тоглох, уул, кино | ⏳ |
| | Дурсамжийн цомог, гишүүн бүрийн тэмдэглэл | ✅ AI |

✅ = 72 цагт хийнэ · ⏳ = өгөгдлийн хүснэгт, энгийн жагсаалт хэлбэрээр л үлдээнэ (дараагийн хувилбарт бүрэн хийнэ)

Гишүүдийг хүссэн үедээ нэмж, хасна. Гишүүн бүр брэндбукт заасан өнгөтэй байна.

---

## 2. Хакатоны шаардлагатай уялдаа

Эх сурвалж: хакатоны албан ёсны удирдамж (qwen-ub-2026-recap.vercel.app/hackathon).

| # | Шаардлага | Тобид хэрхэн биелэх |
|---|---|---|
| 1 | **ЗААВАЛ:** шүүлтийн өдөр бүх realtime inference зөвхөн Model Studio дээрх Qwen-ээр явна | Бүх AI дуудлага `lib/ai/qwen.ts` нэг клиентээр дамжина. Өөр LLM-ийн түлхүүр production орчинд байхгүй |
| 2 | **ЗААВАЛ:** бүх төлбөр урьдчилсан, QPay-ээр | Захиалга идэвхгүй бол апп зөвхөн төлбөрийн дэлгэц харуулна (`middleware.ts`) |
| 3 | **ЗААВАЛ:** үнэ зах зээлээс өрсөлдөхүйц, 2–3 үйлчилгээтэй харьцуулна | 999₮/сар. Cozi Gold, FamilyWall, Maple Plus-тай харьцуулсан ([§13](#13-үнэ-ашгийн-тооцоо)) |
| 4 | Бодит харилцагчийн өгөгдөл ашиглахгүй | Зөвхөн `seed`-ийн зохиомол «Болдын гэр бүл» |
| 5 | QPay зөвхөн sandbox | `QPAY_BASE_URL` sandbox руу заана |

Үнэлгээний шалгуур: Qwen ашиглалт · ашигт ажиллагаа · production-д бэлэн байдал (UI/UX, хүртээмж, хурд, аюулгүй байдал, нийтэд нээлттэй) · Gerege-д хэрэгцээтэй эсэх.

---

## 3. Технологи

| Давхарга | Сонголт | Шалтгаан |
|---|---|---|
| Frontend + API | **Next.js 15** (App Router, TypeScript) | Нэг репод UI ба сервер. Vercel-д шууд байршина |
| UI | Tailwind CSS, брэндбукийн токенууд | Цайвар, бараан горим |
| Мобайл | PWA (manifest + service worker) | 72 цагт native апп хийхгүйгээр утсанд суулгана |
| Өгөгдлийн сан | **PostgreSQL 16 + pgvector** (Neon эсвэл Supabase) | Дурсамжийн семантик хайлт |
| ORM | Drizzle ORM | Хөнгөн, TypeScript-тэй сайн |
| Нэвтрэлт | Auth.js (и-мэйл magic link) | Нууц үггүй, хурдан |
| Файл | S3-тэй нийцтэй сан (Alibaba OSS эсвэл Supabase Storage) | Дурсамжийн зураг, дуут бичлэг |
| AI | **Qwen**, Model Studio, OpenAI-тэй нийцтэй API | `openai` npm багцыг base URL сольж ашиглана |
| Төлбөр | **QPay** Merchant API v2 (sandbox) | Монголд хамгийн өргөн хэрэглэгддэг |

---

## 4. Архитектур

```
┌──────────────┐     HTTPS      ┌──────────────────────────┐
│  Тоби апп    │ ─────────────▶ │  Next.js сервер (Vercel) │
│  (PWA, утас) │ ◀───────────── │  · Auth, эрхийн шалгалт  │
└──────────────┘                │  · Захиалгын шалгалт     │
                                │  · AI quota (150/сар)    │
                                └──┬──────────┬─────────┬──┘
                                   │          │         │
                    ┌──────────────▼──┐  ┌────▼─────┐ ┌─▼────────────┐
                    │ Model Studio    │  │ Postgres │ │ QPay API     │
                    │ Qwen загварууд  │  │ +pgvector│ │ (sandbox)    │
                    └─────────────────┘  └──────────┘ └──────────────┘
```

Зарчим:
- API түлхүүрүүд **зөвхөн серверт** байна. Браузер Model Studio, QPay-г шууд дуудахгүй.
- AI өгөгдөл өөрчлөх үйлдэл санал болговол (жишээ нь хүнсний жагсаалтад нэмэх) хэрэглэгч **«Тийм» дарж баталгаажуулсны дараа** л хадгална.

---

## 5. Qwen AI функцууд

Model Studio нь OpenAI-тэй нийцтэй API өгдөг. Base URL-ыг хакатоны нээлтийн үеэр өгнө. Сингапур бүсийн жишээ: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`.

| Функц | Загвар | Чадамж | Endpoint |
|---|---|---|---|
| 7 хоногийн хоолны цэс + хүнсний жагсаалт | `qwen3.7-plus` | Structured output (JSON schema strict) | `POST /api/ai/meal-plan` |
| «Энэ сард хүнсэнд хэд зарцуулсан бэ?» | `qwen3.7-plus` | Function calling | `POST /api/ai/ask` |
| Зарлагыг ангилах, сануулгын текст бичих | `qwen3.8-flash` | Хямд, хурдан | `POST /api/ai/classify` |
| Дуут тэмдэглэл: монгол яриа → текст | `qwen3.8-omni-flash` | Монгол яриаг ойлгоно* | `POST /api/ai/voice-note` |
| Дурсамж, тэмдэглэлээс хайх | `qwen3.7-text-embedding` (+ `qwen3-rerank`) | Khalkha Mongolian embedding | `POST /api/ai/search` |

\* Хакатоны техникийн тэмдэглэлээр: ASR загварууд монгол хэл дэмжихгүй, Omni монгол яриаг ойлгох боловч монголоор ярихгүй. Иймд дуут тэмдэглэлийг зөвхөн текст болгоход ашиглана.

### Клиент (`lib/ai/qwen.ts`)

```ts
import OpenAI from "openai";

export const qwen = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY!,   // pay-as-you-go "sk-..." түлхүүр
  baseURL: process.env.DASHSCOPE_BASE_URL!, // нээлтийн үеэр өгсөн URL
});

export const MODELS = {
  smart: "qwen3.7-plus",
  fast: "qwen3.8-flash",
  voice: "qwen3.8-omni-flash",
  embed: "qwen3.7-text-embedding",
  rerank: "qwen3-rerank",
} as const;
```

### Function calling: AI-д өгөх хэрэгслүүд

| Tool | Үйлдэл | Баталгаажуулалт |
|---|---|---|
| `get_budget_summary(month)` | Сарын орлого, зарлага, ангиллаар | Шаардлагагүй (зөвхөн уншина) |
| `list_events(from, to, member?)` | Хуваарь, үйл явдал | Шаардлагагүй |
| `add_shopping_items(items[])` | Хүнсний жагсаалтад нэмэх | **Заавал** |
| `create_event(title, date, member)` | Хуваарьт нэмэх | **Заавал** |
| `add_transaction(amount, category, note)` | Зарлага бүртгэх | **Заавал** |

### Системийн заавар (товч)

```
Чи "Тоби" — гэр бүлийн тайван, анхааралтай туслах. Монгол хэлээр, "та" гэж хандаж,
товч, тодорхой хариул. Мөнгөн дүнг 2,400,000₮, огноог 2026.11.04 хэлбэрээр бич.
Хэрэглэгчийг буруутгахгүй. Эрүүл мэндийн асуултад "Энэ нь эмчийн зөвлөгөөг орлохгүй"
гэж заавал нэм. Өгөгдөл өөрчлөх бол эхлээд хэрэглэгчээс асуу. Мэдэхгүй бол "мэдэхгүй" гэ.
```

### AI хэрэглээний хязгаар

Гэр бүл бүр сард **150 AI хүсэлт** хийнэ (`ai_usage` хүснэгт). Хязгаарт хүрвэл «Энэ сарын AI хүсэлт дууслаа. Дараагийн сарын 1-нд шинэчлэгдэнэ.» гэж харуулна. Энэ нь [§13](#13-үнэ-ашгийн-тооцоо)-ийн ашгийн тооцоог хамгаална.

---

## 6. QPay урьдчилсан төлбөр

Урсгал:

```
Хэрэглэгч "QPay-ээр төлөх" ─▶ POST /api/billing/invoice
   ─▶ QPay: POST /v2/auth/token → POST /v2/invoice (999₮)
   ─▶ Апп QR код + банкны апп-уудын холбоос харуулна
   ─▶ Хэрэглэгч банкны апп-аар төлнө
   ─▶ QPay callback → POST /api/billing/callback
   ─▶ Сервер POST /v2/payment/check-ээр давхар шалгана
   ─▶ subscriptions.active_until = өнөөдөр + 30 хоног
```

- Callback-д итгэхгүй: төлбөрийн төлөвийг **заавал `payment/check`-ээр** баталгаажуулна.
- Нэхэмжлэх бүрт өвөрмөц `sender_invoice_no` өгч, давхар идэвхжүүлэхээс сэргийлнэ.
- Callback ирээгүй тохиолдолд хэрэглэгч «Төлбөр шалгах» товч дарж гараар шалгуулна.
- Endpoint-уудын нарийн параметрийг QPay-ийн merchant баримт бичигтэй тулгана.

`middleware.ts`: `active_until < now()` бол `/billing`-ээс бусад бүх хуудсыг `/billing` руу чиглүүлнэ.

---

## 7. Өгөгдлийн бүтэц

```
families        id, name, created_at
members         id, family_id, name, role(parent|child|baby), age_group, color, is_admin
users           id, email, member_id
subscriptions   id, family_id, plan('family_999'), active_until
payments        id, family_id, qpay_invoice_id, sender_invoice_no, amount, status, paid_at
ai_usage        family_id, month, count

events          id, family_id, member_id, title, starts_at, ends_at, kind(school|work|plan|holiday)
meal_plans      id, family_id, week_start, plan_json
shopping_items  id, family_id, name, qty, unit, done, added_by
chores          id, family_id, member_id, title, weekday, done_at
transactions    id, family_id, member_id, type(income|expense), amount, category, note, date
debts           id, family_id, name, balance, monthly_payment
budgets         id, family_id, month, category, limit_amount

memories        id, family_id, member_id, title, body, photo_url, audio_url, date,
                embedding vector(1024)
health_records  id, family_id, member_id, kind(vaccine|checkup|note), date, note
books           id, family_id, member_id, title, finished_at, note
activities      id, family_id, kind(hike|movie|play), date, note
assets          id, family_id, name, category, location, note
maintenance     id, family_id, title, planned_for, cost_estimate, done
celebrations    id, family_id, title, date, budget
```

Мөнгөн дүнг **бүхэл төгрөгөөр** (`integer`) хадгална. Бутархай тоо хэрэглэхгүй.

`embedding`-ийн хэмжээсийг (`1024`) загварын бодит гаралтын хэмжээстэй тулгаж тохируулна.

---

## 8. Хавтасны бүтэц

```
tobi/
├─ app/
│  ├─ (auth)/login/            нэвтрэх
│  ├─ (app)/                   захиалгатай хэрэглэгчийн хуудсууд
│  │  ├─ page.tsx              нүүр: өнөөдөр, хүнс, төсөв, Тоби AI
│  │  ├─ calendar/  meals/  shopping/  chores/
│  │  ├─ finance/   memories/  members/
│  ├─ billing/                 QPay төлбөрийн дэлгэц
│  └─ api/
│     ├─ ai/{meal-plan,ask,classify,voice-note,search}/route.ts
│     └─ billing/{invoice,callback,check}/route.ts
├─ lib/
│  ├─ ai/qwen.ts  ai/tools.ts  ai/prompts.ts  ai/quota.ts
│  ├─ qpay.ts
│  └─ db/schema.ts  db/index.ts
├─ db/migrations/
├─ scripts/seed.ts             зохиомол «Болдын гэр бүл»
├─ public/manifest.webmanifest  icons/
├─ middleware.ts
├─ .env.example
└─ README.md
```

---

## 9. Ажиллуулах

### Шаардлага
- Node.js 20+
- pgvector өргөтгөлтэй PostgreSQL 16 (Neon/Supabase эсвэл Docker)
- Model Studio pay-as-you-go API түлхүүр (хакатоны нээлтээр өгнө)
- QPay sandbox merchant эрх

### Алхамууд

```bash
git clone [репо холбоос] tobi && cd tobi
npm install
cp .env.example .env.local      # доорх утгуудыг бөглөнө
npm run db:migrate              # хүснэгтүүд + CREATE EXTENSION vector
npm run db:seed                 # "Болдын гэр бүл" туршилтын өгөгдөл
npm run dev                     # http://localhost:3000
```

Локал Postgres хэрэгтэй бол:

```bash
docker run -d --name tobi-db -p 5432:5432 -e POSTGRES_PASSWORD=tobi pgvector/pgvector:pg16
```

### `.env.example`

```bash
# Өгөгдлийн сан
DATABASE_URL=postgres://postgres:tobi@localhost:5432/tobi

# Qwen / Alibaba Cloud Model Studio
DASHSCOPE_API_KEY=sk-xxxxxxxx
DASHSCOPE_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1

# QPay (зөвхөн sandbox)
QPAY_BASE_URL=https://merchant-sandbox.qpay.mn
QPAY_CLIENT_ID=
QPAY_CLIENT_SECRET=
QPAY_INVOICE_CODE=
QPAY_CALLBACK_URL=https://[демо домэйн]/api/billing/callback

# Нэвтрэлт
AUTH_SECRET=                    # openssl rand -base64 32
AUTH_EMAIL_FROM=

# Тохиргоо
PLAN_PRICE_MNT=999
AI_MONTHLY_QUOTA=150
```

`.env.local`-ыг git-д **хэзээ ч** оруулахгүй.

### npm скриптүүд

| Скрипт | Үйлдэл |
|---|---|
| `dev` | Хөгжүүлэлтийн сервер |
| `build` / `start` | Production build |
| `db:migrate` | Drizzle migration |
| `db:seed` | Туршилтын өгөгдөл |
| `lint` / `typecheck` | Чанарын шалгалт |
| `test` | Төлбөр, quota, AI tool-ийн unit тест |

---

## 10. Байршуулах (deploy)

1. Репог Vercel-д холбоно. Framework: Next.js.
2. `.env.example`-ийн бүх утгыг Vercel → Settings → Environment Variables-д оруулна.
3. `QPAY_CALLBACK_URL`-ыг Vercel-ийн нийтэд нээлттэй домэйнээр солино.
4. Neon/Supabase дээр `npm run db:migrate && npm run db:seed` ажиллуулна.
5. Демо холбоосыг энэ README-ийн эхэнд болон слайдад бичнэ.

---

## 11. 72 цагийн төлөвлөгөө

Хакатоны шалгах цэгүүдтэй уялдуулсан.

| Хугацаа | Шалгах цэг | Тобид дуусах зүйл |
|---|---|---|
| Мяг 18:00 | **CP1:** архитектур + анхны Qwen дуудлага + нийтэд нээлттэй холбоос | Репо, Vercel deploy, DB, `qwen.ts` → «Сайн уу» хариу, нэвтрэлт |
| Лха 18:00 | **CP2:** үндсэн функц эхнээс нь дуустал | Гэр бүл, гишүүд → AI цэс → хүнсний жагсаалт → зарлага → төсвийн карт |
| Пүр 18:00 | **CP3:** QPay төлбөр + production тест | QPay sandbox урсгал, захиалгын хаалт, дурсамж + дуут тэмдэглэл, AI quota |
| Баа 13:00 | **Код хаах** | Алдаа засвар, бараан горим, утсаар шалгах, Model Studio зарцуулалтын дэлгэцийн зураг |
| Баа 14:00 | **Демо** | [§14](#14-демо-сценари) |

Гэнэтийн сорил (Лха, Пүр 13:00) гарвал тусдаа `feature/` салбар дээр хийнэ.

---

## 12. Аюулгүй байдал, хүртээмж

**Аюулгүй байдал**
- Түлхүүр бүр зөвхөн сервер талын env-д байна. Клиент код руу `NEXT_PUBLIC_` угтвартай нууц утга оруулахгүй.
- Хүсэлт бүрт `family_id`-аар эрх шалгана. Нэг гэр бүл нөгөөгийнхөө өгөгдлийг харахгүй.
- AI-ийн бичих үйлдэл бүр хэрэглэгчийн баталгаажуулалттай.
- AI endpoint-уудад rate limit (минутад 10) болон сарын quota.
- Эрүүл мэндийн хариултад «эмчийн зөвлөгөөг орлохгүй» тэмдэглэгээ.
- Model Studio хэрэглэгчийн өгөгдлийг сургалтад ашиглахгүй гэж заасан ч хакатонд зөвхөн туршилтын өгөгдөл хэрэглэнэ.

**Хүртээмж (брэндбукийн дагуу)**
- Текст, дэвсгэрийн контраст ≥ 4.5:1
- Товчны өндөр ≥ 46px, гараар удирдах боломжтой, focus тод харагдана
- `prefers-color-scheme`-ийн дагуу бараан горим, `prefers-reduced-motion`-ийг дэмжинэ
- Утасны дэлгэц (≥ 360px) дээр бүрэн ажиллана

---

## 13. Үнэ, ашгийн тооцоо

**Гэр бүлийн багц: 999₮/сар**, урьдчилж QPay-ээр. Гишүүний тоо хязгааргүй.

| Нэг гэр бүл, сард | ₮ |
|---|---:|
| Үнэ (НӨАТ орсон) | 999 |
| НӨАТ 10% (НӨАТ-ын тухай хууль 11.1) | −91 |
| **Цэвэр борлуулалт** | **908** |
| Qwen AI: 150 хүсэлт (80% flash, 20% plus) | −400 |
| Сервер, хадгалалт | −100 |
| QPay шимтгэл ≈1% | −10 |
| **Нийт ашиг (≈44%)** | **≈398** |

Таамаг: хүсэлт тутамд ≈2,000 оролт, 500 гаралтын токен. Model Studio-ийн Сингапур бүсийн үнэ (2026.11.02): qwen3.8-flash $0.15 / $0.47, qwen3.7-plus $0.40 / $1.60 (1 сая токен тутамд). Ханш 1$ ≈ 3,596₮. Серверийн зардал, QPay шимтгэлийг гэрээгээр нь шалгаж засна. Дүн нь ААНОАТ-аас өмнөх.

**Зах зээлийн харьцуулалт (сард):**

| Үйлчилгээ | Үнэ | ≈ ₮ |
|---|---|---:|
| **Тоби** | 999₮ | **999** |
| Cozi Gold | $39/жил | 11,700 |
| FamilyWall Premium | $7.99/сар | 28,700 |
| Maple Plus | $9.99/сар (2024 оны мэдээлэл) | 35,900 |

Эх сурвалж: App Store-ын үнийн мэдээлэл. Демогоос өмнө дахин шалгана.

---

## 14. Демо сценари

5–10 минут. Бүх өгөгдөл зохиомол.

1. **Гэр бүл үүсгэх:** «Болдын гэр бүл», 5 гишүүн нэмж, өнгө оноох.
2. **QPay-ээр төлөх:** sandbox-оор 999₮ төлж, апп идэвхжихийг харуулна.
3. **AI цэс:** «Энэ 7 хоногийн оройн хоолны цэс гаргаад өгөөч, төсөв 200,000₮» → цэс + хүнсний жагсаалт → «Тийм» дарж хадгална.
4. **Санхүү:** хүнсний зарлага бүртгэхэд төсвийн карт шинэчлэгдэнэ. «Энэ сард хүнсэнд хэд зарцуулсан бэ?» гэж асууна.
5. **Дурсамж:** зураг, монгол дуут тэмдэглэл нэмэх → текст болно → «Уулын аялал» гэж хайхад олдоно.
6. **Model Studio:** зарцуулалтын дэлгэцийг харуулна (Qwen ашигласны баталгаа).

---

## 15. Хүлээлгэн өгөх зүйлс

- [ ] Ажилладаг демо (нийтэд нээлттэй холбоос)
- [ ] Репогийн холбоос, энэ README
- [ ] 1 слайд: асуудал, шийдэл, үнэ, ашгийн хувь, зах зээлийн харьцуулалт (`TOBI_Demo.pptx`, 8-р слайд)
- [ ] Model Studio-ийн зарцуулалтын дэлгэцийн зураг

---

## Баг

| Гишүүн | Үүрэг |
|---|---|
| `[нэр]` | Ахлагч, backend, Qwen |
| `[нэр]` | Frontend, UI/UX |
| `[нэр]` | Өгөгдлийн сан, QPay, deploy |

---

Qwen, Alibaba Cloud нь Alibaba Group-ийн, QPay нь QPay-ийн барааны тэмдэг.

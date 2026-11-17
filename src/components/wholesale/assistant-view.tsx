import { useEffect, useRef, useState } from "react"
import { ArrowUpLeft, Bot, Send, Sparkles, User } from "lucide-react"
import { DEMO_NOW, type Batch } from "./ops-data"
import { agingFor, daysUntil, forecastStockouts, pharmacyTrends } from "./ops-logic"
import { formatCurrency, SectionHeading } from "./shared"
import type { Order, Pharmacy, Product } from "./types"

export type AssistantTarget = "suppliers" | "pharmacies" | "credit" | "expiry" | "reports" | "inventory"
type Answer = { text: string; rows: Array<{ label: string; value: string; tone?: "warn" | "ok" | undefined }>; action?: { label: string; tab: AssistantTarget } | undefined }
type Message = { id: number; from: "user" | "bot"; text: string; answer?: Answer | undefined }

const prompts = [
  { id: "stockout", label: "منتجات يُتوقع نفادها هذا الأسبوع" },
  { id: "decline", label: "صيدليات انخفضت طلباتها" },
  { id: "top", label: "أفضل المنتجات مبيعًا" },
  { id: "overdue", label: "ديون متأخرة تحتاج متابعة" },
  { id: "expiry", label: "تشغيلات قريبة الانتهاء" },
] as const
type PromptId = (typeof prompts)[number]["id"]

const keywords: Array<[PromptId, RegExp]> = [
  ["stockout", /نفا|نقص|مخزون|ينفد/],
  ["decline", /انخفض|تراجع|صيدلي/],
  ["top", /أفضل|الأكثر|مبيع/],
  ["overdue", /دين|ديون|متأخر|تحصيل|مستحق/],
  ["expiry", /صلاح|انتهاء|تشغيل/],
]

export function AssistantView({ products, orders, batches, pharmacies, onNavigate }: { products: Product[]; orders: Order[]; batches: Batch[]; pharmacies: Pharmacy[]; onNavigate: (tab: AssistantTarget) => void }) {
  const [messages, setMessages] = useState<Message[]>([{ id: 0, from: "bot", text: "مرحبًا! أنا المساعد الذكي لشركة الشاعر. أحلل بيانات الطلبات والمخزون والتحصيل وأقترح عليك ما يستحق الانتباه اليوم. اختر سؤالًا جاهزًا أو اكتب سؤالك." }])
  const [input, setInput] = useState("")
  const [thinking, setThinking] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }) }, [messages, thinking])

  function answerFor(id: PromptId | null): Answer {
    if (id === "stockout") {
      const list = forecastStockouts(products, orders, DEMO_NOW).filter((row) => row.daysOfCover <= 10).slice(0, 6)
      return { text: list.length ? `بناءً على متوسط الطلب في آخر 60 يومًا، هذه الأصناف قد تنفد خلال الأيام القادمة. أنصح بإنشاء أمر شراء اليوم لتغطية مدة التوريد.` : "لا يُتوقع نفاد أي صنف خلال الأسبوع بناءً على معدل الطلب الحالي.", rows: list.map((row) => ({ label: row.product.name, value: `${Math.max(0, Math.floor(row.daysOfCover))} أيام · المتاح ${row.product.stock - row.product.reserved}`, tone: row.daysOfCover <= 7 ? "warn" : undefined })), action: { label: "إنشاء أمر شراء", tab: "suppliers" } }
    }
    if (id === "decline") {
      const list = pharmacyTrends(orders, DEMO_NOW).filter((row) => row.change < 0).slice(0, 5)
      return { text: list.length ? "قارنت عدد طلبات آخر 30 يومًا بالثلاثين يومًا السابقة. هذه الصيدليات تراجعت طلباتها، وقد يفيد التواصل معها أو منحها عرضًا مخصصًا." : "لم ألاحظ تراجعًا في طلبات أي صيدلية مقارنة بالشهر السابق.", rows: list.map((row) => ({ label: row.pharmacy, value: `${row.recent} طلبات مقابل ${row.previous} (${row.change}٪)`, tone: "warn" })), action: { label: "عرض الصيدليات", tab: "pharmacies" } }
    }
    if (id === "top") {
      const totals = new Map<string, { name: string; qty: number; value: number }>()
      for (const order of orders) if (order.orderStatus !== "rejected" && order.orderStatus !== "cancelled") for (const item of order.items) { const entry = totals.get(item.productId) ?? { name: item.name, qty: 0, value: 0 }; entry.qty += item.quantity; entry.value += item.quantity * item.unitPrice; totals.set(item.productId, entry) }
      const list = [...totals.values()].sort((a, b) => b.value - a.value).slice(0, 5)
      return { text: "أعلى خمسة أصناف من حيث قيمة المبيعات في الطلبات المسجلة:", rows: list.map((row) => ({ label: row.name, value: `${formatCurrency(row.value)} · ${row.qty} عبوة`, tone: "ok" })), action: { label: "فتح التقارير", tab: "reports" } }
    }
    if (id === "overdue") {
      const list = pharmacies.map((pharmacy) => ({ pharmacy, aging: agingFor(orders.filter((order) => order.pharmacy === pharmacy.name), DEMO_NOW) })).filter((row) => row.aging.d31_60 + row.aging.d61_90 + row.aging.d90plus > 0).sort((a, b) => (b.aging.d61_90 + b.aging.d90plus) - (a.aging.d61_90 + a.aging.d90plus))
      return { text: list.length ? "هذه الصيدليات لديها فواتير تجاوزت 30 يومًا. ابدأ بالأعلى مبلغًا في فئة 60 يومًا فأكثر." : "لا توجد ديون متأخرة أكثر من 30 يومًا.", rows: list.map((row) => ({ label: row.pharmacy.name, value: `متأخر ${formatCurrency(row.aging.d31_60 + row.aging.d61_90 + row.aging.d90plus)}`, tone: row.aging.d61_90 + row.aging.d90plus > 0 ? "warn" : undefined })), action: { label: "إرسال تذكيرات", tab: "credit" } }
    }
    if (id === "expiry") {
      const productName = new Map(products.map((product) => [product.id, product.name]))
      const list = batches.filter((batch) => batch.status === "active" && batch.quantity > 0).map((batch) => ({ batch, days: daysUntil(batch.expiry, DEMO_NOW) })).filter((row) => row.days <= 60).sort((a, b) => a.days - b.days)
      return { text: list.length ? "هذه التشغيلات تنتهي خلال 60 يومًا. اقترح تصريف الأقرب بخصم قبل أن تُرجع للمورد." : "لا توجد تشغيلات تنتهي خلال 60 يومًا.", rows: list.map((row) => ({ label: `${productName.get(row.batch.productId) ?? row.batch.productId} · ${row.batch.batchNo}`, value: row.days < 0 ? "منتهية" : `${row.days} يومًا · ${row.batch.quantity} عبوة`, tone: row.days <= 30 ? "warn" : undefined })), action: { label: "إدارة الصلاحية", tab: "expiry" } }
    }
    return { text: "أستطيع المساعدة في: توقع نفاد المخزون، الصيدليات المتراجعة، أفضل المنتجات، الديون المتأخرة، والتشغيلات قريبة الانتهاء. جرّب أحد الأسئلة الجاهزة.", rows: [] }
  }

  function ask(text: string, id: PromptId | null) {
    if (thinking || !text.trim()) return
    const resolved = id ?? keywords.find(([, pattern]) => pattern.test(text))?.[0] ?? null
    setMessages((current) => [...current, { id: Date.now(), from: "user", text }])
    setInput("")
    setThinking(true)
    timer.current = setTimeout(() => {
      const answer = answerFor(resolved)
      setMessages((current) => [...current, { id: Date.now() + 1, from: "bot", text: answer.text, answer }])
      setThinking(false)
    }, 700)
  }

  return (
    <div className="view-stack">
      <SectionHeading eyebrow="ذكاء الأعمال" title="المساعد الذكي" description="إجابات فورية مبنية على بيانات العرض الحالية: الطلبات والمخزون والتحصيل والتشغيلات." action={<span className="count-badge"><Sparkles aria-hidden="true" /> توضيحي</span>} />
      <div className="assistant-layout">
        <aside className="assistant-prompts" aria-label="أسئلة مقترحة"><strong>أسئلة مقترحة</strong>{prompts.map((prompt) => <button key={prompt.id} type="button" className="assistant-prompt" disabled={thinking} onClick={() => ask(prompt.label, prompt.id)}><Sparkles aria-hidden="true" />{prompt.label}</button>)}</aside>
        <section className="assistant-chat">
          <div className="assistant-messages" ref={listRef} aria-live="polite">
            {messages.map((message) => <div key={message.id} className={`assistant-message from-${message.from}`}>
              <span className="assistant-avatar">{message.from === "bot" ? <Bot aria-hidden="true" /> : <User aria-hidden="true" />}</span>
              <div className="assistant-bubble"><p>{message.text}</p>
                {message.answer && message.answer.rows.length > 0 && <ul className="assistant-rows">{message.answer.rows.map((row) => <li key={row.label} className={row.tone ? `tone-${row.tone}` : ""}><span>{row.label}</span><strong>{row.value}</strong></li>)}</ul>}
                {message.answer?.action && <button type="button" className="mini-action" onClick={() => onNavigate(message.answer!.action!.tab)}>{message.answer.action.label} <ArrowUpLeft aria-hidden="true" /></button>}
              </div>
            </div>)}
            {thinking && <div className="assistant-message from-bot"><span className="assistant-avatar"><Bot aria-hidden="true" /></span><div className="assistant-bubble assistant-typing"><span /><span /><span /></div></div>}
          </div>
          <form className="assistant-input" onSubmit={(event) => { event.preventDefault(); ask(input, null) }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="اسأل عن المخزون أو الديون أو الصيدليات..." aria-label="اكتب سؤالك للمساعد" /><button className="primary-button" disabled={thinking || !input.trim()} aria-label="إرسال"><Send aria-hidden="true" /></button></form>
        </section>
      </div>
    </div>
  )
}

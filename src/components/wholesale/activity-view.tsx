import { useMemo, useState } from "react"
import { Download, History, Search } from "lucide-react"
import type { ActivityEntry } from "./ops-data"
import { SectionCard, SectionHeading, StatusPill } from "./shared"

const formatStamp = (value: string) => new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" }).format(new Date(value))

export function ActivityView({ entries }: { entries: ActivityEntry[] }) {
  const [actor, setActor] = useState("all")
  const [section, setSection] = useState("all")
  const [query, setQuery] = useState("")
  const actors = useMemo(() => [...new Set(entries.map((entry) => entry.actor))], [entries])
  const sections = useMemo(() => [...new Set(entries.map((entry) => entry.section))], [entries])
  const normalized = query.trim().toLocaleLowerCase("ar")
  const visible = entries.filter((entry) => (actor === "all" || entry.actor === actor) && (section === "all" || entry.section === section) && entry.action.toLocaleLowerCase("ar").includes(normalized))

  function exportCsv() {
    const rows = [["الوقت", "المستخدم", "الدور", "القسم", "الإجراء"], ...visible.map((entry) => [formatStamp(entry.at), entry.actor, entry.role, entry.section, entry.action])]
    const csv = "\uFEFF" + rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "activity-log.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="view-stack">
      <SectionHeading eyebrow="الحوكمة" title="سجل النشاط" description="من غيّر ماذا ومتى. كل إجراء تنفذه في العرض يُضاف هنا فورًا." action={<button className="primary-button" onClick={exportCsv} disabled={!visible.length}><Download aria-hidden="true" /> تصدير CSV</button>} />
      <SectionCard title={`${visible.length} نشاط`} description="فلتر حسب المستخدم أو القسم أو ابحث في وصف الإجراء." action={<label className="search-control"><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في الإجراءات" aria-label="ابحث في سجل النشاط" /></label>}>
        <div className="ops-filter-selects">
          <label className="field-label">المستخدم<select value={actor} onChange={(event) => setActor(event.target.value)}><option value="all">كل المستخدمين</option>{actors.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field-label">القسم<select value={section} onChange={(event) => setSection(event.target.value)}><option value="all">كل الأقسام</option>{sections.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        <ol className="activity-timeline">{visible.map((entry) => <li key={entry.id}><span className="activity-dot"><History aria-hidden="true" /></span><div><p>{entry.action}</p><small><strong>{entry.actor}</strong> · {entry.role} · {formatStamp(entry.at)}</small></div><StatusPill tone="teal">{entry.section}</StatusPill></li>)}</ol>
        {visible.length === 0 && <div className="table-empty">لا توجد أنشطة مطابقة.</div>}
      </SectionCard>
    </div>
  )
}

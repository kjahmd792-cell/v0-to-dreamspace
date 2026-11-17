import { useEffect, useId, useRef, type ReactNode } from "react"
import { X } from "lucide-react"

/** Shared demo dialog: closes on Escape or backdrop click. */
export function Modal({ title, eyebrow, close, children, className = "" }: { title: string; eyebrow?: string | undefined; close: () => void; children: ReactNode; className?: string }) {
  const id = useId()
  const closeRef = useRef(close)
  closeRef.current = close
  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") closeRef.current() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])
  return (
    <div className="modal-backdrop" onClick={close}>
      <section className={`detail-modal fa-modal ${className}`} role="dialog" aria-modal="true" aria-labelledby={id} onClick={(event) => event.stopPropagation()}>
        <div className="modal-head"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2 id={id}>{title}</h2></div><button type="button" className="icon-action" aria-label="إغلاق" onClick={close}><X aria-hidden="true" /></button></div>
        {children}
      </section>
    </div>
  )
}

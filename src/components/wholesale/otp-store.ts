
import { useSyncExternalStore } from "react"

export type DeliveryOtp = {
  orderId: string
  pharmacy: string
  driverName: string
  total: number
  itemsCount: number
  code: string
  sentAt: number
  expiresAt: number
  status: "pending" | "verified"
  verifiedAt?: number | undefined
  seen: boolean
}

export type OtpCheckResult = "ok" | "invalid" | "expired" | "missing"

export const OTP_LENGTH = 4
export const OTP_TTL_MS = 10 * 60 * 1000
export const OTP_RESEND_MS = 30 * 1000

// Demo only: codes live in this browser so the driver and pharmacy views
// (including two open tabs) can share them. Replace with a server + SMS/push later.
const STORAGE_KEY = "alshaer-demo-delivery-otps"
const EMPTY: DeliveryOtp[] = []
const listeners = new Set<() => void>()
let cachedRaw: string | null = null
let cachedValue: DeliveryOtp[] = EMPTY

function readOtps(): DeliveryOtp[] {
  if (typeof window === "undefined") return EMPTY
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw === cachedRaw) return cachedValue
  cachedRaw = raw
  try {
    cachedValue = raw ? (JSON.parse(raw) as DeliveryOtp[]) : EMPTY
  } catch {
    cachedValue = EMPTY
  }
  return cachedValue
}

function writeOtps(next: DeliveryOtp[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 30)))
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

export function useDeliveryOtps() {
  return useSyncExternalStore(subscribe, readOtps, () => EMPTY)
}

function generateCode() {
  const values = new Uint32Array(1)
  window.crypto.getRandomValues(values)
  return String(values[0]! % 10 ** OTP_LENGTH).padStart(OTP_LENGTH, "0")
}

export function issueOtp(input: { orderId: string; pharmacy: string; driverName: string; total: number; itemsCount: number }) {
  const now = Date.now()
  const otp: DeliveryOtp = { ...input, code: generateCode(), sentAt: now, expiresAt: now + OTP_TTL_MS, status: "pending", seen: false }
  writeOtps([otp, ...readOtps().filter((item) => item.orderId !== input.orderId)])
  return otp
}

export function verifyOtp(orderId: string, code: string): OtpCheckResult {
  const otp = readOtps().find((item) => item.orderId === orderId && item.status === "pending")
  if (!otp) return "missing"
  if (Date.now() > otp.expiresAt) return "expired"
  if (otp.code !== code) return "invalid"
  writeOtps(readOtps().map((item) => item.orderId === orderId ? { ...item, status: "verified", verifiedAt: Date.now(), seen: true } : item))
  return "ok"
}

export function markOtpsSeen(orderIds: string[]) {
  const current = readOtps()
  if (!current.some((item) => orderIds.includes(item.orderId) && !item.seen)) return
  writeOtps(current.map((item) => orderIds.includes(item.orderId) ? { ...item, seen: true } : item))
}

export function cancelOtp(orderId: string) {
  writeOtps(readOtps().filter((item) => !(item.orderId === orderId && item.status === "pending")))
}

export function clearOtpHistory(pharmacy: string) {
  writeOtps(readOtps().filter((item) => item.pharmacy !== pharmacy || item.status === "pending"))
}

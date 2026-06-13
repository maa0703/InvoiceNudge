const requests = new Map<string, number[]>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const timestamps = requests.get(key) ?? []
  const recent = timestamps.filter((t) => now - t < windowMs)
  if (recent.length >= limit) return false
  requests.set(key, [...recent, now])
  return true
}

// Formateo de timestamps (unix segundos) a los textos que muestra el frontend.
const p = (n: number) => String(n).padStart(2, '0')

export function fmtDateTime(unix: number): string {
  const d = new Date(unix * 1000)
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function fmtTimeline(unix: number): string {
  const d = new Date(unix * 1000)
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} · ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function fmtTime(unix: number): string {
  const d = new Date(unix * 1000)
  return `${p(d.getHours())}:${p(d.getMinutes())}`
}

import { useEffect, useState } from 'react'
import { nowHours } from './index'

/** Current wall-clock hour (decimal), refreshed every minute. */
export function useNowHours() {
  const [now, setNow] = useState(nowHours)
  useEffect(() => {
    const id = window.setInterval(() => setNow(nowHours()), 60_000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

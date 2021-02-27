import { useEffect, useState, useContext } from 'react'
import { PeerContext } from '../contexts/PeerJSContext'

function getLatestEvents (events = [], secs) {
  const now = +new Date() / 1000
  return events
    .sort((a,b) => b.date - a.date)
    .filter(({date}) => now - date < secs)
}

export default function useRoomEvents(timeLimit = 15, limit) {
  const [lastUpdate, setLastUpdate] = useState(0)
  const {
    state: {
      roomEvents,
    },
  } = useContext(PeerContext)
  
  const recentEvents = getLatestEvents(roomEvents, timeLimit)

  useEffect(() => {
    const forceRefresh = setInterval(() => {
      setLastUpdate(+new Date())
    }, 5000)
    return () => {
      clearInterval(forceRefresh)
    }
  }, [])

  return [recentEvents, roomEvents]

}

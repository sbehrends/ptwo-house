import { useEffect, useState, useRef } from 'react'
import hark from 'hark'

export default function Speaker ({ stream, name }) {
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    console.log(stream, typeof stream)
    if (!stream) return
    if (!stream instanceof MediaStream) return
    const speechEvents = hark(stream)
    console.log('listening speechEvents')
    speechEvents.on('speaking', () => setSpeaking(true))
    speechEvents.on('stopped_speaking', () => setSpeaking(false))
  }, [stream])

  useEffect(() => console.log('change speaking', speaking))
  
  return (
    <div style={{borderColor: speaking ? 'red' : 'blue', borderWidth: 2, borderStyle: 'solid'}}>
      {name}
    </div>
  )
}
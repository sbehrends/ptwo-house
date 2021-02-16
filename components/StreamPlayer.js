import { useRef, useContext, useEffect, useState } from 'react'
import { PeerContext } from '../contexts/PeerContext'

import User from './User'

export default function StreamPlayer({ hostId }) {
  const { peer, incomingStreams, peerConnError } = useContext(PeerContext)
  const [streams, setStreams] = useState([])
  const playerEl = useRef([])

  function playStream(stream) {
    playerEl.current.srcObject = stream
    playerEl.current.play()
  }

  useEffect(() => {
    incomingStreams.forEach((call, i) => {
      if (call.open) return
      call.answer();
      call.on('stream', audioStream => {
        setStreams([...streams, audioStream])
        playerEl.current[i].srcObject = audioStream
        playerEl.current[i].play()
      })
    })
  }, [incomingStreams])

  return (
    <div className="grid">
      { peerConnError && <div>Error on connection</div> }
      { incomingStreams.map((stream, i) => (
        <audio id={stream.connectionId} key={i} ref={el => (playerEl.current[i] = el)} controls autoPlay={true} />
      ))}
      { incomingStreams.map((stream, i) => (
        <User key={i} name={stream.metadata.name ? stream.metadata.name : 'Anonym'} stream={streams[i]} />
      ))}
      <style jsx>{`
        .grid {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: center;
        }
        audio {
          display: none;
        }
      `}</style>
    </div>
  )
}

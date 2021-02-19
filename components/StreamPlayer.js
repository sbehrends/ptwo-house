import { useRef, useContext, useEffect, useState } from 'react'
import { FiX, FiPlus } from 'react-icons/fi'

import { PeerContext } from '../contexts/PeerContext'


import User from './User'

export default function StreamPlayer() {
  const { peer, incomingStreams, peerConnError, connRole, peerId, userName, onDemotePeerToListener, incomingStreamsObj } = useContext(PeerContext)
  const [streams, setStreams] = useState([])
  const playerEl = useRef([])

  // function playStream(stream) {
  //   playerEl.current.srcObject = stream
  //   playerEl.current.play()
  // }


  // useEffect(() => {
  //   incomingStreams.forEach((call, i) => {
  //     if (call.open) return
  //     try {
  //       call.answer();
  //       call.on('stream', audioStream => {
  //         setStreams([...streams, audioStream])
  //         const audioObj = new Audio()
  //         audioObj.srcObject = audioStream
  //         audioObj.play()
  //         // playerEl.current[i].srcObject = audioStream
  //         // playerEl.current[i].play()
  //       })
  //     } catch(e) {
  //       // debugger
  //     }
  //   })
  // }, [incomingStreams])

  return (
    <div className="grid">
      { peerConnError && <div>Error on connection</div> }
      {/* { incomingStreams.map((stream, i) => (
        <audio id={stream.connectionId} key={i} ref={el => (playerEl.current[i] = el)} controls autoPlay={true} />
      ))} */}
      { (connRole === 'host' || connRole === 'speaker') && <User host={connRole === 'host'} name={userName} me />}
      { incomingStreamsObj.map(call => (
        <User
          key={call.call.peer}
          name={call.call.metadata.name ? call.call.metadata.name : 'Anonym'}
          stream={call.audioStream}
          onClick={connRole === 'host' ? () => {onDemotePeerToListener(call.call.peer)} : null }
          hoverIcon={<FiX/>}
        />
      ))}
      {/* { incomingStreams.map((stream, i) => (
        <User
          key={i}
          name={stream.metadata.name ? stream.metadata.name : 'Anonym'}
          stream={streams[i]}
          onClick={connRole === 'host' ? () => {onDemotePeerToListener(stream.peer)} : null }
          hoverIcon={<FiX/>}
        />
      ))} */}
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

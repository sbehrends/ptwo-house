import { useContext, useEffect } from 'react'
import { FiMic, FiMicOff, FiAlertTriangle } from 'react-icons/fi'
import { useRouter } from 'next/router'
import Link from 'next/link'

import { PeerContextProvider, PeerContext } from '../contexts/PeerJSContext'
import { StreamContextProvider, StreamContext } from '../contexts/StreamContext'

import Streamer from './Streamer'
import StreamPlayer from './StreamPlayer'
import Heading from './Heading'
import ConnectedPeersList from './ConnectedPeersList'
import ActionGroup from './ActionGroup'
import Button from './Button'
import Container from './Container'

export default function PlayerMain ({ roomId, roomName, userName, isHost }) {

  return (
    <StreamContextProvider>
      <PeerContextProvider initialContext={{
        isHost,
        roomId,
        user: {
          name: userName,
        },
        roomMetadata: {
          title: roomName,
        },
      }}>
        <Main user={{
          name: userName,
        }} />
      </PeerContextProvider>
    </StreamContextProvider>
  )
}

function Main ({ user }) {
  const router = useRouter()

  if (!user.name) {
    router.push('/')
  }

  const {
    muteToggle,
    micMuted,
    startMicStream,
  } = useContext(StreamContext)

  const {
    state: {
      roomId,
      peer,
      peerId,
      peerStatus,
      connToHost,
      connRole,
      roomMetadata,
      isHost,
      connectedPeers,
      peersOnRoom,
      peerList,
    },
    streams: {
      incomingStreams,
      outgoingStreams,
    },
    actions: {
      onPromotePeerToSpeaker,
      onDemotePeerToListener,
      sendMessageToHost,
      // reconnectToHost,
    }
  } = useContext(PeerContext)

  useEffect(() => {
    if (!isHost) return
    startMicStream()
  }, [isHost])
  
  const shareLink = typeof window === 'undefined' ? '' : `${window.location.protocol || ''}//${window.location.host || ''}/room/${roomId}`

  async function onLeave() {
    if (isHost) {
      const agree =  confirm('As a host, when you quit the room all listeners will be disconnected')
      if (!agree) return
    }
    if (connToHost) connToHost.close()
    if (connectedPeers) {
      connectedPeers.forEach(conn => {
        conn.close()
      })
    }
    if (outgoingStreams) {
      outgoingStreams.forEach(conn => {
        conn.close()
      })
    }
    if (incomingStreams) {
      incomingStreams.forEach(conn => {
        conn.call.close()
      })
    }
    router.push('/')
  }

  if (peerStatus === 'error') {
    return (
      <Container>
        <div>
          <FiAlertTriangle size={62} />
          <Heading size={2}>Error</Heading>
          <p>Could not connect to room</p>
          <Link href="/" passHref>
            <Button as="a">Go Back</Button>
          </Link>
        </div>
        <style jsx>{`
          div {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
        `}</style>
      </Container>
    )
  }

  function handleReaction (emoji) {
    sendMessageToHost({
      action: 'sendReaction',
      payload: emoji,
    })
  }

  return (
    <>
      <Container>
        <Heading>
          {roomMetadata.title}
        </Heading>
      </Container>
      <StreamPlayer />
      <ConnectedPeersList shareLink={isHost ? shareLink : null} />
      <ActionGroup>
        <Button outline contrast onClick={onLeave}>Leave</Button>
        { (isHost || connRole === 'speaker') && (
          <Button style={{marginLeft:10}} contrast outline={!micMuted} onClick={muteToggle}>
            { micMuted && <FiMicOff/>}
            { !micMuted && <FiMic/>}
          </Button>
        )}
        {!isHost && <Button style={{marginLeft:10}} small outline contrast onClick={() => handleReaction('🙋‍♀️')}>🙋‍♀️</Button>}
        {!isHost && <Button style={{marginLeft:10}} small outline contrast onClick={() => handleReaction('👍')}>👍</Button>}
        {!isHost && <Button style={{marginLeft:10}} small outline contrast onClick={() => handleReaction('👎')}>👎</Button>}
      </ActionGroup>
    </>
  )
}

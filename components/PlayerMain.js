import { useContext, useEffect } from 'react'
import { FiMic, FiMicOff, FiAlertTriangle } from 'react-icons/fi'
import { useRouter } from 'next/router'
import Link from 'next/link'

import { PeerContextProvider, PeerContext } from '../contexts/PeerContext'
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
        <PeerContextProvider initialContext={{ roomId, roomName, userName, isHost }}>
          <Main roomId={roomId} roomName={roomName} userName={userName} isHost={isHost} />
        </PeerContextProvider>
      </StreamContextProvider>
  )
}

function Main ({ roomId, roomName, userName, isHost }) {
  const router = useRouter()

  if (!userName) {
    router.push('/')
  }

  const {
    muteToggle,
    micMuted,
  } = useContext(StreamContext)

  const {
    peerConnError,
    roomName: PeerRoomName,
    connRole,
  } = useContext(PeerContext)
  
  const shareLink = typeof window === 'undefined' ? '' : `${window.location.protocol || ''}//${window.location.host || ''}/room/${roomId}`

  async function onLeave() {
    if (!isHost) return router.push('/')
    const agree =  confirm('As a host, when you quit the room all listeners will be disconnected')
    if (agree) router.push('/')
  }

  if (`${peerConnError}`.includes('Could not connect to peer')) {
    return (
      <Container>
        <div>
          <FiAlertTriangle size={62} />
          <Heading size={2}>Error</Heading>
          <p>Could not connect to peer</p>
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

  return (
    <>
      <Container>
        <Heading>
          {/* {roomName} */}
          {PeerRoomName}
        </Heading>
        <Heading size={2}>Speaker</Heading>
      </Container>
      { isHost && <Streamer userName={userName} />}
      <StreamPlayer />
      <ConnectedPeersList shareLink={isHost ? shareLink : null} />
      <ActionGroup>
        <Button outline contrast onClick={onLeave}>Leave</Button>
        { (isHost || connRole === 'speaker') && (
          <Button style={{marginLeft:10}} contrast onClick={muteToggle}>
            { micMuted && <FiMic/>}
            { !micMuted && <FiMicOff/>}
          </Button>
        )}
      </ActionGroup>
    </>
  )
}

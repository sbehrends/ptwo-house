import { useContext, useEffect } from 'react'

import { PeerContext } from '../contexts/PeerContext'
import { StreamContext } from '../contexts/StreamContext'

import User from '../components/User'

export default function Streamer ({ userName }) {
  const {
    checkMicPermission,
    startMicStream,
    micAudioStream,
    micAccess,
  } = useContext(StreamContext)

  const {
    peerConnError,
  } = useContext(PeerContext)

  useEffect(() => {
    checkMicPermission()
  }, [])

  useEffect(() => {
    if (micAccess !== 'granted') return
    startMicStream()
  }, [micAccess])

  return (
    <>
      { peerConnError && <div>Error on connection</div> }
      <User name={userName} stream={micAudioStream} />
    </>
  )
}

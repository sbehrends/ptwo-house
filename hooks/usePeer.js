import { useEffect, useState } from 'react'
import uuid from 'uuid-random'
import Peer from 'peerjs'

import useStateRef from '../libs/useStateRef'

export default function usePeer(config = {}) {
  const {
    peerId: paramPeerId,
    onConnectionOpen,
  } = config

  const [peerInstance, setPeerInstance] = useState(null)
  const [peerStatus, setPeerStatus] = useState()
  const [peerId, setPeerId] = useState(null)

  const [connectedPeers, setConnectedPeers, connectedPeersRef] = useStateRef([])

  const destroyPeerInstance = () => {
    if (!peerInstance) return
    peerInstance.disconnect()
    peerInstance.destroy()
    setPeerInstance(null)
  }

  useEffect(() => {    
    const peer = peerInstance ? peerInstance : new Peer(paramPeerId ? paramPeerId : uuid())

    peer.on('open', () => {
      console.log('usePeer::Connection Open')
      setPeerInstance(peer)
      setPeerId(peer.id)
      setPeerStatus('open')
    })

    peer.on('connection', (conn) => {
      console.log(`usePeer::Incoming peer connection ${conn.peer}`)

      conn.on('data', (data) => {
        console.log(`usePeer::Incoming peer data ${conn.peer}`, data)
      })

      conn.on('close', () => {
        console.log(`usePeer::Closed peer connection ${conn.peer}`)
      })

      conn.on('open', () => {
        console.log(`usePeer::Stablished peer connection ${conn.peer}`)
        setConnectedPeers([...connectedPeersRef.current, conn])
      })
    })

    peer.on('call', call => {
      console.log('Received call', call)
    })

    peer.on('disconnected', () => {
      console.log('usePeer::Peer desconnected')
      setPeerStatus('disconnected')
      destroyPeerInstance()
    })

    peer.on('close', () => {
      console.log('usePeer::Peer closed remotetly')
      destroyPeerInstance()
      setPeerStatus('close')
    })

    peer.on('error', (error) => {
      console.log('usePeer::Peer error', error)
      setPeerStatus('error')
      destroyPeerInstance()
    })

    return () => {
      destroyPeerInstance()
    }
  }, [])

  return [peerInstance, peerId, peerStatus, connectedPeers]

}

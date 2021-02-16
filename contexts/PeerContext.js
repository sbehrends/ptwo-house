import { useEffect, createContext, useState, useContext, useRef } from 'react'
import uuid from 'uuid-random'
import Peer from 'peerjs'

import { StreamContext } from '../contexts/StreamContext'
import useStateRef from '../libs/useStateRef'
import { mapPeersData } from '../libs/peerHelper'

const PeerContext = createContext({
  peer: {},
  peerId: '',
})

function initilizePeer(peerId) {
  return new Peer(peerId, {
    debug: 2
  })
}

function connectToHost(peerInstance, hostId, name) {
  console.log(`PeerContext::Connecting to ${hostId}`)
  return peerInstance.connect(hostId, {
    metadata: {
      name,
    }
  })
}

const PeerContextProvider = ({ children, initialContext }) => {

  const {
    roomId,
    roomName: initialRoomName,
    userName,
    isHost,
  } = initialContext

  const [peerId] = useState(isHost ? roomId : uuid())
  const isListener = !isHost

  const [roomName, setRoomName, roomNameRef] = useStateRef(initialRoomName)
  // Connected Streams (each call will be stored here)
  const [incomingStreams, setIncomingStreams] = useState([])

  // Connected users
  const [connectedPeers, setConnectedPeers, connectedPeersRef] = useStateRef([])
  
  // PeerJS Instance
  const peerInstanceRef = useRef()
  let peerInstance = peerInstanceRef.current
  const [peerConnError, setPeerConnError] = useState(null)

  const {
    startMicStream,
  } = useContext(StreamContext)

  async function onNewCall(peerId) {
    const stream = await startMicStream()
    let call = peerInstance.call(peerId, stream, {
      metadata: {
        name: userName,
        roomName: initialContext.roomName,
      }
    })
    return call
  }

  function onConnectedPeer(conn) {
    setConnectedPeers([...connectedPeersRef.current, conn])
  }

  function onDisconnectedPeer(conn) {
    return setConnectedPeers(connectedPeersRef.current.filter(peer => peer.peer !== conn.peer))
  }

  useEffect(() => {
    // Send updated listeners to all peers
    if (!isHost) return
    connectedPeers.forEach((conn, i) => {
      conn.send({
        action: 'connectedPeers',
        payload: mapPeersData(connectedPeers),
      })
    })
  }, [connectedPeers])

  function startRoom() {
    console.log('Start room', peerInstance)
    let peer = initilizePeer(peerId)

    peer.on('open', (peerId) => {
      console.log(`PeerContext::Initialized ${isHost ? 'host' : 'listener'} with ID ${peerId}`)

      if (isListener) {
        // Only on listener
        const conn = connectToHost(peer, roomId, userName)
        conn.on('close', () => {
          console.log(`PeerContext::Closed host connection`)
          setPeerConnError('Host closed room')
        })

        conn.on('data', (data) => {
          console.log(`PeerContext::Incoming peer data ${conn.peer}`, data)
          const {
            action,
            payload
          } = data
          if (action === 'connectedPeers') setConnectedPeers(payload)
        })
      }
    })
  
    peer.on('error', (err) => {
      console.error(`PeerContext::Error on peer`, err)
      setPeerConnError(err)
    })

    // This is only for Host
    peer.on('connection', (conn) => {
      console.log(`PeerContext::Incoming peer connection ${conn.peer}`)

      conn.on('data', (data) => {
        console.log(`PeerContext::Incoming peer data ${conn.peer}`, data)
      })

      conn.on('close', () => {
        console.log(`PeerContext::Closed peer connection ${conn.peer}`)
        onDisconnectedPeer(conn)
      })

      conn.on('open', () => {
        console.log(`PeerContext::Stablished peer connection ${conn.peer}`)
        onConnectedPeer(conn)
        onNewCall(conn.peer)
        conn.send({
          action: 'ping',
        })
        conn.send({
          action: 'roomMetadata',
          payload: {
            roomName: initialContext.roomName,
            name: initialContext.userName
          }
        })
      })
    })

    peer.on('call', call => {
      // Connected Streams (each call will be stored here)
      setIncomingStreams([...incomingStreams, call])
      setRoomName(call.metadata.roomName || '')
    })

    // setPeerInstance(peer)
    peerInstance = peer
    return peer
  }

  // Start PeerJS connection
  useEffect(() => {
    console.log('On start, set peer', peerInstance)
    if (!roomId) return
    if (peerInstance) return // Avoid re-initialization of PeerJS which leads to error
    const peer = startRoom()
    return () => {
      peer.destroy()
    }
  }, [])

  useEffect(() => {
    console.log('New connectedPeers', connectedPeers)
  }, [connectedPeers])

  function addPeer(peer) {
    setConnectedPeers([...connectedPeers, peer])
  }

  return (
    <PeerContext.Provider value={{
      peerConnError,
      incomingStreams,
      connectedPeers,
      roomName,
    }}>
      {children}
    </PeerContext.Provider>
  )
}

export { PeerContext, PeerContextProvider }

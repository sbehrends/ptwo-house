import { useEffect, createContext, useState, useContext, useRef } from 'react'

// import { StreamContext } from '../contexts/StreamContext'
// import useStateRef from '../libs/useStateRef'
import { mapPeersData } from '../libs/peerHelper'

import useStateRef from '../libs/useStateRef'
import usePeer from '../hooks/usePeer'

export const PeerContext = createContext({
  peer: null, // PeerInstance
  peerId: null, // PeerId of the connection
  peerStatus: null, // Status of PeerJS
  connectedPeers: [], // Tracked incoming peers
})

export const PeerContextProvider = ({ children, initialContext }) => {

  const {
    roomId,
    roomName: initialRoomName,
    user,
    isHost,
  } = initialContext

  const [peerListenersInitialized, setPeerListenersInitialized] = useState(false)

  // Main peer connection to host
  // const [outgoingConn, setOutgoingConn, outgoingConnRef] = useStateRef(null)
  const [connToHost, setConnToHost] = useState(null)

  // List of all connected peers (Only for Host)
  const [connectedPeers, setConnectedPeers, connectedPeersRef] = useStateRef([])
  // List of connected peers to room (All peers except host)
  const [peersOnRoom, setPeersOnRoom, peersOnRoomRef] = useStateRef([])

  // Receiving Audio stream
  const [incomingStreams, setIncomingStreams, incomingStreamsRef] = useStateRef([])

  // Sending Audio stream
  const [outgoingStreams, setOutgoingStreams, outgoingStreamsRef] = useStateRef([])

  function resetState() {
    setOutgoingStreams([])
    setIncomingStreams([])
    setPeersOnRoom([])
    setConnectedPeers([])
    setConnToHost(null)
  }

  const [peer, peerId, peerStatus] = usePeer({
    peerId: isHost ? roomId : null,
    onConnectionOpen: (peer) => {
      // TODO: Auto connect to room
      // console.log('=== onConnectionOpen', roomId)
      if (isHost) return
      connectToHost(peer, roomId)
    },
  })

  // Connect to Host/Room (only listeners)
  const connectToHost = (peer, roomId) => {
    console.log(`Connect to ${roomId}`)
    const conn = peer.connect(roomId, {
      metadata: {
        user,
      }
    })
    setPeerEvents(conn)
    setConnToHost(conn)
  }

  function reconnectToHost () {
    connectToHost(peer, roomId)
  }

  const setPeerEvents = (conn) => {
    conn.on('open', () => {
      console.log(`PeerContext::Connection to host ✅`)
    })

    conn.on('close', () => {
      console.log(`PeerContext::Closed host connection`)
      resetState()
    })

    conn.on('data', (data) => {
      console.log(`peerContext::Incoming peer data ${conn.peer}`, data)
      const {
        action,
        payload
      } = data
      if (action === 'connectedPeers') setPeersOnRoom(payload)
    })
  }

  // ALL: Remove speaker audio
  function onSpeakerClosesStream (conn, e) {
    console.log('onSpeakerClosesStream', conn, e, false)
    // Remove call from list of speakers
    incomingStreamsRef.current.filter(c => c.call.peer !== conn.peer).audioObj.pause()
    setIncomingStreams([...incomingStreamsRef.current.filter(c => c.call.peer !== conn.peer)])
  }

  function onSpeakerStarsStream (call, audioStream) {
    console.log('onSpeakerStarsStream', call)

    const audioObj = new Audio()
    audioObj.srcObject = audioStream
    audioObj.play()

    setIncomingStreams([...incomingStreamsRef.current, {
      call,
      audioStream,
      audioObj,
    }])
  }

  async function startStreamToPeer(peerId) {
    console.log(`PeerContext::Start Stream to ${peerId}`)
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    })

    const call = await peer.call(peerId, stream, {
      metadata: {
        user,
      }
    })
    // TODO: This is not executing on error
    call.on('close', (call) => {
      console.log('Peer closed call', call)
      // closedStreamToPeer(call)
    })
    call.on('error', (call) => {
      console.log('Peer Error call', call);
      // closedStreamToPeer(call)
    })
    setOutgoingStreams([...outgoingStreamsRef.current, call])
  }

  function closedStreamToPeer(conn) {
    // When peer closes connection to streaming speaker
    setOutgoingStreams([...incomingStreamsRef.current.filter(c => c.peer !== conn.peer)])
  }

   // HOST: Ask peer to be Speaker
   function onPromotePeerToSpeaker(peerId) {
    const willPromoteConn = connectedPeersRef.current.find(({peer}) => peer === peerId)
    willPromoteConn.send({
      action: 'promoteToSpeaker',
    })
  }

  // HOST: Demote Speaker to Listener
  function onDemotePeerToListener(peerId) {
    const willPromoteConn = connectedPeersRef.current.find(({peer}) => peer === peerId)
    willPromoteConn.send({
      action: 'demoteToListener',
    })
  }

  useEffect(() => {
    if (!peer) return
    if (peerListenersInitialized) return
    peer.on('connection', (conn) => {
      // Incoming connection
      // Room Host only
      console.log(`peerContext::Incoming peer connection ${conn.peer}`)

      conn.on('data', (data) => {
        console.log(`peerContext::Incoming peer data ${conn.peer}`, data)
        const {
          action,
          payload
        } = data
        // TODO: Features to implement
        // if (action === 'sendReaction') sendReaction(payload)
        // if (action === 'sendQuestion') sendQuestion(payload)
      })

      conn.on('close', () => {
        console.log(`peerContext::Closed peer connection ${conn.peer}`)
        setConnectedPeers(connectedPeersRef.current.filter(peer => peer.peer !== conn.peer))
      })

      conn.on('open', () => {
        console.log(`peerContext::Stablished peer connection ${conn.peer}`)
        setConnectedPeers([...connectedPeersRef.current, conn])
        // Auto start stream to peer
        startStreamToPeer(conn.peer)
      })
    })

    peer.on('call', call => {
      console.log('peerContext::Received call', call)

      call.on('close', (e) => { console.log('Close call',e); onSpeakerClosesStream(call, e)})
      call.on('error', (e) => { console.log('Error call',e); onSpeakerClosesStream(call, e)})
      call.on('stream', audioStream => {
        onSpeakerStarsStream(call, audioStream)
        /* const audioObj = new Audio()
        audioObj.srcObject = audioStream
        audioObj.play()

        setIncomingStreams([...incomingStreamsRef.current, {
          call,
          audioStream,
          audioObj,
        }]) */
      })

      call.answer()
    })

    peer.on('disconnected', () => {
      console.log('peerContext::Peer desconnected')
    })

    setPeerListenersInitialized(true)
  }, [peer])

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

  return (
    <PeerContext.Provider value={{
      roomId,
      peer,
      peerId,
      peerStatus,
      connToHost,
      connectedPeers,
      peersOnRoom,
      incomingStreams,
      outgoingStreams,
      isHost,
      reconnectToHost,
    }}>
      {children}
    </PeerContext.Provider>
  )

}

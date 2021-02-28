import { useEffect, createContext, useState, useContext, useRef, useMemo } from 'react'
import uuid from 'uuid-random'

import { StreamContext } from '../contexts/StreamContext'
// import useStateRef from '../libs/useStateRef'
import { mapPeersData } from '../libs/peerHelper'

import useStateRef from '../libs/useStateRef'
import usePeer from '../hooks/usePeer'

import { serverTimestamp, updateRoom } from '../hooks/useFirestore'


export const PeerContext = createContext({
  peer: null, // PeerInstance
  peerId: null, // PeerId of the connection
  peerStatus: null, // Status of PeerJS
  connectedPeers: [], // Tracked incoming peers
})

export const PeerContextProvider = ({ children, initialContext }) => {

  const {
    roomId,
    roomMetadata: initialRoomMetadata,
    user,
    isHost,
  } = initialContext

  const {
    startMicStream,
  } = useContext(StreamContext)

  const [peerListenersInitialized, setPeerListenersInitialized] = useState(false)

  // Main peer connection to host
  // const [outgoingConn, setOutgoingConn, outgoingConnRef] = useStateRef(null)
  const [connToHost, setConnToHost] = useState(null)

  // HOST/PEER: Connection role (host/speaker/listener)
  // Host is always host, also speaker
  // Peer is listener by default, and can be promoted to speaker to talk
  const [connRole, setConnRole, connRoleRef] = useStateRef(isHost ? 'host' : 'listener')

  // List of all connected peers (Only for Host)
  const [connectedPeers, setConnectedPeers, connectedPeersRef] = useStateRef([])
  // List of connected peers to room (All peers except host)
  const [peersOnRoom, setPeersOnRoom, peersOnRoomRef] = useStateRef([])

  // Due to bug on PeerJS, storing speakers status on host (Only Host)
  const [speakers, setSpeakers, speakersRef] = useStateRef(isHost ? [roomId] : [])

  // Receiving Audio stream
  const [incomingStreams, setIncomingStreams, incomingStreamsRef] = useStateRef([])

  // Sending Audio stream
  const [outgoingStreams, setOutgoingStreams, outgoingStreamsRef] = useStateRef([])

  const [roomMetadata, setRoomMetadata, roomMetadataRef] = useStateRef(initialRoomMetadata)
  const [roomEvents, setRoomEvents, roomEventsRef] = useStateRef([])

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
      // log('=== onConnectionOpen', roomId)
      if (isHost) return
      connectToHost(peer, roomId)
    },
  })

  const log = (content, e) => {
    console.log(`PeerContext::${user?.name}::`, content, e)
  }

  // Connect to Host/Room (only listeners)
  const connectToHost = (peer, roomId) => {
    log(`Connect to ${roomId}`)
    const conn = peer.connect(roomId, {
      metadata: {
        user,
      },
      serialization: 'json',
    })
    setPeerEvents(conn)
    setConnToHost(conn)
  }

  function reconnectToHost () {
    connectToHost(peer, roomId)
  }

  // PEER Functions

  // PEER: Host want's this peer to be speaker
  function onPromtToPromotePeerToSpeaker() {
    log(`onPromtToPromotePeerToSpeaker`)
    setConnRole('speaker')
  }

  // PEER: Host want's to demote this peer from speaker to listener
  async function onReqToDemotePeerToListener() {
    try {
      log(`onReqToDemotePeerToListener`)
      setConnRole('listener')
      outgoingStreamsRef.current.forEach(async (call, i) => {
        log('Close calls', call)
        call.close()
      })
      setOutgoingStreams([])
    } catch (e) {
      // TODO: Handle error
    }
  }

  // Monitor changes on peer Role
  useEffect(() => {
    startStreamToAllPeers()
  }, [connRole])

  // Call all connected peers
  function startStreamToAllPeers() {
    // Start call to each listener
    if (connRoleRef.current !== 'speaker') return
    const peersShouldCall = peersOnRoomRef.current.map(peer => peer.peer)

    const peersToCall = peersShouldCall
      // Remove peers that are already being streamed
      .filter(peer => !outgoingStreamsRef.current.includes(peer.peer))
      // Remove myself
      .filter(peer => peer !== peerId)

    peersToCall
      .forEach(async (peer, i) => {
        log(`Start call 📞 with ${peer}`)
        await startStreamToPeer(peer)
      }) 
  }

  const setPeerEvents = (conn) => {
    conn.on('open', () => {
      log(`Connection to host ✅`)
    })

    conn.on('close', () => {
      log(`Closed host connection`)
      resetState()
    })

    conn.on('data', (data) => {
      log(`Incoming peer data ${conn.peer}`, data)
      const {
        action,
        payload
      } = data
      if (action === 'connectedPeers') setPeersOnRoom(payload)
      if (action === 'promoteToSpeaker') onPromtToPromotePeerToSpeaker()
      if (action === 'demoteToListener') onReqToDemotePeerToListener()
      if (action === 'roomMetadata') setRoomMetadata(payload)
      if (action === 'event') {
        console.log('Magic event', data)
        setRoomEvents([...roomEventsRef.current, payload])
      }
    })
  }

  // ALL: Remove speaker audio
  function onSpeakerClosesStream (conn) {
    try {
      log(`onSpeakerClosesStream`, conn)
      // Remove call from list of speakers
      incomingStreamsRef.current.filter(c => c.call.peer !== conn.peer).audioObj.pause()
      setIncomingStreams([...incomingStreamsRef.current.filter(c => c.call.peer !== conn.peer)])
    } catch (e) {
      // TODO: Handle error
    }
  }

  function onSpeakerStarsStream (call, audioStream) {
    log(`start call audio stream`, call)

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
    log(`Start Stream to ${peerId}`)
    const stream = await startMicStream()

    const call = peer.call(peerId, stream, {
      metadata: {
        user,
      }
    })
    // Why this gets executed on peers and not in host
    // TODO: This is not being properly executed (there are several open issues open in Github)
    .on('close', () => {
      log('Stream has been closed')
      closedStreamToPeer(call)
    })
    .on('error', () => {
      log('Stream has error');
      // closedStreamToPeer(call)
    })
    setOutgoingStreams([...outgoingStreamsRef.current, call])
  }

  function closedStreamToPeer(call) {
    // This is not being executed
    // When peer closes connection to streaming speaker
    call.close()
    setOutgoingStreams([...outgoingStreamsRef.current.filter(c => c.peer !== call.peer)])
  }

   // HOST: Ask peer to be Speaker
   function onPromotePeerToSpeaker(peerId) {
    const willPromoteConn = connectedPeersRef.current.find(({peer}) => peer === peerId)
    willPromoteConn.send({
      action: 'promoteToSpeaker',
    })
    setSpeakers([...speakersRef.current, peerId])
  }

  // HOST: Demote Speaker to Listener
  function onDemotePeerToListener(peerId) {
    const willPromoteConn = connectedPeersRef.current.find(({peer}) => peer === peerId)
    willPromoteConn.send({
      action: 'demoteToListener',
    })
    setSpeakers([...speakersRef.current].filter(p => p !== peerId))
  }

  function onPeerSendReaction(conn, payload) {
    const event = {
      id: uuid(),
      date: +new Date() / 1000,
      peer: conn.peer,
      eventName: 'reaction',
      eventContent: payload,
    }

    broadcastMessage({
      action: 'event',
      payload: event,
    })

    setRoomEvents([...roomEventsRef.current, event])
  }

  useEffect(() => {
    if (!peer) return
    if (peerListenersInitialized) return
    peer.on('connection', (conn) => {
      // Incoming connection
      // Room Host only
      log(`Incoming peer connection ${conn.peer}`)

      conn.on('data', (data) => {
        log(`Incoming peer data ${conn.peer}`, data)
        const {
          action,
          payload
        } = data
        // TODO: Features to implement
        if (action === 'sendReaction') onPeerSendReaction(conn, payload)
        // if (action === 'sendQuestion') sendQuestion(payload)
      })

      conn.on('close', () => {
        log(`Closed peer connection ${conn.peer}`)
        setConnectedPeers(connectedPeersRef.current.filter(peer => peer.peer !== conn.peer))
      })

      conn.on('open', () => {
        log(`Stablished peer connection ${conn.peer}`)
        setConnectedPeers([...connectedPeersRef.current, conn])
        conn.send({
          action: 'roomMetadata',
          payload: roomMetadata,
        })
        // Auto start stream to peer
        startStreamToPeer(conn.peer)
      })
    })

    peer.on('call', call => {
      log('Received call', call)

      // Call can be closed by peer or speaker
      call.answer()
      call.on('stream', audioStream => {
        onSpeakerStarsStream(call, audioStream)
      })
      call.on('close', () => { log('Close call'); onSpeakerClosesStream(call)})
      call.on('error', () => { log('Error call'); onSpeakerClosesStream(call)})
      
    })

    peer.on('disconnected', () => {
      log('Peer desconnected')
    })

    setPeerListenersInitialized(true)
  }, [peer])

  const peerList = useMemo(() => {
    if (isHost) {
      const hostPeer = {
        peer: roomId,
        metadata: {
          user,
          isHost,
          isSpeaker: true,
        },
      }
      return mapPeersData([hostPeer, ...connectedPeers], speakers)
    }
    return peersOnRoom
  }, [connectedPeers, peersOnRoom, speakers])

  useEffect(() => {
    // Send updated listeners to all peers
    if (!isHost) return
    broadcastMessage({
      action: 'connectedPeers',
      payload: peerList,
    })
  }, [peerList])

  const broadcastMessage = (content) => {
    connectedPeersRef.current.forEach((conn, i) => {
      conn.send(content)
    })
  }

  const sendMessageToHost = (content) => {
    connToHost.send(content)
  }

  useEffect(() => {
    if (!isHost) return
    const update = setInterval(() => {
      updateRoom(roomId, {
        users: (connectedPeersRef.current.length + 1), // +1 to include self
        lastPing: serverTimestamp()
      })
    }, 10000)
    return () => {
      clearInterval(update)
    }
  }, [])

  return (
    <PeerContext.Provider value={{
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
        roomEvents,
      },
      streams: {
        incomingStreams,
        outgoingStreams,
      },
      actions: {
        onPromotePeerToSpeaker,
        onDemotePeerToListener,
        sendMessageToHost,
        reconnectToHost,
      }
    }}>
      {children}
    </PeerContext.Provider>
  )

}

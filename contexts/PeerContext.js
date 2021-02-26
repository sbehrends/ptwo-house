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

  const [peerStatus, setPeerStatus, peerStatusRef] = useStateRef()

  const [roomName, setRoomName, roomNameRef] = useStateRef(initialRoomName)
  // Connected Streams (each call will be stored here)
  const [incomingStreams, setIncomingStreams, incomingStreamsRef] = useStateRef([])
  const [incomingStreamsAudio, setIncomingStreamsAudio, incomingStreamsAudioRef] = useStateRef([])
  const [incomingStreamsObj, setIncomingStreamsObj, incomingStreamsObjRef] = useStateRef([])

  // PEER: Outgoing streams
  const [outgoingStreams, setOutgoingStreams, outgoingStreamsRef] = useStateRef([])

  // HOST/PEER: Connection role (host/speaker/listener)
  // Host is always host and speaker
  // Peer is listener by default, and can be promoted to speaker to talk
  const [connRole, setConnRole, connRoleRef] = useStateRef(isHost ? 'host' : 'listener')

  // Connected users
  const [connectedPeers, setConnectedPeers, connectedPeersRef] = useStateRef([])
  
  // PeerJS Instance
  // const peerInstanceRef.current = useRef()
  // let peerInstance = peerInstanceRef.current.current
  const [peerInstance, setPeerInstance, peerInstanceRef] = useStateRef()
  const [peerConnError, setPeerConnError] = useState(null)

  const {
    startMicStream,
  } = useContext(StreamContext)

  // TODO: Rename this function
  // HOST/PEER: Start call to other connections
  async function onNewCall(peerId) {
    console.log(`Start call to ${peerId}`)
    const stream = await startMicStream()
    try {
      let call = peerInstanceRef.current.call(peerId, stream, {
        metadata: {
          name: userName,
          roomName: initialContext.roomName,
        }
      })
      
      return call
    } catch (err) {
      console.log(err)
    }
  }

  // HOST: New peer. Keep track of current connections
  function onConnectedPeer(conn) {
    setConnectedPeers([...connectedPeersRef.current, conn])
  }

  // HOST: Remove peer. Keep track of current connections
  function onDisconnectedPeer(conn) {
    return setConnectedPeers(connectedPeersRef.current.filter(peer => peer.peer !== conn.peer))
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

  // PEER: Host want's to demote this peer from speaker to listener
  async function onReqToDemotePeerToListener() {
    console.log('onReqToDemotePeerToListener')
    setConnRole('listener')
    outgoingStreamsRef.current.forEach(async (call, i) => {
      console.log('Close calls', call)
      call.close()
    })
  }

  // PEER: Host want's this peer to be speaker
  async function onPromtToPromotePeerToSpeaker() {
    console.log('onPromtToPromotePeerToSpeaker')
    setConnRole('speaker')
    // Close all calls
    // const peersShouldHangUp = [...connectedPeersRef.current, { peer: roomId }] // Add room Host
    //   .map(peer => peer.peer)
  }

  useEffect(() => {
    startStreamToAllPeers()
  }, [connRole])

  function startStreamToAllPeers() {
    // Start call to each listener
    if (connRoleRef.current !== 'speaker') return
    const peersShouldCall = [...connectedPeersRef.current, { peer: roomId }] // Add room Host
      .map(peer => peer.peer)

    // debugger;
    const peersToCall = peersShouldCall
      // Remove peers that are already being streamed
      .filter(peer => !outgoingStreamsRef.current.includes(peer.peer))
      // Remove myself
      .filter(peer => peer !== peerId)

    peersToCall
      .forEach(async (peer, i) => {
        console.log(`PeerContext::Start call with ${peer}`)
        const call = await onNewCall(peer)
        setTimeout(() => {
          console.log('Force close call')
          call.close()
        }, 5000)
        window.test = call
        setOutgoingStreams([...outgoingStreamsRef.current, call])
      })

    
  }

  // ALL: Remove speaker audio
  function onSpeakerClosesStream (conn, e) {
    console.log('onSpeakerClosesStream', conn, e,false)
    // Remove call from list of speakers

    setIncomingStreams([...incomingStreamsRef.current.filter(c => c.peer !== conn.peer)])
    setIncomingStreamsObj([...incomingStreamsObjRef.current.filter(c => c.call.peer !== conn.peer)])
    // debugger;
    // a
    // setIncomingStreams([...incomingStreamsRef.current, call])
  }

  useEffect(() => {
    // Send updated listeners to all peers
    // debugger
    if (!isHost) return
    connectedPeers.forEach((conn, i) => {
      conn.send({
        action: 'connectedPeers',
        payload: mapPeersData(connectedPeers),
      })
    })
  }, [connectedPeers])

  useEffect(() => {
    if (isHost) return
    startStreamToAllPeers()
  }, [connectedPeers])

  function startRoom() {
    console.log('Start room', peerInstanceRef.current)
    let peer = initilizePeer(peerId)

    peer.on('open', (peerId) => {
      console.log(`PeerContext::Initialized ${isHost ? 'host' : 'listener'} with ID ${peerId}`)
      setPeerStatus('PeerContext::PeerStatus = open')

      if (isListener) {
        // Only on listener
        const conn = connectToHost(peer, roomId, userName)
        conn.on('close', () => {
          console.log(`PeerContext::Closed host connection`)
          setPeerStatus('PeerContext::PeerStatus = close')
          setPeerConnError('Host closed room')
        })

        conn.on('data', (data) => {
          console.log(`PeerContext::Incoming peer data ${conn.peer}`, data)
          const {
            action,
            payload
          } = data
          if (action === 'connectedPeers') setConnectedPeers(payload)
          if (action === 'promoteToSpeaker') onPromtToPromotePeerToSpeaker()
          if (action === 'demoteToListener') onReqToDemotePeerToListener()
        })
      }
    })
  
    peer.on('error', (err) => {
      console.error(`PeerContext::Error on peer`, err)
      setPeerStatus('PeerContext::PeerStatus = error')
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
      console.log('Received call')

      call.on('close', (e) => { console.log('Close call',e); onSpeakerClosesStream(call, e)})
      call.on('error', (e) => { console.log('Error call',e); onSpeakerClosesStream(call, e)})
      // Connected Streams (each call will be stored here)
      
      call.on('stream', audioStream => {
        setIncomingStreamsAudio([...incomingStreamsAudioRef.current, audioStream])

        const audioObj = new Audio()
        audioObj.srcObject = audioStream
        audioObj.play()

        // const incomingStreams = {
        //   ...incomingStreamsObjRef.current,
        // } 
        // incomingStreams[call.peer] = {
        //   call,
        //   audioStream,
        //   audioObj,
        // }
        setIncomingStreamsObj([...incomingStreamsObjRef.current, {
          call,
          audioStream,
          audioObj,
        }])
      })

      call.answer()
      
      // setIncomingStreams([...incomingStreamsRef.current, call])
      // setRoomName(call.metadata.roomName || '')
    })

    setPeerInstance(peer)
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

  return (
    <PeerContext.Provider value={{
      peerConnError,
      incomingStreams,
      connectedPeers,
      roomName,
      userName,
      onPromotePeerToSpeaker,
      onDemotePeerToListener,
      isHost,
      peerId,
      connRole,
      incomingStreamsObj,
      peerStatus,
    }}>
      {children}
    </PeerContext.Provider>
  )
}

export { PeerContext, PeerContextProvider }

import { useEffect, useState, useContext, useMemo } from 'react'
import {CopyToClipboard} from 'react-copy-to-clipboard'

import uuid from 'uuid-random'

import useStateRef from '../libs/useStateRef'
import { mapPeersData } from '../libs/peerHelper'

import { PeerContextProvider, PeerContext } from '../contexts/PeerJSContext'

function Debug ({ name }) {
  const {
    roomId,
    peer,
    peerId,
    peerStatus,
    connectedPeers,
    peersOnRoom,
    connToHost,
    incomingStreams,
    isHost,
    reconnectToHost,
  } = useContext(PeerContext)

  const [hostId, setHostId] = useState(roomId)
  const [outgoingConn, setOutgoingConn, outgoingConnRef] = useStateRef([])
  // const [peersOnRoom, setPeersOnRoom, peersOnRoomRef] = useStateRef([])
  // const [connToHost, setConnToHost] = useState(null)

  /* const handleConnectToHost = () => {
    console.log(`Connect to ${hostId}`)
    const conn = peer.connect(hostId)
    console.log(conn)
    conn.on('data', (data) => {
      console.log(`peerContext::Incoming peer data ${conn.peer}`, data)
      const {
        action,
        payload
      } = data
      if (action === 'connectedPeers') setPeersOnRoom(payload)
    })
    setConnToHost(conn)
    setOutgoingConn([...outgoingConn, conn])
  } */
  
  // useEffect(() => {
    
  // },)

  const initializeStreamToPeer = async (peerId) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    })

    peer.call(peerId, stream, {
      metadata: {
        name: 'Test'
      }
    })
  }

  const peerList = useMemo(() => {
    if (isHost) return mapPeersData(connectedPeers)
    return peersOnRoom
  }, [connectedPeers, peersOnRoom])

  return (
    <div>
      <h3>{name}</h3>
      <ul>
        <li>
          Id: {peerId}
          <CopyToClipboard text={peerId}><button>Copy</button></CopyToClipboard>
        </li>
        <li>Status: {peerStatus} <button onClick={() => { peer.disconnect() }}>Disconnect</button></li>
        <li>Peers: {connectedPeers.length}</li>
      </ul>
      <h4>Peers (Only host)</h4>
      <ul>
        {connectedPeers.map(peer => (
          <li key={peer.connectionId}>
            {peer.peer} {peer.connectionId}
            <button onClick={() => initializeStreamToPeer(peer.peer)}>Call</button>
          </li>
        ))}
      </ul>
      <h4>Peers in Room</h4>
      { connToHost && <button onClick={() => connToHost.close()}>Close</button>}
      { !connToHost && <button onClick={() => reconnectToHost()}>Connect</button>}
      
      <ul>
        {peerList.map((peer, i) => (
          <li key={i}>
            {peer.metadata.user.name}
          </li>
        ))}
      </ul>
      <h4>Outgoing Connections</h4>
      <ul>
        {outgoingConn.map(peer => (
          <li key={peer.connectionId}>{peer.peer} {peer.connectionId}</li>
        ))}
      </ul>
      <h4>Calls</h4>
      <ul>
        {incomingStreams.map(stream => (
          <li key={stream.call.connectionId}>{stream.call.peer} {stream.call.connectionId}</li>
        ))}
      </ul>
    </div>
  )
}

export default function DebugMain () {
  const roomId = uuid()
  return (
    <div style={{display: 'flex', justifyContent: 'space-around'  }}>
      <PeerContextProvider initialContext={{
        isHost: true,
        roomId,
        user: {
          name: 'Host'
        }
      }}>
        <Debug name="Host" />
      </PeerContextProvider>
      <PeerContextProvider initialContext={{
        isHost: false,
        roomId,
        user: {
          name: 'B'
        }
      }}>
        <Debug name="B" />
      </PeerContextProvider>
      <PeerContextProvider initialContext={{
        isHost: false,
        roomId,
        user: {
          name: 'C'
        }
      }}>
        <Debug name="C" />
      </PeerContextProvider>
    </div>
  )
}

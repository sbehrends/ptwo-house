import { useEffect, useState, useContext, useMemo } from 'react'
import {CopyToClipboard} from 'react-copy-to-clipboard'

import uuid from 'uuid-random'

import useStateRef from '../libs/useStateRef'

import { PeerContextProvider, PeerContext } from '../contexts/PeerJSContext'

function Debug ({ name }) {
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
      // reconnectToHost,
    }
  } = useContext(PeerContext)

  const [hostId, setHostId] = useState(roomId)
  const [outgoingConn, setOutgoingConn, outgoingConnRef] = useStateRef([])

  const disconnect = () => {
    connToHost.close()
    incomingStreams.forEach(({call}, i) => {
      // console.log(call)
      call.close()
    })
  }

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
        <li>Role: {connRole}</li>
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
      <h4>Peers in Room {roomMetadata?.title || ''}</h4>
      { !isHost && connToHost && <button onClick={disconnect}>Close</button>}
      { !isHost && !connToHost && <button onClick={() => reconnectToHost()}>Connect</button>}

      <ul>
        {peerList.map((peer, i) => (
          <li key={peer.peer}>
            {peer.metadata.user.name} {peer.metadata.isHost ? 'Host' : peer.metadata.isSpeaker ? 'Speaker' : 'Listener'}
            {isHost && !peer.metadata.isHost && !peer.metadata.isSpeaker && <button onClick={() => onPromotePeerToSpeaker(peer.peer)}>Promote</button>}
            {isHost && !peer.metadata.isHost && peer.metadata.isSpeaker && <button onClick={() => onDemotePeerToListener(peer.peer)}>Demote</button>}
          </li>
        ))}
      </ul>
      <h4>Incoming Streams (Speakers)</h4>
      <ul>
        {incomingStreams.map(stream => (
          <li key={stream.call.connectionId}>{stream.call.peer} {stream.call.connectionId}</li>
        ))}
      </ul>
      <h4>Outgoing Streams (Sending audio to peers)</h4>
      <ul>
        {outgoingStreams.map(stream => (
          <li key={stream.connectionId}>{stream.peer} {stream.connectionId}</li>
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
        },
        roomMetadata: {
          title: 'Debug Room',
        },
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

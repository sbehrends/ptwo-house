import { useEffect, useState } from 'react'
import {CopyToClipboard} from 'react-copy-to-clipboard';

import usePeer from '../hooks/usePeer'
import useStateRef from '../libs/useStateRef'


function Debug ({ name }) {
  const [peer, peerId, peerStatus, connectedPeers] = usePeer()
  const [hostId, setHostId] = useState('')

  const [outgoingConn, setOutgoingConn, outgoingConnRef] = useStateRef([])

  const handleConnectToHost = () => {
    console.log(`Connect to ${hostId}`)
    const conn = peer.connect(hostId)
    console.log(conn)
    setOutgoingConn([...outgoingConn, conn])
  }

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

  useEffect(() => {
    // console.log('a')
  }, [connectedPeers])

  return (
    <div>
      <h3>{name}</h3>
      <ul>
        <li>
          Id: {peerId}
          <CopyToClipboard text={peerId}><button>Copy</button></CopyToClipboard>
        </li>
        <li>Status: {peerStatus}</li>
        <li>Peers: {connectedPeers.length}</li>
        <li>Connections: {outgoingConn.length}</li>
      </ul>
      <h4>Connect To</h4>
      <input placeholder="Host Name" onChange={e => setHostId(e.target.value)} />
      <button onClick={handleConnectToHost}>Connect</button>
      <h4>Peers</h4>
      <ul>
        {connectedPeers.map(peer => (
          <li key={peer.connectionId}>
            {peer.peer} {peer.connectionId}
            <button onClick={() => initializeStreamToPeer(peer.peer)}>Call</button>
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
        {/* {outgoingConn.map(peer => (
          <li key={peer.connectionId}>{peer.peer} {peer.connectionId}</li>
        ))} */}
      </ul>
    </div>
  )
}

export default function DebugMain () {
  return (
    <div style={{display: 'flex', justifyContent: 'space-around'  }}>
      <Debug name="Host" />
      <Debug name="B" />
      <Debug name="C" />
    </div>
  )
}

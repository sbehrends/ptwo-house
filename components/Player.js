import { useEffect, useState, useRef } from 'react'
import Peer from 'peerjs'

import Speaker from './Speaker'

const names = ['Bob', 'Alice', 'Jon', 'Craig']
function randomName() {
  return names[Math.floor(Math.random() * names.length)]
}

function parseAllPeers (connections) {
  // https://peerjs.com/docs.html#peerconnections
  // We recommend keeping track of connections yourself rather than relying on this hash.
  if (!connections) return
  return Object
    .keys(connections)
    .reduce(function (r, k) {
      return r.concat(k, connections[k]);
    }, [])
    .filter(conn => conn.open)
    .filter(conn => conn.metadata)
    .map(conn => ({ peer:conn.peer, name: conn.metadata.name }))
}

export default function Player ({ host, roomId }) {
  const [peerId, setPeerId] = useState()
  const [peers, setPeers] = useState()
  const [localStream, setLocalStream] = useState()
  const videoEl = useRef(null)

  function renderVideo(stream) {
    // console.log('Render video')
    console.log(videoEl.current)
    videoEl.current.srcObject = stream
    videoEl.current.play()
  }

  useEffect(() => {
    if (!roomId) return
    // On load

    const peer = new Peer(host ? roomId : null, {
      // debug: 1
    })

    window.peer = peer

    function connectToHost () {
      const conn = peer.connect(roomId, {
        metadata: {
          name: randomName(),
        }
      })
      conn.on('open', () => {
        console.log('Connection succcesful')
        conn.send('Hi host')
      })
      conn.on('data', data => console.log('Message received', data))
      peer.on('call', call => {
        console.log('Incoming Call')
        call.answer()
        call.on('stream', renderVideo)
      })
    }

    function startStream (peerId) {
      navigator.mediaDevices.getUserMedia({video: false, audio: true})
      .then((stream) => {
        console.log('Stream started')
        setLocalStream(stream)
        let call = peer.call(peerId, stream, {
          metadata: {
            hostOnly: true
          }
        });
        // call.on('stream', renderVideo);
      })
      .catch((err) => {
        console.log('Failed to get local stream', err);
      });
    }
  
    peer.on('open', (peerId) => {
      console.log(`Initialized peer with ID ${peerId}`)
      setPeerId(peerId)
      
      if (!host) {
        console.log('Connecting to host')
        connectToHost()
      }
    })
  
    peer.on('error', (error) => {
      console.error(error)
    })

    peer.on('connection', (conn) => {
      console.log('Incoming peer connection!')

      conn.on('data', (data) => {
        console.log(`received: ${data}`)
      })

      conn.on('close', () => {
        console.log('Peer disocnnected')
      })

      conn.on('open', () => {
        console.log('Stablished connection form peer')
        // Connection opened
        conn.send('Hi peer')
        startStream(conn.peer)
        console.log(parseAllPeers(peer.connections))
        conn.send({
          action: 'connectedPeers',
          payload: parseAllPeers(peer.connections),
        })
      })
    })

  }, [roomId])

  

  return (
    <div>
      {host ? 'Host' : 'Peer'} #{roomId}
      <Speaker stream={localStream} name="Ser" />
      <audio ref={videoEl} controls autoPlay={true}></audio>
      {/* <video  ref={videoEl} /> */}
    </div>
  )
}

export function PlayerOld ({ host, roomId }) {

  const [peerId, setPeerId] = useState()
  const videoEl = useRef(null)

  useEffect(() => {
    if (!roomId) return
    const peer = new Peer(host ? roomId : null, {
      debug: 2
    })

    peer.on('open', function(id) {
      console.log('My peer ID is: ' + id)
      setPeerId(id)
      if (!host) {
        const conn = peer.connect(roomId, {
          metadata: {
            name: randomName()
          }
        })
        peer.on('call', function(call) {
          // Answer the call, providing our mediaStream
          console.log('Incoming Call', call)
          conn.send('Hello!');
          call.answer()
          call.on('stream', stream => {
            console.log('stream', stream)
            console.log('Render video', videoEl)
            if ('srcObject' in videoEl.current) {
              videoEl.current.srcObject = stream
            } else {
              videoEl.current.src = window.URL.createObjectURL(stream) // for older browsers
            }
          })
        })
      }
      
      // Start stream
      if (host) {
        navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true
        }).then(stream => {

          // console.log('Render video')
          // var video = document.querySelector('videoHost')
          // video.srcObject = stream
          console.log(stream)
          // videoEl.current.srcObject = stream

          peer.on('connection', function(conn) {
            // Start Call to this connections
            console.log('New connections', conn)
            conn.on('data', data => console.log('incoming data', data))
            const call = peer.call(conn.peer, stream);
          });
          
        }).catch((err) => console.log('err', err))
      }
    })

    

  }, [roomId])

  if (host) {
    return (
      <div>
        Host #{roomId} & peer {peerId}
        {/* <video ref={videoEl} autoPlay={true} id="videoHost"></video> */}
        <audio ref={videoEl} controls autoplay></audio>
      </div>
    )
  }

  return (
    <div>
      Listener #{roomId} & Peer {peerId}
      {/* <video ref={videoEl} autoPlay={true} id="video"></video> */}
      <audio ref={videoEl} controls autoplay></audio>
    </div>
  )
}
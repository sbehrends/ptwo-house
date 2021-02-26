import { useState, useRef } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'

import Layout from '../../components/Layout'
import Button from '../../components/Button'
import Heading from '../../components/Heading'
import Input from '../../components/Input'

const PlayerMain = dynamic(
  () => import('../../components/PlayerMain'),
  { ssr: false }
)

export default function RoomPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [willingToConnect, setWillingToConnect] = useState(false)

  const audioEl = useRef()

  const {
    roomId,
  } = router.query

  function joinRoom() {
    audioEl.current.play()
    setWillingToConnect(true)
    return
  }
  
  return (
    <Layout>
      { !willingToConnect && (
        <div style={{padding: 20}}>
          <div className="spacing" style={{marginTop: 30}}>
            <Heading size={2}>Join Room</Heading>
            <div>
              <Input placeholder="Name" onChange={e => setUserName(e.target.value)} />
            </div>
            <audio style={{display: 'none'}} ref={audioEl} src="/silence.mp3" controls/>
            <div>
            <Button fullWidth onClick={joinRoom}>Join Room</Button>
            </div>
          </div>
        </div>
      )}
      { willingToConnect && (
        <PlayerMain
          roomId={roomId}
          userName={userName}
          isHost={false}
        />
      )}
      <style jsx>{`
        .spacing > * {
          margin-top: 10px;
        }
      `}</style>
    </Layout>
  )
}

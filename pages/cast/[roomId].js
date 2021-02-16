import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'

import Layout from '../../components/Layout'

const PlayerMain = dynamic(
  () => import('../../components/PlayerMain'),
  { ssr: false }
)

function RoomPage() {
  const router = useRouter()

  const {
    roomId,
    roomName,
    userName
  } = router.query

  return (
    <Layout>
      <PlayerMain
        roomId={roomId}
        roomName={roomName}
        userName={userName}
        isHost={true}
      />
    </Layout>
  )
}

export default RoomPage

import dynamic from 'next/dynamic'

const Debug = dynamic(
  () => import('../components/Debug'),
  { ssr: false }
)

export default function RoomPage() {
  return (
    <Debug />
  )
}

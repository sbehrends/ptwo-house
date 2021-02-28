import Link from 'next/link'
import { FiUser } from 'react-icons/fi'

export default function RoomList ({rooms}) {
  return (
    <div>
      {rooms.map(room => (
        <Link key={room.roomId} href={`/room/${room.roomId}`}>
          <a>
            <div>{room.roomName}</div>
            <div>{room.users || 0} <FiUser/></div>
          </a>
        </Link>
      ))}
      <style jsx>{`
        div a {
          color: white;
          text-decoration: none;
        }
        a {
          display: flex;
          justify-content: space-between;
          padding: 20px 0;
        }
      `}</style>
    </div>
  )
}

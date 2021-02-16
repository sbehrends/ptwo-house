import { useEffect, useState, useRef } from 'react'
import hark from 'hark'
import stc from 'string-to-color'
import cc from 'classcat'

const getInitials = function (string) {
  const names = `${string}`.trim().split(' ')
  let initials = names[0].substring(0, 1).toUpperCase()
  
  if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase()
  }
  return initials
}

export default function User ({ stream, name }) {
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    if (!stream) return
    if (!stream instanceof MediaStream) return
    const speechEvents = hark(stream)
    speechEvents.on('speaking', () => setSpeaking(true))
    speechEvents.on('stopped_speaking', () => setSpeaking(false))
  }, [stream])
  
  return (
    <div className="User">
      <div className={cc({ speaking, avatar: true })} style={{backgroundColor: stc(name)}}>
        <span>
          {getInitials(name)}
        </span>
      </div>
      <div className="name">
        {name}
      </div>
      <style jsx>{`
        --avatar-size: 60px;

        .User {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          font-size: 0.8em;
        }

        .name {
          margin: 8px 0 10px;
          color: var(--active-color);
        }

        .avatar {
          background-color: #ccc;
          border-radius: 50%;
          height: var(--avatar-size);
          width: var(--avatar-size);
          text-align: center;
          display: flex;
          justify-content: center;
          align-items: center;
          user-select: none;
          text-transform: uppercase;
          position: relative;
          color: var(--active-color);
        }

        .avatar::after {
          content: '';
          position: absolute;
          z-index: -1;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          box-shadow: 0 0px 0px 6px rgb(1 0 0 / 30%);
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.25s ease-in-out;
        }

        .avatar.speaking::after {
          opacity: 1;
          transform: scale(1);
        }
        
        .avatar span {
          font-size: calc(var(--avatar-size) / 2); /* 50% of parent */
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}
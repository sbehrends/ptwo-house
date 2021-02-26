import { useEffect, useState, useRef } from 'react'
import hark from 'hark'
import stc from 'string-to-color'
import cc from 'classcat'
import { FiUser, FiMicOff, FiX } from 'react-icons/fi'
import { CgCrown } from 'react-icons/cg'

const getInitials = function (string) {
  const names = `${string}`.trim().split(' ')
  let initials = names[0].substring(0, 1).toUpperCase()
  
  if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase()
  }
  return initials
}

export default function User ({ host, onClick, hoverIcon, reaction, muted, me, stream, name, highlight, ...props }) {
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    if (!stream) return
    if (!stream instanceof MediaStream) return
    const speechEvents = hark(stream)
    speechEvents.on('speaking', () => setSpeaking(true))
    speechEvents.on('stopped_speaking', () => setSpeaking(false))
  }, [stream])

  return (
    <div className="User" {...props}>
      <div className={cc([{ speaking, highlight }, 'avatar'])} style={{backgroundColor: stc(name)}} onClick={onClick}>
        { onClick && hoverIcon && (
          <div className="avatarAction">
            { hoverIcon }
          </div>
        )}
        <span>
          {getInitials(name)}
        </span>
        { ((muted || me || host) && !reaction) && (
          <div className="dot">
            {muted && <FiMicOff />}
            {host && !me && <CgCrown/>}
            {me && !muted && <FiUser />}
          </div>
        )}
        { reaction && <div className="dot">{reaction}</div>}
      </div>
      <div className="name">
        {name}
      </div>
      <style jsx>{`
        --avatar-size: 60px;
        --dot-size: 30px;

        .avatarAction {
          position: absolute;
          background: rgba(0,0,0,0.65);
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: var(--avatar-size);
          height: var(--avatar-size);
          width: var(--avatar-size);
          font-size: 28px;
          opacity: 0;
          transition: all 0.25s ease-in-out;
          cursor: pointer;
        }

        .avatarAction:hover {
          opacity: 1;
        }

        .dot {
          position: absolute;
          background: white;
          width: var(--dot-size);
          height: var(--dot-size);
          border-radius: var(--dot-size);
          right: calc(var(--dot-size) / -2);
          bottom: calc(var(--dot-size) / -4);;
          color: var(--dark-bg);
          text-indent: 3px;

          display: flex;
          justify-content: center;
          align-items: center;
        }

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
          border-radius: var(--avatar-size);
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
          position: relative;
        }
        
        .avatar.highlight {
          box-shadow: 0 0px 0px 4px rgb(1 0 0 / 30%);
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
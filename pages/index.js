import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import uuid from 'uuid-random'

import config from '../config'

import { createRoom as dbCreateRoom, useFirestoreRooms } from '../hooks/useFirestore'

import Layout from '../components/Layout'
import Button from '../components/Button'
import Input from '../components/Input'
import Heading from '../components/Heading'
import RoomList from '../components/RoomList'

export default function Index () {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [roomName, setRoomName] = useState('')
  const [createFormError, setCreateFormError] = useState(false)
  const [micAccess, setMicAccess] = useState(false)

  const [rooms] = useFirestoreRooms()

  function requestMicAccess() {
    navigator.mediaDevices.getUserMedia({
        audio: true
      })
      .then(function(stream) {
        setMicAccess('granted')
      })
      .catch(function(err) {
        setMicAccess('denied')
      })
  }

  useEffect(() => {
    navigator.permissions?.query(
      { name: 'microphone' }
    )
    .then(function(permissionStatus){
        setMicAccess(permissionStatus.state)
    })
    .catch(() => {})
  }, [])

  const exploreRooms = useMemo(() => {
    const now = +new Date() / 1000
    return rooms
      .filter(room => room.lastPing)
      .filter(room => now - room.lastPing.seconds < 30)
  }, [rooms])

  function validForm () {
    if (userName.trim().length < 3) {
      setCreateFormError('Name must be longer than 3 characters')
      return false
    }
    if (roomName.trim().length < 3) {
      setCreateFormError('Room Title must be longer than 3 characters')
      return false
    }
    setCreateFormError(false)
    return true
  }

  function createRoom() {
    if (!validForm()) return
    const roomId = uuid()
    dbCreateRoom(roomId, {
      roomId,
      roomName,
      userName,
    })
    router.push({
      pathname: '/cast/[roomId]',
      as: `/cast/${roomId}`,
      query: {
        roomId,
        roomName,
        userName,
      },
    }, `/cast/${roomId}`)
  }

  return (
    <Layout>
      <div style={{padding: 20}}>
        <div className="spacing">
          <h1 style={{transform: 'rotate(25deg)', textAlign: 'center', fontSize: 60}}>📢</h1>
          <Heading size={2}>Host Room</Heading>
          <div>
            <Input placeholder="Your Name" onChange={e => setUserName(e.target.value)} />
          </div>
          <div>
            <Input placeholder="Room Title" onChange={e => setRoomName(e.target.value)} />
          </div>
        </div>
        { createFormError && (
          <div className="error">{createFormError}</div>
        )}
        <div style={{marginTop: 20}}>
          <Button success={micAccess === 'granted'} disabled={micAccess === 'granted'} fullWidth onClick={requestMicAccess}>Allow Microphone Access</Button>
        </div>
        <div style={{marginTop: 20}}>
          <Button outline={micAccess !== 'granted'} disabled={micAccess !== 'granted'} big fullWidth onClick={createRoom}>Create Room</Button>
        </div>
        { config.firebase.enabled && (
          <div className="spacing" style={{marginTop: 30}}>
            <Heading size={2}>Latest Rooms</Heading>
            {exploreRooms.length === 0 && (
              <div>No rooms available</div>
            )}
            <RoomList rooms={exploreRooms} />
          </div>
        )}
      </div>
      <style jsx>{`
            .spacing > * {
              margin-top: 10px;
            }
            .error {
              font-size: 12px;
              text-align: center;
              margin: 6px 0;
            }
          `}</style>
    </Layout>
  )
}

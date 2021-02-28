import { useState, useEffect } from 'react'
import { firebase } from '../libs/firebase'

export const db = firebase.firestore()
export const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp

export function createRoom(id, data) {
  return db
    .collection('rooms')
    .doc(id)
    .set({
      created: firebase.firestore.FieldValue.serverTimestamp(),
      lastPing: firebase.firestore.FieldValue.serverTimestamp(),
      users: 1,
      ...data,
    })
}

export function updateRoom(id, data) {
  console.log('Will update room status', id, data)
  return db
    .collection('rooms')
    .doc(id)
    .update({
      ...data
    })
}

export function useFirestoreRooms () {

  const [rooms, setRooms] = useState([])

  useEffect(() => {
    const unsubscribe = db
      .collection('rooms')
      .orderBy('lastPing', 'desc')
      .onSnapshot(snapshot => {
        setRooms(snapshot.docs.map(doc => doc.data()))
    })

    return unsubscribe
  }, [])

  return [rooms]
}

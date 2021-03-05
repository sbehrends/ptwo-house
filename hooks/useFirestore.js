import { useState, useEffect } from 'react'
import { firebase } from '../libs/firebase'

import config from '../config'
export const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp
let db
try {
  db = firebase.firestore()
} catch (e) {
  // Do nothing
}

export function createRoom(id, data) {
  if (!config.firebase.enabled) return
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
  if (!config.firebase.enabled) return
  return db
    .collection('rooms')
    .doc(id)
    .update({
      ...data
    })
}

export function useFirestoreRooms () {

  const [rooms, setRooms] = useState([])
  if (!config.firebase.enabled) return [rooms]

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

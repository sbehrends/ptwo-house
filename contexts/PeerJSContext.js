import { useEffect, createContext, useState, useContext, useRef } from 'react'

import { StreamContext } from '../contexts/StreamContext'
import useStateRef from '../libs/useStateRef'
import { mapPeersData } from '../libs/peerHelper'

import usePeer from '../hooks/usePeer'

export const PeerContext = createContext({
  peer: {},
  peerId: '',
})

export const PeerContextProvider = ({ children, initialContext }) => {

  const {
    roomId,
    roomName: initialRoomName,
    userName,
    isHost,
  } = initialContext

  return (
    <PeerContext.Provider value={{

    }}>
      {children}
    </PeerContext.Provider>
  )

}


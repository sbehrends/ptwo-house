

export function mapPeersData(peers, speakers = []) {
  return peers.filter(Boolean).map(peer => ({
    peer: peer.peer,
    metadata: {
      user: {
        name: peer.metadata?.user?.name || 'Anonym',
      },
      isSpeaker: [...speakers].includes(peer.peer),
      isHost: peer.metadata?.isHost,
    }
  }))
}



export function mapPeersData(peers) {
  return peers.map(peer => ({
    peer: peer.peer,
    metadata: {
      user: {
        name: peer.metadata?.user?.name || 'Anonym',
      },
      isSpeaker: false,
    }
  }))
}

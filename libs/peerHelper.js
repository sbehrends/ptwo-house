

export function mapPeersData(peers) {
  return peers.map(peer => ({
    peer: peer.peer,
    metadata: {
      name: peer.metadata.name || 'Anonym',
      isSpeaker: false,
    }
  }))
}

import { useContext } from 'react'

import { RiWhatsappLine, RiTelegramLine, RiLinksFill } from 'react-icons/ri'
import { WhatsappShareButton, TelegramShareButton } from 'react-share'
import { CopyToClipboard } from 'react-copy-to-clipboard'


import { PeerContext } from '../contexts/PeerContext'
import User from './User'
import Heading from './Heading'
import Container from './Container'

export default function ConnectedPeersList({ shareLink }) {
  const {
    connectedPeers,
    onPromotePeerToSpeaker,
    isHost,
    peerId,
  } = useContext(PeerContext)

  const shareMessage = `Join my Room with this link`

  function handleUserClick(peer) {
    if (!isHost) return
    onPromotePeerToSpeaker(peer.peer)
  }

  return (
    <>
      <Container>
        <Heading size={2}>
          Listeners ({connectedPeers.length})
        </Heading>
      </Container>
      <div className="grid">
        { connectedPeers.map(peer => (
          <User key={peer.peer} highlight={peer.peer === peerId} name={peer.metadata?.name || 'Anonym'} onClick={() => handleUserClick(peer)} />
        ))}
        <style jsx>{`
          .grid {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-gap: 1rem;
            grid-template-columns: repeat(3, 1fr);
          }
        `}</style>
      </div>
      { shareLink && (
        <Container>
          <p>Invite people to the room with this link</p>
          <div style={{fontSize: 36, display: 'flex', justifyContent: 'center'}}>
            <WhatsappShareButton style={{marginRight: 20}} url={shareLink} title={shareMessage}><RiWhatsappLine /></WhatsappShareButton>
            <TelegramShareButton style={{marginRight: 20}} url={shareLink} title={shareMessage}><RiTelegramLine /></TelegramShareButton>
            <CopyToClipboard text={shareLink}>
              <RiLinksFill style={{cursor: 'pointer'}} />
            </CopyToClipboard>
          </div>
        </Container>
      )}
    </>
  )
}

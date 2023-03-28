/* eslint-disable @next/next/no-img-element */
import { TonContext } from '@/services/ton/context'
import { Button, Modal, Row, Typography } from 'antd'
import { useContext, useState } from 'react'
import { QRCode } from 'react-qrcode-logo'
import { addReturnStrategy, isMobile, openLink } from '@/helpers/utils'
import styles from './style.module.css'

const { Text, Paragraph } = Typography

export const SelectWalletModal = ({ open, onClose }: any) => {
	const { connector, availableWallets } = useContext(TonContext)
	const [selectedWallet, setSelectedWallet] = useState<any>()
	const [universalLink, setUniversalLink] = useState('')

	const handleSelectWalletProvider = (wallet: any) => {
		if (!connector) return

		setSelectedWallet(wallet)

		if (wallet?.injected) {
			connector.connect({ jsBridgeKey: wallet.jsBridgeKey })

			return
		}

		if (wallet?.bridgeUrl) {
			const universalLink = connector.connect({
				universalLink: wallet.universalLink,
				bridgeUrl: wallet.bridgeUrl,
			})

			if (isMobile()) {
				openLink(addReturnStrategy(universalLink, 'back'), '_blank')
			} else {
				setUniversalLink(universalLink)
			}
		}
	}

	const handleClose = () => {
		onClose()
	}

	return (
		<Modal
			className={styles.walletsModal}
			footer={null}
			centered
			width={370}
			title={<div style={{ textAlign: 'center' }}>Select your wallet</div>}
			open={open}
			onOk={handleClose}
			onCancel={handleClose}
		>
			<Row justify="space-around">
				{availableWallets?.map((wallet) => (
					<Button
						key={wallet.name}
						className={styles.walletButton + ' ' + (wallet.name == selectedWallet?.name ? styles.selectedWallet : null)}
						type="text"
						style={{ height: 'auto' }}
						onClick={() => handleSelectWalletProvider(wallet)}
					>
						<img className={styles.walletImage} src={wallet.imageUrl} alt="" width={64} height={64} />
						<div>{wallet.name}</div>
					</Button>
				))}
			</Row>

			{selectedWallet?.name == 'Tonkeeper' && (
				<div style={{ marginTop: 16, textAlign: 'center' }}>
					<Paragraph>
						<Text>Scan the QR code with your phone&apos;s camera or Tonkeeper.</Text>
					</Paragraph>
					<div style={{ lineHeight: 0, display: 'inline-flex', justifyContent: 'center', overflow: 'hidden', borderRadius: '12px' }}>
						<QRCode
							size={256}
							eyeRadius={8}
							logoImage="/lectures-dapp-icon.png"
							value={universalLink}
							removeQrCodeBehindLogo={true}
							ecLevel="L"
							eyeColor="#2a3545"
							fgColor="#2a3545"
						/>
					</div>
					<Paragraph>
						<Text type="secondary">We neither receive nor store your wallet log-in details so your TON is safe.</Text>
					</Paragraph>
				</div>
			)}
		</Modal>
	)
}

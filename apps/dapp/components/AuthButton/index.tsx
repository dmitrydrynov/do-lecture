/* eslint-disable @next/next/no-img-element */
import React, { useContext, useEffect, useState } from 'react'
import { addReturnStrategy, isMobile, openLink } from '@/helpers/utils'
import { useSlicedAddress } from '@/hooks/useSlicedAddress'
import { TonContext } from '@/services/ton/context'
import { DownOutlined } from '@ant-design/icons'
import { Button, Dropdown, Modal, Row, Space, Typography } from 'antd'
import { useRouter } from 'next/router'
import { QRCode } from 'react-qrcode-logo'
import styles from './style.module.css'

const { Text, Paragraph } = Typography

export const AuthButton = () => {
	const router = useRouter()
	const { connector, availableWallets, userWallet, network } = useContext(TonContext)
	const [selectWalletModal, setSelectWalletModal] = useState(false)
	const [universalLink, setUniversalLink] = useState('')
	const [selectedWallet, setSelectedWallet] = useState<any>()

	const address = useSlicedAddress(userWallet?.account.address, network)

	useEffect(() => {
		if (connector?.connected) {
			setUniversalLink('')
			setSelectWalletModal(false)
		}
	}, [connector, userWallet])

	const handleClose = () => {
		setSelectWalletModal(false)
	}

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
				openLink(addReturnStrategy(universalLink, 'none'), '_blank')
			} else {
				setUniversalLink(universalLink)
			}
		}
	}

	const handleDisconnect = async () => {
		if (connector?.connected) {
			await fetch('/api/auth/logout')
			await connector.disconnect()
			await router.push('/')
		}
	}

	return (
		<>
			<div className="auth-button" style={{ display: 'flex', justifyContent: 'flex-end' }}>
				{userWallet ? (
					<Space>
						<Dropdown
							menu={{
								onClick: handleDisconnect,
								items: [
									{
										label: 'Disconnect',
										key: '1',
									},
								],
							}}
						>
							<Button type="primary" size="large">
								<Space>
									{address}
									<DownOutlined />
								</Space>
							</Button>
						</Dropdown>
					</Space>
				) : (
					<Button type="primary" size="large" onClick={() => setSelectWalletModal(true)}>
						Connect TON
					</Button>
				)}
			</div>

			<Modal
				className={styles.walletsModal}
				footer={null}
				width={370}
				title={<div style={{ textAlign: 'center' }}>Select your wallet</div>}
				open={selectWalletModal}
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
		</>
	)
}

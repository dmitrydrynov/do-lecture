/* eslint-disable @next/next/no-img-element */
import React, { useContext, useEffect, useState } from 'react'
import { addReturnStrategy, isMobile, openLink } from '@/helpers/utils'
import { useSlicedAddress } from '@/hooks/useSlicedAddress'
import { TonContext } from '@/services/ton/context'
import { DownOutlined } from '@ant-design/icons'
import { Button, Dropdown, Modal, Row, Space, Typography } from 'antd'
import { QRCode } from 'react-qrcode-logo'
import styles from './style.module.scss'

type TelegramUser = Readonly<{
	auth_date: number
	first_name: string
	last_name?: string | undefined
	hash: string
	id: number
	photo_url?: string | undefined
	username?: string | undefined
}>

const { Text, Paragraph } = Typography

export const AuthButton = ({ onChange = () => {} }: any) => {
	const { connector, availableWallets, userWallet, network, universalLink, setUniversalLink } = useContext(TonContext)
	const [selectWalletModal, setSelectWalletModal] = useState(false)
	// const [universalLink, setUniversalLink] = useState('')
	const [selectedWallet, setSelectedWallet] = useState<any>()
	const [telegramUser, setTelegramUser] = useState<TelegramUser>()

	const address = useSlicedAddress(userWallet?.account.address, network)

	useEffect(() => {
		if (connector?.connected) {
			setUniversalLink(undefined)
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
			onChange()
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

			onChange()
		}
	}

	const handleDisconnect = async () => {
		if (connector?.connected) {
			await fetch('/api/auth/logout')
			onChange()
			await connector.disconnect()
		}
	}

	return (
		<>
			<div className="auth-button" style={{ display: 'flex', justifyContent: 'flex-end' }}>
				{userWallet ? (
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
				) : (
					<Button type="primary" size="large" onClick={() => setSelectWalletModal(true)} className={styles.authButton} icon={<span className="icon-app icon-app-ton"></span>}>
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

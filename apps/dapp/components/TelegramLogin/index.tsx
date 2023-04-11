import { Button, Dropdown, Space, Typography } from 'antd'
import styles from './style.module.scss'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import crypto from 'crypto'
import Image from 'next/image'
import { useUserContext } from '@/contexts/user'
import { DownOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography

export const TelegramLogin = ({ onChange = () => {} }: any) => {
	const router = useRouter()
	const [loginWindow, setLoginWindow] = useState<Window | null>()
	let { user, refreshUser } = useUserContext()

	const handleTelegramLogin = () => {
		const url = new URL(
			'https://oauth.telegram.org/auth?' +
				new URLSearchParams({
					bot_id: '5646232415',
					origin: process.env.NEXT_PUBLIC_APP_URL as string,
					request_access: 'write',
					return_to: process.env.NEXT_PUBLIC_APP_URL as string,
					embed: '0',
				})
		)

		if (loginWindow == null || loginWindow.closed) {
			const top = Math.round(screen.height * 0.1)
			const left = Math.round((screen.width - 560) / 2)
			const newWindow = window.open(
				url,
				'telegramLoginWindow',
				`toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=560,height=480,top=${top},left=${left}`
			)
			setLoginWindow(newWindow)
		} else {
			loginWindow.focus()
		}
	}

	const handleLogout = async () => {
		if (user.telegram.id) {
			await fetch('/api/auth/logout')
			user = undefined
			onChange()
		}
	}

	return (
		<div className="auth-button" style={{ display: 'flex', justifyContent: 'flex-end' }}>
			{user ? (
				<Dropdown
					trigger={['click']}
					menu={{
						onClick: handleLogout,
						items: [
							{
								label: 'Logout',
								key: 'tg-logout',
							},
						],
					}}
				>
					<Button type="primary" size="large" className={styles.telegramButton} >
						<Space align="center">
							<Paragraph style={{ textAlign: 'left', lineHeight: 0, margin: 0 }}>
								<Text style={{ lineHeight: 1 }}>{user.telegram.firstName}</Text>
								<br />
								<Text type="secondary" style={{ fontSize: 11, fontWeight: 100 }}>
									Telegram account
								</Text>
							</Paragraph>
							<DownOutlined />
						</Space>
					</Button>
				</Dropdown>
			) : (
				<Button size="large" type="primary" onClick={handleTelegramLogin} className={styles.telegramButton} icon={<span className="icon-app icon-app-telegram"></span>}>
					Connect Telegram
				</Button>
			)}
		</div>
	)
}

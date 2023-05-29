import { Button, Dropdown, Space, Typography } from 'antd'
import styles from './style.module.scss'
import { useState } from 'react'
import { useUserContext } from '@/contexts/user'
import { DownOutlined } from '@ant-design/icons'
import { TelegramWidget } from '@/helpers/telegram/widget'
import { fetcher } from '@/helpers/fetcher'

const { Text, Paragraph } = Typography

export const TelegramLogin = ({ onLogin = (user: any) => {}, onLogout = () => {} }: any) => {
	const { user, refreshSession } = useUserContext()
	const [isLoading, setIsLoading] = useState(false)
	const [popup, setPopup] = useState<Window>()

	const handleLogin = async () => {
		if (!isLoading) {
			const widget = new TelegramWidget('5646232415', true)
			widget.auth(callbackOnLogin, setIsLoading)
			setPopup(widget.popup.window!)
		} else if (popup) {
			popup.focus()
		}
	}

	const callbackOnLogin = async (data: any) => {
		try {
			await fetcher(['/api/auth/login', data])
			await refreshSession()
			await onLogin()
		} catch (e: any) {
			console.error(e)
		}
	}

	const handleLogout = async () => {
		if (user?.telegram?.id) {
			await fetch('/api/auth/logout')
			await refreshSession()
			await onLogout()
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
					<Button type="primary" size="large" className={styles.telegramButton}>
						<Space align="center">
							<Paragraph style={{ textAlign: 'left', lineHeight: 0, margin: 0 }}>
								<Text style={{ lineHeight: 1 }}>{user?.telegram?.firstName || user?.telegram?.id}</Text>
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
				<Button size="large" type="primary" onClick={handleLogin} className={styles.telegramButton} icon={<span className="icon-app icon-app-telegram"></span>}>
					Connect Telegram
				</Button>
			)}
		</div>
	)
}

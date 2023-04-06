import { Button } from 'antd'
import styles from './style.module.scss'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import crypto from 'crypto'

export const TelegramLogin = () => {
	const router = useRouter()
	const [loginWindow, setLoginWindow] = useState<Window | null>()

	useEffect(() => {
		const { username, hash } = router.query
		if (!hash) return

		validate(router.query).then((logged) => {
			if (logged) console.log('Logged as ' + username)
		})
	}, [router])

	const validate = async (data: any) => {
		const secretKey = crypto
			.createHash('sha256')
			.update(process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN as string)
			.digest()
		const dataCheckString = Object.keys(data)
			.filter((key) => key !== 'hash')
			.map((key) => `${key}=${data[key]}`)
			.sort()
			.join('\n')
		const check_hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

		return check_hash == data.hash
	}

	const handleTelegramLogin = () => {
		const url = new URL(
			'https://oauth.telegram.org/auth?' +
				new URLSearchParams({
					bot_id: '5646232415',
					origin: process.env.NEXT_PUBLIC_APP_URL as string,
					request_access: 'write',
					return_to: process.env.NEXT_PUBLIC_APP_URL as string,
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

	return (
		<Button size="large" type="primary" onClick={handleTelegramLogin} className={styles.telegramButton} icon={<span className="icon-app icon-app-telegram"></span>}>
			Connect Telegram {router.query.username}
		</Button>
	)
}

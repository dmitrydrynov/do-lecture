/**
 * Docs page https://telegram-bot-sdk.readme.io/reference/sendmessage
 * Telegram Bot API Docs https://core.telegram.org/bots/api#formatting-options
 */
import crypto from 'crypto'
import dayjs from 'dayjs'

export default class TelegramService {
	private apiUrl: string

	private constructor({ botToken }: any) {
		this.apiUrl = `https://api.telegram.org/bot${botToken}`
	}

	static init() {
		const botToken = process.env.TELEGRAM_BOT_TOKEN as string
		return new TelegramService({ botToken })
	}

	async sendMessage({
		chatId,
		topicId,
		message,
		options,
		entities,
	}: {
		chatId: number
		topicId?: number
		message: string
		options?: Record<string, any>
		entities?: Record<string, any>[]
	}) {
		let body: any = {
			chat_id: chatId,
			message_thread_id: topicId || undefined,
			parse_mode: 'HTML',
			disable_notification: process.env.TELEGRAM_DISABLE_NOTIFICATIONS == '1',
			text: message, //1-4096 characters
			entities,
		}

		if (options) {
			body.reply_markup = options
		}

		try {
			const res = await fetch(`${this.apiUrl}/sendMessage`, {
				method: 'post',
				body: JSON.stringify(body),
				headers: {
					accept: 'application/json',
					'content-type': 'application/json',
				},
			})

			if (!res.ok) throw new Error('Telegram sendMessage response is wrong')

			console.log('Message successfully send.')
		} catch (error: any) {
			console.log(error)
		}
	}

	async sendPhoto({ chatId, topicId, url, message }: { chatId: number; topicId?: number; url: string; message?: string }) {
		const body = JSON.stringify({
			chat_id: chatId,
			message_thread_id: topicId || undefined,
			photo: url,
			caption: message, //0-1024 characters
			parse_mode: 'HTML',
			disable_notification: process.env.TELEGRAM_DISABLE_NOTIFICATIONS == '1',
		})

		try {
			const res = await fetch(`${this.apiUrl}/sendPhoto`, {
				method: 'post',
				body: body,
				headers: {
					accept: 'application/json',
					'content-type': 'application/json',
				},
			})

			if (!res.ok) throw new Error('Telegram sendMessage response is wrong')

			console.log('Message successfully send.')
		} catch (error: any) {
			console.log(error)
		}
	}

	static verifyAuthorization = (data: any) => {
		if (dayjs().diff(dayjs(data.auth_date * 1000), 'milliseconds') > 86400000) {
			throw Error('Authorization data is outdated')
		}

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
}

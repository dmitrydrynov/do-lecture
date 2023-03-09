import { NextApiRequest, NextApiResponse } from 'next'
import TelegramService from '../../../services/telegram'

// https://core.telegram.org/bots/api#message
type TelegramMessage = {
	[key: string]: any
	date: number
	text: string
	message_id: number
	message_thread_id?: number
	is_topic_message?: boolean
	from: {
		[key: string]: any
		username: string
		is_bot: boolean
		first_name: string
	}
	chat: {
		[key: string]: any
		id: number
		username: string
		type: 'private'
	}
	entities: {
		[key: string]: any
		type: 'hashtag' | 'bot_command' | 'mention' | 'cashtag' | 'url' | 'email' | any
	}
}

type TelegramUpdate = {
	[key: string]: any
	update_id: number
	message?: TelegramMessage
	channel_post?: TelegramMessage
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST' || req.headers['x-telegram-bot-api-secret-token'] !== 'secret_token') throw new Error('Forbidden request')

	try {
		const { message, callback_query, inline_query, ...otherParams }: TelegramUpdate = req.body
		const telegramService = await TelegramService.init()

		console.log('webhook', message, callback_query, inline_query, otherParams)

		if (message?.text === '/menu' && message.entities[0].type === 'bot_command') {
			await telegramService.sendMessage({
				chatId: message.chat.id,
				message: 'Menu',
				options: {
					inline_keyboard: [
						[
							{
								text: 'Add new paid lecture',
								switch_inline_query: 'command1',
							},
						],
					],
				},
			})
		}

		res.end()
	} catch (error: any) {
		res.json({ success: false, error: error.message })
	}
}

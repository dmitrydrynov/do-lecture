import { createUser, findUserByHash, findUserByTelegramId } from './airtable'
import TelegramService from './telegram'

export default class Api {
	static loginByHash = async (hash: string) => {
		try {
			let user: any

			user = await findUserByHash({ hash })

			if (!user) {
				user = await createUser({ hash })
			}

			return user
		} catch (e: any) {
			throw e
		}
	}

	static loginByTelegram = async (data: any) => {
		try {
			const tgValidated = TelegramService.verifyAuthorization(data)

			if (!tgValidated) return false

			let user = await findUserByTelegramId(data.id)

			if (!user) {
				user = await createUser({ telegramId: data.id, telegramName: data.first_name, telegramUsername: data.username, telegramPhoto: data.photo_url })
			}

			return user
		} catch (e: any) {
			throw e
		}
	}
}

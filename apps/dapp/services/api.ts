import { createUser, findUserByHash, findUserByTelegramId } from './airtable'

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

	static loginByTelegram = async (data: Record<string, any>) => {
		try {
			let user: any

      console.log(data)

			user = await findUserByTelegramId(data.telegramId)

			if (!user) {
				user = await createUser({ telegramId: data.id })
			}

			return user
		} catch (e: any) {
			throw e
		}
	}
}

import { createUser, findUserByHash } from '@/services/airtable'
import Api from '@/services/api'
import { sessionOptions } from 'config/sessions'
import { withIronSessionApiRoute } from 'iron-session/next'
import type { NextApiRequest, NextApiResponse } from 'next'

export default withIronSessionApiRoute(handler, sessionOptions)

async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		let user: any
		const data = req.body

		if (req.method !== 'POST' || !data) return res.status(403).end()

		/** check telegram auth */
		if (data?.hash) {
			user = await Api.loginByTelegram(data)
		}

		if (!user) {
			/** check TON auth */
			user = await findUserByHash({ hash: data.hash })

			if (!user) {
				user = await createUser({ hash: data.hash })
			}
		}

		/** Init new user session */
		req.session.user = {
			...req.session.user,
			id: user.id,
			telegram: {
				id: user.telegramId,
				username: user.telegramUsername,
				firstName: user.telegramName,
			},
		}
		await req.session.save()

		res.send({ id: user.id, telegram: { username: user.username, firstName: user.telegramName, id: user.telegramId } })
	} catch (error: any) {
		res.status(502).json({ error: error.message || 'Something wrong' })
	}
}

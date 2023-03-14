import { defaultCookie } from 'config/cookie'
import { withIronSessionApiRoute } from 'iron-session/next'
import type { NextApiRequest, NextApiResponse } from 'next'
import { createUser, findUserByHash } from '@/services/airtable'

export default withIronSessionApiRoute(async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		const { hash } = JSON.parse(req.body)
		let user: any

		if (req.method !== 'POST' || !hash) return res.status(403).end()

		user = await findUserByHash({ hash })

		if (!user) {
			user = await createUser({ hash })
		}

		req.session.user = {
			id: user.id,
		}
		await req.session.save()

		res.send({ id: user.id, username: user.username, telegramName: user.telegramName })
	} catch (error: any) {
		res.status(502).json({ error: error.message || 'Something wrong' })
	}
}, defaultCookie)

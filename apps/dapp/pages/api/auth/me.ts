import { createUser, findUserByHash } from '@/services/airtable'
import { sessionOptions } from 'config/sessions'
import { withIronSessionApiRoute } from 'iron-session/next'
import type { NextApiRequest, NextApiResponse } from 'next'

export default withIronSessionApiRoute(handler, sessionOptions)

async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		if (!req.session.user) return res.send({ user: null })

		return res.json({ user: req.session.user })
	} catch (error: any) {
		res.status(502).json({ error: error.message || 'Something wrong' })
	}
}

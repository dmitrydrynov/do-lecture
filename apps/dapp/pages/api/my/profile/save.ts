import { saveUserProfile } from '@/services/airtable'
import { sessionOptions } from 'config/sessions'
import { withIronSessionApiRoute } from 'iron-session/next'
import type { NextApiRequest, NextApiResponse } from 'next'

export default withIronSessionApiRoute(handler, sessionOptions)

async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		if (req.method !== 'POST' || !req.session.user?.id) return res.status(503).end()

		await saveUserProfile(req.session.user.id, req.body)

		return res.status(200).end()
	} catch (error: any) {
		console.error(error)
		return res.status(502).json({ error: error.message || 'Something wrong' })
	}
}

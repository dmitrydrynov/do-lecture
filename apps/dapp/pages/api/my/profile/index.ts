import { checkUserProfile, getUserProfile } from '@/services/airtable'
import { initLectureContract } from '@/services/ton/provider'
import { defaultCookie } from 'config/cookie'
import { withIronSessionApiRoute } from 'iron-session/next'
import type { NextApiRequest, NextApiResponse } from 'next'

export default withIronSessionApiRoute(async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		if (req.method !== 'POST' || !req.session?.user?.id) return res.status(503).end()

		let profile = await getUserProfile(req.session.user.id)

		res.status(200).json(profile)
	} catch (error: any) {
		console.error(error)
		res.status(502).json({ error: error.message || 'Something wrong' })
	}
}, defaultCookie)

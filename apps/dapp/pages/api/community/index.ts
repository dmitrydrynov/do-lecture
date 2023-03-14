import { defaultCookie } from 'config/cookie'
import { withIronSessionApiRoute } from 'iron-session/next'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getCommunity } from '@/services/airtable'

export default withIronSessionApiRoute(async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		if (req.method !== 'POST' || !req.session?.user?.id) return res.status(503).end()

		const community = await getCommunity('recEIvc3t5NFfEmLL')

		res.status(200).json(community)
	} catch (error: any) {
		res.status(502).json({ error })
	}
}, defaultCookie)

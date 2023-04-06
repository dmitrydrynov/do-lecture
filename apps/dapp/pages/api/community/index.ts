import { getCommunityByName } from '@/services/airtable'
import { sessionOptions } from 'config/sessions'
import { withIronSessionApiRoute } from 'iron-session/next'
import type { NextApiRequest, NextApiResponse } from 'next'

export default withIronSessionApiRoute(handler, sessionOptions)

async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		const { name } = req.body
		if (req.method !== 'POST' || !name) return res.status(503).end()

		const community = await getCommunityByName(name)

		res.status(200).json(community)
	} catch (error: any) {
		res.status(502).json({ error })
	}
}

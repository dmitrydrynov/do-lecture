import { getSettings } from '@/services/airtable'
import { sessionOptions } from 'config/sessions'
import { withIronSessionApiRoute } from 'iron-session/next'
import type { NextApiRequest, NextApiResponse } from 'next'

export default withIronSessionApiRoute(async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		if (req.method !== 'POST') return res.status(503).end()

		const settings = await getSettings()

		res.status(200).json(settings)
	} catch (error: any) {
		res.status(502).json({ error: error.message || 'Something wrong' })
	}
}, sessionOptions)

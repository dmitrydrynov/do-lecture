import { deleteDraftLecture } from '@/services/airtable'
import { sessionOptions } from 'config/sessions'
import { withIronSessionApiRoute } from 'iron-session/next'
import type { NextApiRequest, NextApiResponse } from 'next'

export default withIronSessionApiRoute(handler, sessionOptions)

async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		const { id } = req.body
		if (req.method !== 'POST' || !id || !req.session.user?.id) return res.status(503).end()

		await deleteDraftLecture(id)

		return res.status(200).json({ success: true })
	} catch (error: any) {
		res.status(502).json({ success: false, error })
	}
}

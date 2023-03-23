import type { NextApiRequest, NextApiResponse } from 'next'
import { deleteDraftLecture } from '@/services/airtable'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		const { id } = req.body
		if (req.method !== 'POST' || !id) return res.status(503).end()

		await deleteDraftLecture(id)

		return res.status(200).json({ success: true })
	} catch (error: any) {
		res.status(502).json({ success: false, error })
	}
}

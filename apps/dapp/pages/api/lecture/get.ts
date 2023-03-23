import { deleteDraftLecture, getLecture } from '@/services/airtable'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		const { id } = req.body
		if (req.method !== 'POST' || !id) return res.status(503).end()

		const response = await getLecture(id)

		return res.status(200).json(response)
	} catch (error: any) {
		res.status(502).json({ success: false, error })
	}
}

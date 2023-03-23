import type { NextApiRequest, NextApiResponse } from 'next'
import { cancelLecture } from '@/services/airtable'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		if (req.method !== 'POST') return res.status(503).end()

		const { id } = req.body

		await cancelLecture(id)

		return res.status(200).json({ success: true })
	} catch (error: any) {
		res.status(502).json({ success: false, error })
	}
}

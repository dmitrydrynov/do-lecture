import { getAvaibleCommunities } from '@/services/airtable'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		if (req.method !== 'POST') return res.status(503).end()

		let communities = await getAvaibleCommunities()

		res.status(200).json(communities)
	} catch (error: any) {
		console.log('[API ERROR]', error)
		res.status(502).json({ error: error.message || 'Something wrong' })
	}
}

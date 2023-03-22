import { defaultCookie } from 'config/cookie'
import { withIronSessionApiRoute } from 'iron-session/next'
import type { NextApiRequest, NextApiResponse } from 'next'
import { createLecture } from '@/services/airtable'

export default withIronSessionApiRoute(async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		if (req.method !== 'POST' || !req.session?.user?.id) return res.status(503).end()

		const { contractAddress, date, price, description, title, duration, isDraft, community } = req.body

		const lecture = await createLecture({
			title,
			description,
			lecturerId: req.session.user.id,
			date,
			duration,
			status: isDraft ? 'draft' : 'published',
			stage: 'funding',
			contractAddress: (contractAddress as string) || '',
			price: (price as number) || 0,
			community,
		})

		res.status(200).json({ lecture })
	} catch (error: any) {
		res.status(502).json({ error })
	}
}, defaultCookie)

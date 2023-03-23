import { saveLecture } from '@/services/airtable'
import { defaultCookie } from 'config/cookie'
import { withIronSessionApiRoute } from 'iron-session/next'
import type { NextApiRequest, NextApiResponse } from 'next'

export default withIronSessionApiRoute(async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		const { isDraft, ...data } = req.body

		if (req.method !== 'POST' || !req.session?.user?.id || !data) return res.status(503).end()

		const lecture = await saveLecture({
			...data,
			lecturerId: req.session.user.id,
			status: isDraft ? 'draft' : 'published',
			stage: isDraft ? 'preparation' : 'funding',
			contractAddress: data.contractAddress || '',
			price: (data.price as number) || 0,
			community: Array.isArray(data.community) ? data.community[0] : data.community,
		})

		res.status(200).json({ lecture })
	} catch (error: any) {
		res.status(502).json({ error })
	}
}, defaultCookie)

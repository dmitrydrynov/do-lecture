import { createLecture } from '@/services/airtable'
import { withIronSessionApiRoute } from 'iron-session/next'
import type { NextApiRequest, NextApiResponse } from 'next'

export default withIronSessionApiRoute(
	async function handler(req: NextApiRequest, res: NextApiResponse) {
		try {
			if (req.method !== 'POST' || !req.session?.user?.id) return res.status(503).end()

			const { contractAddress, date, price, description, title, duration, isDraft } = req.body

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
			})

			res.status(200).json({ lecture })
		} catch (error: any) {
			res.status(502).json({ error })
		}
	},
	{
		cookieName: 'dolecture-cookie',
		password: process.env.JWT_SECRET as string,
		cookieOptions: {
			secure: process.env.NODE_ENV === 'production',
		},
	}
)

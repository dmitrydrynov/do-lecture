/* eslint-disable turbo/no-undeclared-env-vars */
import { defaultCookie } from 'config/cookie'
import { withIronSessionApiRoute } from 'iron-session/next'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Address } from 'ton'
import { getPaidLecturesByUser } from '@/services/airtable'
import { initLectureContract } from '@/services/ton/provider'
import dayjs from 'dayjs'

export default withIronSessionApiRoute(async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		if (req.method !== 'POST' || !req.session?.user?.id) return res.status(503).end()

		const response: any[] = []
		let meta = {}
		let lectures = await getPaidLecturesByUser(req.session.user.id, ['published', 'draft'])

		if (lectures?.length) {
			for (const l of lectures) {
				// if lecture is paid
				if (l.price && (l.price as number) > 0) {
					// for published only
					if (l.status == 'published') {
						const address = Address.parse(l.contractAddress as string)
						const contract = await initLectureContract(address)

						meta = await contract?.getData()
					}

					response.push({
						...l,
						meta: {
							...meta,
						},
					})
				}
				// else for free one
				else {
					response.push({
						...l,
						meta: { stage: l.stage },
					})
				}
			}
		}

		res.status(200).json(response)
	} catch (error: any) {
		res.status(502).json({ error: error.message || 'Something wrong' })
	}
}, defaultCookie)

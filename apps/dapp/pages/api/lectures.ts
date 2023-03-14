import { defaultCookie } from 'config/cookie'
import { withIronSessionApiRoute } from 'iron-session/next'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Address } from 'ton'
import { getFundingPaidLectures } from '@/services/airtable'
import { initLectureContract } from '@/services/ton'

export default withIronSessionApiRoute(async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		if (req.method !== 'POST') return res.status(503).end()

		const response: any[] = []
		let lectures = await getFundingPaidLectures()

		if (lectures) {
			for (const l of lectures) {
				if (l.price && (l.price as number) > 0) {
					const address = Address.parse(l.contractAddress as string)
					const contract = await initLectureContract(address)

					if (!contract) continue

					const meta = await contract.getData()
					// const stage = await contract.getStage()

					response.push({
						...l,
						meta: {
							...meta,
							// stage,
						},
					})
				} else {
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

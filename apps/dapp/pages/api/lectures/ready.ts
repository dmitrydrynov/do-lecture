import { getLecturesByStage } from '@/services/airtable'
import { initLectureContract } from '@/services/ton/provider'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Address } from 'ton'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		if (req.method !== 'POST') return res.status(503).end()

		const response: any[] = []
		let lectures = await getLecturesByStage(['run-up', 'implementation'])

		if (lectures.length > 0) {
			for (const l of lectures) {
				if (l.price && l.price > 0) {
					const address = Address.parse(l.contractAddress as string)
					const contract = await initLectureContract(address)

					if (!contract) continue

					const meta = await contract.getData()

					response.push({
						...l,
						meta: {
							...meta,
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
		console.log('[API ERROR]', error)
		res.status(502).json({ error: error.message || 'Something wrong' })
	}
}

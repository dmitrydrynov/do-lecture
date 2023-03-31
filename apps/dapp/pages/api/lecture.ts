import { getLecture } from '@/services/airtable'
import { initLectureContract } from '@/services/ton/provider'
import { defaultCookie } from 'config/cookie'
import { withIronSessionApiRoute } from 'iron-session/next'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Address } from 'ton'

export default withIronSessionApiRoute(async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		if (req.method !== 'GET' || !req.query.id) return res.status(503).end()

		let response: Record<string, any>
		let lecture: any = await getLecture(req.query.id as string)

		if (!lecture) {
			throw new Error('Not found the lecture')
		}

		if (lecture.price && (lecture.price as number) > 0) {
			const address = Address.parse(lecture.contractAddress as string)
			const contract = await initLectureContract(address)

			if (!contract) {
				// throw new Error('Not found the lecture contract')
				return res.status(200).json({ ...lecture, meta: undefined })
			}

			const meta = await contract.getData()
			// const stage = await contract.getStage()

			response = {
				...lecture,
				meta: {
					...meta,
					// stage,
				},
			}
		} else {
			response = {
				...lecture,
				meta: { stage: lecture.stage },
			}
		}

		res.status(200).json(response)
	} catch (error: any) {
		res.status(502).json({ error: error.message || 'Something wrong' })
	}
}, defaultCookie)

import AirtableService from '@/services/airtable'
import { getLectureData } from '@/services/ton/provider'
import { sessionOptions } from 'config/sessions'
import { withIronSessionApiRoute } from 'iron-session/next'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Address } from 'ton'

export default withIronSessionApiRoute(handler, sessionOptions)

async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		const { lecturerId } = req.body
		if (req.method !== 'POST' || !lecturerId || !req.session.user?.id) return res.status(503).end()

		let lectures = await AirtableService('Lecture')
			.select({
				filterByFormula: `AND(lecturer = "${lecturerId}", status = "published")`,
				sort: [{ field: 'createdAt' }],
			})
			.all()

		const response = await Promise.all(
			lectures.map(async (l: any) => ({
				...l.fields,
				id: l.id,
				meta: l.fields.contractAddress ? await getLectureData(Address.parse(l.fields.contractAddress)) : null,
			}))
		)

		res.status(200).json({
			lectures: response,
		})
	} catch (error: any) {
		res.status(502).json({ error })
	}
}

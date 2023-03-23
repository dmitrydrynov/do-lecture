import dayjs from 'dayjs'
import { NextApiRequest, NextApiResponse } from 'next'
import { Address } from 'ton'
import AirtableService, { cancelLecture } from '@/services/airtable'
import { initLectureContract } from '@/services/ton/provider'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === 'POST') {
		try {
			const { authorization } = req.headers

			if (authorization === `Bearer ${process.env.API_SECRET_KEY}`) {
				const notRelevantlectures = await AirtableService('Lecture')
					.select({
						filterByFormula: `AND(status = "published", DATETIME_DIFF(date, "${dayjs().toISOString()}", 'hours') < 2)`,
						maxRecords: 200,
					})
					.all()

				if (notRelevantlectures.length == 0) {
					return res.status(200).json({ success: true })
				}

				for (const notRelevantlecture of notRelevantlectures) {
					const address = Address.parse(notRelevantlecture.fields.contractAddress as string)
					const contract = await initLectureContract(address)

					// if paid lecture
					if (contract) {
						const data = await contract.getLeftAndGoal()

						//  Cancel the lecture and return money
						if (data && data.left > 0) {
							await contract.sendTryStart()

							cancelLecture(notRelevantlecture.id)

							// CAN SEND MESSAGE FOR TEACHER AND OTHERS
						}
					} else {
						cancelLecture(notRelevantlecture.id)
					}
				}

				res.status(200).json({ success: true })
			} else {
				res.status(401).json({ success: false })
			}
		} catch (err: any) {
			res.status(500).json({ statusCode: 500, message: err.message })
		}
	} else {
		res.setHeader('Allow', 'POST')
		res.status(405).end('Method Not Allowed')
	}
}

import AirtableService, { cancelLecture, updateLectureStage } from '@/services/airtable'
import { getLectureStage, initLectureContract, tonApi } from '@/services/ton/provider'
import dayjs from 'dayjs'
import { NextApiRequest, NextApiResponse } from 'next'
import { Address } from 'ton'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === 'POST') {
		try {
			const { authorization } = req.headers

			if (authorization !== `Bearer ${process.env.API_SECRET_KEY}`) return res.status(401).end()

			const publishedLectures = await AirtableService('Lecture')
				.select({
					filterByFormula: `status = "published"`,
					maxRecords: 200,
				})
				.all()

			if (publishedLectures.length == 0) return res.status(200).json({ success: true })

			for (const publishedLecture of publishedLectures) {
				const provider = tonApi()
				const address = Address.parse(publishedLecture.fields.contractAddress as string)
				const lecture = await initLectureContract(address)
				const actualStage = await getLectureStage(address)

				if (actualStage !== publishedLecture.get('stage')) {

					if(actualStage == 'canceled') {
						await lecture?.sendTryStart()
					}

					if(actualStage == 'finished') {
						await lecture?.sendTryPayout()
					}

					await updateLectureStage(publishedLecture.id, actualStage)
				}
			}

			res.status(200).json({ success: true })
		} catch (err: any) {
			res.status(500).json({ statusCode: err.status || undefined, message: err.message })
		}
	} else {
		res.setHeader('Allow', 'POST')
		res.status(405).end('Method Not Allowed')
	}
}

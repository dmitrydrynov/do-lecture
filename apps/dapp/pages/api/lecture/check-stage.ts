import AirtableService, { cancelLecture, updateLectureStage } from '@/services/airtable'
import { getLectureStage } from '@/services/ton/provider'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Address } from 'ton-core'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		if (req.method !== 'POST') return res.status(503).end()

		const { id } = req.body

		const lecture = await AirtableService('Lecture').find(id)

		if (!lecture) throw Error('Dont find the lecture')

		const currentStage = await getLectureStage(Address.parse(lecture.get('contractAddress') as string))

		if (lecture.get('stage') !== currentStage) await updateLectureStage(id, currentStage)

		return res.status(200).json({ stage: currentStage })
	} catch (error: any) {
		res.status(502).json({ success: false, error })
	}
}

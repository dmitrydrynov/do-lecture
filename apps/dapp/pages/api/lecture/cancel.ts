import AirtableService, { cancelLecture } from '@/services/airtable'
import { initLectureContract, initServiceWallet } from '@/services/ton'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Address } from 'ton'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		if (req.method !== 'POST') return res.status(503).end()

		const { id } = req.body
		const { contract: serviceWallet, keyPair } = await initServiceWallet()
		const lecture = await AirtableService('Lecture').find(id)
		const address = Address.parse(lecture.fields.contractAddress as string)
		const contract = await initLectureContract(address)

		await cancelLecture(id)

		await contract?.sendCancel(serviceWallet.sender(keyPair.secretKey))

		return res.status(200).json({ success: true })
	} catch (error: any) {
		res.status(502).json({ success: false, error })
	}
}

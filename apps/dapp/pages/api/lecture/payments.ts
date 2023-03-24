import { getLectureContractAddress } from '@/services/airtable'
import { tonApi } from '@/services/ton/provider'
import { wrapper } from 'lecture-contract'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Address } from 'ton'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		const { lectureId } = req.body
		if (req.method !== 'POST' || !lectureId) return res.status(503).end()

		const contractAddress = await getLectureContractAddress(lectureId)

		const provider = tonApi()
		const contract = provider.open(wrapper.Lecture.createFromAddress(Address.parse(contractAddress)))
		const payments = await contract.getPayments()

		return res.status(200).json(payments.map((p) => ({ ...p, address: p.address.toString() })))
	} catch (error: any) {
		res.status(502).json({ success: false, error })
	}
}

import type { NextApiRequest, NextApiResponse } from 'next'
import { Address } from 'ton'
import { initLectureContract } from '@/services/ton'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		if (req.method !== 'POST') return res.status(503).end()

		const { contractAddress } = req.body

		const contract = await initLectureContract(Address.parse(contractAddress))
		const details: any = await contract?.getNetworkDetails()

		console.log('api', details)

		return res.status(200).json({
			success: details?.computePhase.success,
			exitCode: details?.computePhase.exitCode,
		})
	} catch (error: any) {
		res.status(502).json({ success: false, error })
	}
}

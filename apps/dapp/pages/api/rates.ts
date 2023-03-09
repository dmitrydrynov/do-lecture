import { CryptoPay } from '@foile/crypto-pay-api'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const { coins } = req.body

	if (req.method === 'POST') {
		try {
			const cryptoPay = new CryptoPay(process.env.CRYPTOBOT_TOKEN)
			const rates = await cryptoPay.getExchangeRates()
			const { rate } = rates.find((r: any) => r.source == 'TON' && r.target == 'USD')

			const exchangeAmount = coins * Number.parseFloat(rate)

			res.status(200).json({ fiat: exchangeAmount || 0, one: Number.parseFloat(rate) })
		} catch (err: any) {
			res.status(500).json({ statusCode: 500, message: err.message })
		}
	} else {
		res.setHeader('Allow', 'POST')
		res.status(405).end('Method Not Allowed')
	}
}

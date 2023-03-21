import { TonContext, useTonContext } from '@/contexts/ton-context'
import { tonClient } from '@/services/ton/provider'
import { Sender, SenderArguments } from 'ton-core'

export function useTonConnect() {
	const { connector } = useTonContext(TonContext)

	return {
		sender: {
			send: async (args: SenderArguments) => {
				connector?.sendTransaction({
					messages: [
						{
							address: args.to.toString(),
							amount: args.value.toString(),
							payload: args.body?.toBoc().toString('base64'),
						},
					],
					validUntil: Date.now() + 5 * 60 * 1000, // 5 minutes for user to approve
				})
			},
		} as Sender,
		provider: tonClient(),
		connected: connector?.connected,
		// "<wc>:<hex>"
		account: connector?.account,
	} 
}

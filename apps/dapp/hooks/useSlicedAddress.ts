import { useMemo } from 'react'
import { Address } from 'ton-core'

export function useSlicedAddress(address: string | null | undefined, network: 'mainnet' | 'testnet' = 'mainnet') {
	return useMemo(() => {
		if (!address) {
			return ''
		}

		const userFriendlyAddress = Address.parseRaw(address).toString()

		return userFriendlyAddress.slice(0, 4) + '...' + userFriendlyAddress.slice(-4)
	}, [address, network])
}

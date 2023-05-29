/* eslint-disable react-hooks/exhaustive-deps */
import { Dispatch, SetStateAction, createContext, useEffect, useState } from 'react'
import { TonConnectProvider } from '@/services/ton/provider'
import TonConnect, { CHAIN, TonConnectError, Wallet, WalletInfo } from '@tonconnect/sdk'
import { Address } from 'ton'
import { sha256 } from 'ton-crypto'

export type TonContextType = {
	connector?: TonConnect
	isConnected: boolean
	provider?: TonConnectProvider
	userWallet?: Wallet
	network?: 'testnet' | 'mainnet'
	availableWallets?: WalletInfo[]
	universalLink?: string
	setUniversalLink: Dispatch<SetStateAction<string | undefined>>
}

const networkName: { [key: string]: 'testnet' | 'mainnet' } = {
	[CHAIN.MAINNET]: 'mainnet',
	[CHAIN.TESTNET]: 'testnet',
}

export const TonContext = createContext<TonContextType>({ isConnected: false, setUniversalLink: () => {} })

export const useTonContext = ({ onConnectError }: any) => {
	const [connector, setConnector] = useState<TonConnect>()
	const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>()
	const [userWallet, setUserWallet] = useState<Wallet>()
	const [network, setNetwork] = useState<'testnet' | 'mainnet'>()
	const [user, setUser] = useState()
	const [provider, setProvider] = useState<TonConnectProvider>()
	const [universalLink, setUniversalLink] = useState<string>()

	useEffect(() => {
		const connector = new TonConnect({
			manifestUrl: process.env.NEXT_PUBLIC_APP_URL + '/tonconnect-manifest.json',
		})

		connector.onStatusChange(handleStatusChange, handleError)
		connector.restoreConnection()

		setConnector(connector)
	}, [])

	useEffect(() => {
		if (!connector) return

		const p = new TonConnectProvider(connector, network, universalLink)
		setProvider(p)

		connector.getWallets().then((list) => {
			const actualForApp = ['Tonkeeper', 'OpenMask', 'MyTonWallet']
			setAvailableWallets(
				list.filter((w: any) => {
					if (!w.bridgeUrl && !w.injected) {
						return false
					}

					return actualForApp.includes(w.name)
				})
			)
		})
	}, [connector, network])

	const handleError = async (error: TonConnectError) => {
		onConnectError(error)
	}

	const handleStatusChange = async (wallet?: any) => {
		if (!wallet) {
			setUserWallet(undefined)
			return
		}

		console.log('handleStatusChange', wallet)

		const walletAdress = Address.parseRaw(wallet.account.address).toString()

		if (!user) {
			const walletAddressHash: Buffer = await sha256(walletAdress)

			const reponse = await fetch('/api/auth/login', {
				method: 'post',
				body: JSON.stringify({ hash: walletAddressHash.toString('hex') }),
			})

			const userData = await reponse.json()
			console.log('userData', userData)

			setUser(userData)
		}

		setUserWallet(wallet)
		setNetwork(networkName[wallet.account.chain])

		console.log(`Connected to wallet [${walletAdress}]`)
	}

	return { connector, isConnected: connector ? connector?.connected : false, provider, availableWallets, userWallet, network, user, universalLink, setUniversalLink }
}

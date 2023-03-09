/* eslint-disable react-hooks/exhaustive-deps */
import { createContext, useEffect, useState } from 'react'
import TonConnect, { CHAIN, TonConnectError, Wallet, WalletInfo } from '@tonconnect/sdk'
import { Address } from 'ton'
import { sha256 } from 'ton-crypto'

export type TonContextType = {
	connector?: TonConnect
	userWallet?: Wallet
	network?: 'testnet' | 'mainnet'
	availableWallets?: WalletInfo[]
}

const networkName: { [key: string]: 'testnet' | 'mainnet' } = {
	[CHAIN.MAINNET]: 'mainnet',
	[CHAIN.TESTNET]: 'testnet',
}

export const TonContext = createContext<TonContextType>({})

export const useTonContext = ({ onConnectError }: any) => {
	const [connector, setConnector] = useState<TonConnect>()
	const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>()
	const [userWallet, setUserWallet] = useState<Wallet>()
	const [network, setNetwork] = useState<'testnet' | 'mainnet'>()
	const [user, setUser] = useState()

	useEffect(() => {
		console.log('state', { connector, availableWallets, userWallet, network })
	}, [connector, availableWallets, userWallet, network])

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
	}, [connector])

	const handleError = async (error: TonConnectError) => {
		onConnectError(error)
	}

	const handleStatusChange = async (wallet?: any) => {
		console.log('handleStatusChange', wallet)

		if (!wallet) {
			setUserWallet(undefined)
			return
		}

		const walletAdress = Address.parseRaw(wallet.account.address).toString()
		const walletAddressHash: Buffer = await sha256(walletAdress)

		const reponse = await fetch('/api/auth/login', {
			method: 'post',
			body: JSON.stringify({ hash: walletAddressHash.toString('hex') }),
		})

		const userData = await reponse.json()
		console.log('userData', userData)

		setUser(userData)
		setUserWallet(wallet)
		setNetwork(networkName[wallet.account.chain])

		console.log(`Connected to wallet [${walletAdress}]`)
	}

	return { connector, availableWallets, userWallet, network, user }
}

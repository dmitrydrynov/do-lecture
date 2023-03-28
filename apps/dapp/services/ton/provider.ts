import { addReturnStrategy, isMobile, openLink } from '@/helpers/utils'
import {
	TonConnect,
	UserRejectsError,
	UnknownError,
	BadRequestError,
	WalletAlreadyConnectedError,
	ParseHexError,
	UnknownAppError,
	FetchWalletsError,
	WrongAddressError,
	WalletNotInjectedError,
	WalletNotConnectedError,
	LocalstorageNotFoundError,
} from '@tonconnect/sdk'
import dayjs from 'dayjs'
import { wrapper } from 'lecture-contract'
import { Address, beginCell, Cell, Contract, Sender, SenderArguments, StateInit, storeStateInit, TonClient } from 'ton'

const { Lecture } = wrapper

export const tonApi = () => {
	const isTestnet = process.env.NEXT_PUBLIC_IS_TESTNET == 'true'
	const endpoint = isTestnet ? 'https://testnet.toncenter.com/api/v2/jsonRPC' : 'https://toncenter.com/api/v2/jsonRPC'

	return new TonClient({
		endpoint,
		apiKey: isTestnet ? (process.env.NEXT_PUBLIC_TON_TESTNET_APIKEY as string) : (process.env.NEXT_PUBLIC_TON_MAINNET_APIKEY as string),
	})
}

export const initLectureContract = async (address: Address) => {
	const provider = tonApi()
	const contract = Lecture.createFromAddress(address)
	const openedContract = provider.open(contract)
	const contractState = await provider.getContractState(address)

	return contractState.state == 'active' ? openedContract : null
}

// export const initServiceWallet = async (workchain = 0) => {
// 	const provider = tonProvider()
// 	const serviceMnemonics = process.env.SERVICE_WALLET_MNEMONIC as string
// 	let keyPair = await mnemonicToPrivateKey(serviceMnemonics.split(' '))
// 	let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey })
// 	let contract = provider.open(wallet)

// 	return { contract, keyPair }
// }

// export const initManagerWallet = async (workchain = 0) => {
// 	const provider = tonProvider()
// 	const managerMnemonics = process.env.MANAGER_WALLET_MNEMONIC as string
// 	let keyPair = await mnemonicToPrivateKey(managerMnemonics.split(' '))
// 	let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey })
// 	let contract = provider.open(wallet)

// 	return { contract, keyPair }
// }

export const getLectureData = async (lectureAddress: Address) => {
	const lecture = await initLectureContract(lectureAddress)

	return await lecture?.getData()
}

export const getLectureStage = async (lectureAddress: Address) => {
	const lecture = await initLectureContract(lectureAddress)
	const data = await lecture?.getData()
	const lectureDate = dayjs(data.startTime * 1000)
	const nowDate = dayjs()
	const diff = nowDate.diff(lectureDate, 'h')
	let actualStage = 'funding'

	// funding period
	if (diff < -2) {
		actualStage = 'funding'

		if (data.left <= 0) actualStage = 'run-up'
	}

	// if wasn't funded
	if (diff >= -2 && data.left > 0) {
		actualStage = 'canceled'
	}

	// if funded
	if (data.left <= 0) {
		// run-up period
		if (diff >= -2 && diff < 0) {
			actualStage = 'run-up'
		}

		// implementation period
		if (diff >= 0 && diff < data.duration / 3600) {
			actualStage = 'implementation'
		}

		// completing period
		if (diff > data.duration / 3600 && diff <= data.duration / 3600 + 2) {
			actualStage = 'completing'
		}

		// finished period
		if (diff > data.duration / 3600 + 2) {
			actualStage = 'finished'
		}
	}

	return actualStage
}

export class TonConnectProvider {
	connector: TonConnect
	network: string
	universalLink?: string

	constructor(connector: TonConnect, network = 'mainnet', universalLink?: string) {
		this.connector = connector
		this.network = network
		this.universalLink = universalLink
	}

	async getNetwork() {
		return this.network
	}

	private api() {
		const endpoint = this.network == 'testnet' ? 'https://testnet.toncenter.com/api/v2/jsonRPC' : 'https://toncenter.com/api/v2/jsonRPC'
		return new TonClient({
			endpoint,
			apiKey: this.network == 'testnet' ? (process.env.NEXT_PUBLIC_TON_TESTNET_APIKEY as string) : (process.env.NEXT_PUBLIC_TON_MAINNET_APIKEY as string),
		})
	}

	sender() {
		const sender: Sender = {
			address: this.connector.account ? Address.parseRaw(this.connector.account.address) : undefined,
			send: async (args: SenderArguments) => {
				if (['iphone', 'ipad', 'android'].includes(this.connector.wallet?.device?.platform || '') && this.universalLink) {
					openLink(addReturnStrategy(this.universalLink, 'back'), '_blank')
				}

				try {
					const stateInitCell = args.init
						? beginCell()
								.store(storeStateInit(args.init as StateInit))
								.endCell()
						: undefined

					await this.connector.sendTransaction({
						messages: [
							{
								address: args.to.toString(),
								amount: args.value.toString(),
								payload: args.body?.toBoc().toString('base64'),
								stateInit: stateInitCell?.toBoc().toString('base64'),
							},
						],
						validUntil: Date.now() + 5 * 60 * 1000, // 5 minutes for user to approve
					})
				} catch (e) {
					if (e instanceof UserRejectsError) throw Error('Canceled by the user')
					if (e instanceof UnknownError) throw Error('Unknown error')
					if (e instanceof BadRequestError) throw Error('Bad request. The request to the wallet contains errors')
					if (e instanceof WalletAlreadyConnectedError)
						throw Error('Wallet connection called but wallet already connected. To avoid the error, disconnect the wallet before doing a new connection.')
					if (e instanceof ParseHexError) throw Error('Passed hex is in incorrect format')
					if (e instanceof UnknownAppError) throw Error('App tries to send rpc request to the injected wallet while not connected.')
					if (e instanceof FetchWalletsError) throw Error('An error occurred while fetching the wallets list.')
					if (e instanceof WrongAddressError) throw Error('Passed address is in incorrect format.')
					if (e instanceof WalletNotInjectedError) throw Error('There is an attempt to connect to the injected wallet while it is not exists in the webpage.')
					if (e instanceof WalletNotConnectedError) throw Error('Send transaction or other protocol methods called while wallet is not connected.')
					if (e instanceof LocalstorageNotFoundError) throw Error('Storage was not specified in the DappMetadata and default localStorage was not detected in the environment.')

					throw Error('Unknown error')
				}
			},
		}

		return sender
	}

	provider(
		address: Address,
		init: {
			code: Cell | null
			data: Cell | null
		} | null
	) {
		return this.api().provider(address, init)
	}

	async isContractDeployed(address: Address) {
		return await this.api().isContractDeployed(address)
	}

	open<T extends Contract>(contract: T) {
		return this.api().open(contract)
	}

	async waitForDeploy(address: Address, attempts: number = 30, sleepDuration: number = 2000) {
		try {
			if (attempts <= 0) {
				throw new Error('Attempt number must be positive')
			}

			console.log(`Deploying ${address.toString()} contract...`)

			for (let i = 1; i <= attempts; i++) {
				const isDeployed = await this.isContractDeployed(address)

				if (isDeployed) {
					console.log('This contract is deployed')
					return true
				}

				console.log('Attempt', i + 1)
				await sleep(sleepDuration)
			}

			throw new Error("Contract was not deployed. Check your wallet's transactions")
		} catch (error: any) {
			console.error(error)
			throw new Error(error.message)
		}
	}
}

export const sleep = async (ms: number) => {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

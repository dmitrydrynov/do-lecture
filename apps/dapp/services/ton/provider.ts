import { TonConnect } from '@tonconnect/sdk'
import { Base64 } from '@tonconnect/protocol'
import { Address, beginCell, Cell, Contract, internal, MessageRelaxed, OpenedContract, Sender, SendMode, StateInit, storeStateInit, TonClient, WalletContractV4 } from 'ton'
import { KeyPair, mnemonicToPrivateKey } from 'ton-crypto'
import { Maybe } from 'ton/dist/utils/maybe'
import { wrapper } from 'lecture-contract'

const { Lecture } = wrapper

const tonClient = () => {
	const isTestnet = process.env.IS_TESTNET === 'true'
	const endpoint = isTestnet ? 'https://testnet.toncenter.com/api/v2/jsonRPC' : 'https://toncenter.com/api/v2/jsonRPC'

	const provider = new TonClient({
		endpoint,
		apiKey: isTestnet ? (process.env.TON_TESTNET_APIKEY as string) : (process.env.TON_MAINNET_APIKEY as string),
	})

	return provider
}

export const initLectureContract = async (address: Address) => {
	const provider = tonClient()
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

// export const getLectureData = async (lectureAddress: Address) => {
// 	const lecture = await initLectureContract(lectureAddress)

// 	return await lecture?.getData()
// }

export class MnemonicConnect {
	wallet: WalletContractV4
	account: { address: string; workchain: number }
	connector: OpenedContract<WalletContractV4>
	private keys: KeyPair

	private constructor(wallet: WalletContractV4, keys: KeyPair) {
		this.keys = keys
		this.wallet = wallet
		this.connector = this.api().open(wallet)
		this.account = { address: wallet.address.toRawString(), workchain: wallet.workchain }
	}

	static async init(mnemonics: string, walletVersion: string = 'v4', workchain = 0) {
		const keys = await mnemonicToPrivateKey(mnemonics.split(' '))
		const wallet = WalletContractV4.create({ workchain, publicKey: keys.publicKey })

		return new MnemonicConnect(wallet, keys)
	}

	async sendTransaction(args: { messages: MessageRelaxed[]; sendMode?: Maybe<SendMode>; timeout?: Maybe<number> }) {
		const seqno = await this.connector.getSeqno()
		return this.connector?.sendTransfer({ ...args, seqno, secretKey: this.keys.secretKey })
	}

	api() {
		const isTestnet = process.env.IS_TESTNET === 'true'
		const endpoint = isTestnet ? 'https://testnet.toncenter.com/api/v2/jsonRPC' : 'https://toncenter.com/api/v2/jsonRPC'

		const api = new TonClient({
			endpoint,
			apiKey: isTestnet ? (process.env.TON_TESTNET_APIKEY as string) : (process.env.TON_MAINNET_APIKEY as string),
		})

		return api
	}
}

export class TonNetworkProvider {
	connector: TonConnect | MnemonicConnect
	private _api: TonClient
	private network: string

	constructor(connector: TonConnect | MnemonicConnect, network = 'mainnet') {
		this.connector = connector
		this._api = this.api()
		this.network = network
	}

	async getNetwork() {
		return this.network
	}

	api() {
		const endpoint = this.network == 'testnet' ? 'https://testnet.toncenter.com/api/v2/jsonRPC' : 'https://toncenter.com/api/v2/jsonRPC'
		const api = new TonClient({
			endpoint,
			apiKey: this.network == 'testnet' ? (process.env.TON_TESTNET_APIKEY as string) : (process.env.TON_MAINNET_APIKEY as string),
		})

		return api
	}

	sender() {
		if (!this.connector.account) return

		const sender: Sender = {
			address: Address.parseRaw(this.connector.account.address),

			send: async ({ to, value, init, body }) => {
				const stateInitCell = init
					? beginCell()
							.store(storeStateInit(init as StateInit))
							.endCell()
					: undefined

				if (this.connector instanceof TonConnect) {
					this.connector.sendTransaction({
						validUntil: 60000,
						messages: [
							{
								address: to.toString(),
								amount: value.toString(),
								payload: body ? Base64.encode(body.toBoc()) : undefined,
								stateInit: stateInitCell ? Base64.encode(stateInitCell.toBoc()) : undefined,
							},
						],
					})
				}

				if (this.connector instanceof MnemonicConnect) {
					this.connector.sendTransaction({
						messages: [
							internal({
								to,
								value,
								body,
								init,
							}),
						],
						timeout: 60000,
					})
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
		return this._api.provider(address, init)
	}

	async isContractDeployed(address: Address) {
		return await this._api.isContractDeployed(address)
	}

	async open<T extends Contract>(contract: T) {
		return this._api.open(contract)
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

import { wrapper } from 'lecture-contract'
import { Address, TonClient, WalletContractV4 } from 'ton'
import { mnemonicToPrivateKey } from 'ton-crypto'

export const initTonClient = () => {
	const isTestnet = process.env.IS_TESTNET === 'true'
	const endpoint = isTestnet ? 'https://testnet.toncenter.com/api/v2/jsonRPC' : 'https://toncenter.com/api/v2/jsonRPC'

	const client = new TonClient({
		endpoint,
		apiKey: isTestnet ? (process.env.TON_TESTNET_APIKEY as string) : (process.env.TON_MAINNET_APIKEY as string),
	})

	return client
}

export const initLectureContract = async (address: Address) => {
	const client = initTonClient()
	const contract = wrapper.Lecture.createFromAddress(address)
	const response = await client.getContractState(address)
	const openedContract = client.open(contract)

	return response.state == 'active' ? openedContract : null
}

export const initServiceWallet = async (workchain = 0) => {
	const client = initTonClient()
	const serviceMnemonics = process.env.SERVICE_WALLET_MNEMONIC as string
	let keyPair = await mnemonicToPrivateKey(serviceMnemonics.split(' '))
	let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey })
	let contract = client.open(wallet)

	return { contract, keyPair }
}

export const initManagerWallet = async (workchain = 0) => {
	const client = initTonClient()
	const managerMnemonics = process.env.MANAGER_WALLET_MNEMONIC as string
	let keyPair = await mnemonicToPrivateKey(managerMnemonics.split(' '))
	let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey })
	let contract = client.open(wallet)

	return { contract, keyPair }
}

export const getLectureData = async (lectureAddress: Address) => {
	const lecture = await initLectureContract(lectureAddress)

	return await lecture?.getData()
}
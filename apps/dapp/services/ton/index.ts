import { wrapper } from 'lecture-contract'
import { Address, TonClient, WalletContractV4 } from 'ton'
import { mnemonicToPrivateKey } from 'ton-crypto'

export const tonProvider = () => {
	const isTestnet = process.env.IS_TESTNET === 'true'
	const endpoint = isTestnet ? 'https://testnet.toncenter.com/api/v2/jsonRPC' : 'https://toncenter.com/api/v2/jsonRPC'

	const provider = new TonClient({
		endpoint,
		apiKey: isTestnet ? (process.env.TON_TESTNET_APIKEY as string) : (process.env.TON_MAINNET_APIKEY as string),
	})

	return provider
}

export const initLectureContract = async (address: Address) => {
	const provider = tonProvider()
	const contract = wrapper.Lecture.createFromAddress(address)
	const response = await provider.getContractState(address)
	const openedContract = provider.open(contract)

	return response.state == 'active' ? openedContract : null
}

export const initServiceWallet = async (workchain = 0) => {
	const provider = tonProvider()
	const serviceMnemonics = process.env.SERVICE_WALLET_MNEMONIC as string
	let keyPair = await mnemonicToPrivateKey(serviceMnemonics.split(' '))
	let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey })
	let contract = provider.open(wallet)

	return { contract, keyPair }
}

export const initManagerWallet = async (workchain = 0) => {
	const provider = tonProvider()
	const managerMnemonics = process.env.MANAGER_WALLET_MNEMONIC as string
	let keyPair = await mnemonicToPrivateKey(managerMnemonics.split(' '))
	let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey })
	let contract = provider.open(wallet)

	return { contract, keyPair }
}

export const getLectureData = async (lectureAddress: Address) => {
	const lecture = await initLectureContract(lectureAddress)

	return await lecture?.getData()
}

export const waitForDeploy = async (address: Address, attempts: number = 10, sleepDuration: number = 2000) => {
	if (attempts <= 0) {
		throw new Error('Attempt number must be positive')
	}

	const provider = tonProvider()

	for (let i = 1; i <= attempts; i++) {
		const isDeployed = await provider.isContractDeployed(address)
		if (isDeployed) {
			return true
		}

		await sleep(sleepDuration)
	}

	throw new Error("Contract was not deployed. Check your wallet's transactions");
}

export const sleep = async (ms: number) => {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

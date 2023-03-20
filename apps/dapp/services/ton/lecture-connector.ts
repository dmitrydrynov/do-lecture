import TonConnect, { UserRejectsError, WalletInfo, WalletInfoInjected } from '@tonconnect/sdk'
import { wrapper, code } from 'lecture-contract'
import { Address, Cell, toNano, SenderArguments, Sender, OpenedContract } from 'ton'
import { addReturnStrategy, isMobile, openLink } from '@/helpers/utils'
import { sleep, TonNetworkProvider } from './provider'

const { Lecture } = wrapper

type WithCallback = {
	onSuccess?: () => void
	onError?: () => void
}

type LecturePayArgs = { address: Address; amount: number } & WithCallback
type LectureCancelArgs = { address: Address } & WithCallback

export class LectureConnector {
	private provider: TonNetworkProvider
	private lectureContract?: OpenedContract<wrapper.Lecture>
	private sender?: Sender
	private validUntil: number = 30 // seconds

	private constructor(connector: TonConnect, lectureAddress: Address, validUntil?: number) {
		this.provider = new TonNetworkProvider(connector)
		this.sender = this.provider.sender()
		this.initLecture(lectureAddress)

		if (validUntil) this.validUntil = validUntil
	}

	static async init(connector: TonConnect, lectureAddress: Address) {
		return new LectureConnector(connector, lectureAddress)
	}

	async initLecture(lectureAddress: Address) {
		this.lectureContract = await this.provider.open(Lecture.createFromAddress(lectureAddress))
	}

	private getConnectedWalletInfo = () => {
		const conn: any = this.provider.connector
		const connectedWalletInfo = conn.provider.walletConnectionSource

		return connectedWalletInfo as WalletInfo
	}

	private getProviderType = () => {
		const conn: any = this.provider.connector
		const type = conn.provider.type

		return type as string
	}

	private initLinkStrategy = () => {
		const connectedWalletInfo = this.getConnectedWalletInfo()
		if ('universalLink' in connectedWalletInfo && !(connectedWalletInfo as WalletInfoInjected).embedded && isMobile()) {
			openLink(addReturnStrategy(connectedWalletInfo.universalLink, 'none'), '_blank')
		}
	}

	private send = async (args: SenderArguments) => {
		if (this.getProviderType() === 'http') this.initLinkStrategy()

		try {
			const result = await this.provider.sender()?.send(args)

			return result
		} catch (e: any) {
			let message = 'Send transaction error'
			let description = ''

			if (typeof e === 'object' && e instanceof UserRejectsError) {
				message = 'You rejected the transaction'
				description = 'Please try again and confirm transaction in your wallet.'
			}

			return { error: message, description: description || e.message }
		}
	}

	cancel = async ({ address, onSuccess = () => {} }: LectureCancelArgs) => {
		try {
			const sender = this.provider.sender()
			if (!sender) return

			if (!(await this.provider.isContractDeployed(address))) {
				console.log(`Error: Contract at address ${address} is not deployed!`)
				return
			}

			const lectureContract = await this.provider.open(Lecture.createFromAddress(address))
			await lectureContract.sendCancel(sender)

			let attempt = 1
			while ((await this.provider.isContractDeployed(address)) || attempt <= 30) {
				console.log(`Attempt ${attempt}`)
				await sleep(2000)
				attempt++
			}

			console.log('Lecture cancel successfully!')
		} catch (e: any) {
			console.error(e)

			return { lectureAddress: null, error: e.message }
		}
	}

	deploy = async (config: any, workchain?: number) => {
		try {
			const sender = this.provider.sender()
			if (!sender) return

			console.log('Start Lecture deploying...')

			const initCode = Cell.fromBoc(Buffer.from(code.hex, 'hex'))[0]
			const lectureContract = await this.provider.open(Lecture.createFromConfig(config, initCode, workchain))
			await lectureContract.sendDeploy(sender)

			console.log('Message with deploy sent')

			await this.provider.waitForDeploy(lectureContract.address)
			
			console.log('Lecture deployed')

			return { lectureAddress: lectureContract.address.toString() }
		} catch (e: any) {
			console.error(e)

			return { error: e.message }
		}
	}

	pay = async ({ address, amount, onSuccess = () => {} }: LecturePayArgs) => {
		try {
			const sender = this.provider.sender()
			if (!sender) return

			const lectureContract = await this.provider.open(Lecture.createFromAddress(address))
			await lectureContract.sendPay(sender, toNano(amount))

			onSuccess()
		} catch (error: any) {
			return { error: error.message }
		}
	}

	sendReport = async ({ address, onSuccess = () => {} }: LectureCancelArgs) => {
		try {
			const sender = this.provider.sender()
			if (!sender) return

			const lectureContract = await this.provider.open(Lecture.createFromAddress(address))
			await lectureContract.sendReport(sender)

			onSuccess()
		} catch (e: any) {
			console.error(e)

			return { lectureAddress: null, error: e.message }
		}
	}
}

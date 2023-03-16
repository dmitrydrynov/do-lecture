import { Base64 } from '@tonconnect/protocol'
import TonConnect, { UserRejectsError, WalletInfo, WalletInfoInjected } from '@tonconnect/sdk'
import { wrapper, code } from 'lecture-contract'
import { DateTime } from 'luxon'
import { Address, Cell, StateInit, beginCell, storeStateInit, toNano } from 'ton'
import { addReturnStrategy, isMobile, openLink } from '@/helpers/utils'
import { waitForDeploy } from '.'

const { Lecture: LectureContract } = wrapper

type WithCallback = {
	onSuccess?: () => void
	onError?: () => void
}

type LecturePayArgs = { address: Address; amount: number } & WithCallback
type LectureCancelArgs = { address: Address } & WithCallback

export class LectureContractConnector {
	readonly connector: TonConnect
	readonly validUntil: number = 30 // seconds

	private constructor(connector: TonConnect, validUntil?: number) {
		this.connector = connector

		if (validUntil) this.validUntil = validUntil
	}

	private getConnectedWalletInfo = () => {
		const conn: any = this.connector
		const connectedWalletInfo = conn.provider.walletConnectionSource

		return connectedWalletInfo as WalletInfo
	}

	private getProviderType = () => {
		const conn: any = this.connector
		const type = conn.provider.type

		return type as string
	}

	private initLinkStrategy = () => {
		const connectedWalletInfo = this.getConnectedWalletInfo()
		if ('universalLink' in connectedWalletInfo && !(connectedWalletInfo as WalletInfoInjected).embedded && isMobile()) {
			openLink(addReturnStrategy(connectedWalletInfo.universalLink, 'none'), '_blank')
		}
	}

	private send = async (messages: Record<any, any> | Array<Record<any, any>>) => {
		if (this.getProviderType() === 'http') this.initLinkStrategy()

		try {
			const result = await this.connector.sendTransaction({
				validUntil: DateTime.now().plus({ seconds: this.validUntil }).toUnixInteger(),
				messages: Array.isArray(messages) ? messages : [messages],
			})

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

	static init(connector: TonConnect) {
		return new LectureContractConnector(connector)
	}

	cancel = async ({ address, onSuccess = () => {} }: LectureCancelArgs) => {
		try {
			const body = beginCell().storeUint(LectureContract.OPERATION.CANCEL, 32).endCell()

			const result: any = await this.send({
				address: address.toString(),
				amount: toNano('0.1').toString(),
				payload: Base64.encode(body.toBoc()),
			})

			if (result?.error) {
				throw new Error(`${result?.error}. ${result?.description} `)
			}

			console.log('[cancel]', result)

			onSuccess()

			return result
		} catch (e: any) {
			console.error(e)

			return { lectureAddress: null, error: e.message }
		}
	}

	deploy = async (config: any, workchain?: number) => {
		try {
			const deployPrice = LectureContract.START_LESSON_PRICE || '1'
			const initCode = Cell.fromBoc(Buffer.from(code.hex, 'hex'))[0]
			const lecture = LectureContract.createFromConfig(config, initCode, workchain)
			const stateInitCell = beginCell()
				.store(storeStateInit(lecture.init as StateInit))
				.endCell()

			const result: any = await this.send({
				address: lecture.address.toString(),
				amount: toNano(deployPrice).toString(),
				stateInit: Base64.encode(stateInitCell.toBoc()),
			})

			if (result?.error) {
				throw new Error(`${result?.error}. ${result?.description} `)
			}

			await waitForDeploy(lecture.address)

			return { lectureAddress: lecture.address.toString() }
		} catch (e: any) {
			console.error(e)

			return { error: e.message }
		}
	}

	pay = async ({ address, amount, onSuccess = () => {} }: LecturePayArgs) => {
		try {
			const body = beginCell().storeUint(LectureContract.OPERATION.PAY, 32).endCell()

			const result: any = await this.send({
				address: address.toString(), //contract address
				amount: toNano(amount.toString()).toString(),
				payload: Base64.encode(body.toBoc()), // init data
			})

			if (result?.error) {
				throw new Error(`${result?.error}. ${result?.description} `)
			}

			onSuccess()

			console.log('[pay]', result)
			return result
		} catch (error: any) {
			return { error: error.message }
		}
	}

	sendReport = async ({ address, onSuccess = () => {} }: LectureCancelArgs) => {
		try {
			const body = beginCell().storeUint(LectureContract.OPERATION.REPORT, 32).endCell()

			const result: any = await this.send({
				address: address.toString(),
				amount: toNano('0.1').toString(),
				payload: Base64.encode(body.toBoc()),
			})

			if (result?.error) {
				throw new Error(`${result?.error}. ${result?.description} `)
			}

			console.log('[report]', result)

			onSuccess()

			return result
		} catch (e: any) {
			console.error(e)

			return { lectureAddress: null, error: e.message }
		}
	}
}

import { useContext, useEffect, useState } from 'react'
import { HeartTwoTone } from '@ant-design/icons'
import Icon from '@ant-design/icons'
import { Button, InputNumber, List, message, Progress, Space, Typography } from 'antd'
import useSWR from 'swr'
import useSWRMutation, { SWRMutationResponse } from 'swr/mutation'
import { toNano } from 'ton'
import { TonScanSvg } from '../icons/TonScanSvg'
import { TonContext } from '@/contexts/ton-context'
import { fetcher } from '@/helpers/fetcher'
import { renderPrice } from '@/helpers/utils'
import dayjs from 'dayjs'
import { TonNetworkProvider } from '@/services/ton/provider'
import { Lecture } from 'lecture-contract/wrappers/Lecture'

export const MyLectures = ({ forceUpdate = false, onUpdate = () => {} }: any) => {
	const { connector, network, userWallet } = useContext(TonContext)
	const [amount, setAmount] = useState<number>(0.01)
	const { trigger: cancelLecture }: SWRMutationResponse<any, any, any> = useSWRMutation('/api/lecture/cancel', (url, { arg }) => fetcher([url, arg]))
	const {
		data,
		mutate: refetchLectures,
		isLoading,
	} = useSWR(connector?.connected ? ['/api/my/lectures'] : null, fetcher, {
		refreshInterval: 10000,
	})

	useEffect(() => {
		if (forceUpdate) {
			refetchLectures().then(() => onUpdate())
		}
	}, [forceUpdate])

	const calculateProgress = (lecture: any) => {
		if (!lecture.meta) return 0

		const percent = (lecture.meta.goal - lecture.meta.left) / lecture.meta.goal

		return Math.ceil(percent * 100)
	}

	const handlePayLecture = async (lecture: any) => {
		if (!connector) return

		try {
			const provider = new TonNetworkProvider(connector)
			const sender = provider.sender()
			const lectureContract = await provider.open(Lecture.createFromAddress(lecture.contractAddress))

			if (sender) await lectureContract.sendPay(sender, toNano(amount))
		} catch (e: any) {
			message.error(e.message || 'Оплата лекции не прошла')
			console.error(e)
		}
	}

	const handleCancelLecture = async (lecture: any) => {
		if (!userWallet || !connector) return

		try {
			// const res = await cancelLecture({ id: lecture.id })
			const provider = new TonNetworkProvider(connector)
			const sender = provider.sender()
			const lectureContract = await provider.open(Lecture.createFromAddress(lecture.contractAddress))

			if (sender) lectureContract.sendCancel(sender)

			message.success('Вы отменили лекцию. Все полученные выплаты будут возвращены автоматически.')

			onUpdate()
		} catch (e: any) {
			message.error(e.message || 'Отменить лекцию не удалось.')
			console.error(e)
		}
	}

	const handleAddReport = async (lecture: any) => {
		if (!userWallet || !connector) return

		try {
			const provider = new TonNetworkProvider(connector)
			const sender = provider.sender()
			const lectureContract = await provider.open(Lecture.createFromAddress(lecture.contractAddress))

			if (sender) await lectureContract.sendReport(sender)

			// const lc = LectureConnector.init(connector, lecture.contractAddress)
			// await lc.sendReport({
			// 	address: Address.parse(lecture.contractAddress),
			// 	onSuccess: async () => {
			// 		onUpdate()
			// 		message.success('Вы отправили жалобу')
			// 	},
			// })
		} catch (e: any) {
			message.error(e.message || 'Отменить лекцию не удалось.')
			console.error(e)
		}
	}

	return (
		<>
			<List
				loading={isLoading}
				bordered
				dataSource={data}
				renderItem={(lecture: any, key: number) => (
					<List.Item
						key={key}
						actions={[
							!!lecture.meta && <div key={0}>{dayjs(lecture.meta.startTime * 1000).toString()}</div>,
							<span key="paid">{lecture.meta?.paymentCount}</span>,
							<span key="reports">{lecture.meta?.reportsCount}</span>,
							<InputNumber
								style={{ width: '110px' }}
								key="pay-amount"
								max={1}
								min={0.01}
								step={0.1}
								addonAfter="TON"
								size="small"
								maxLength={6}
								defaultValue={amount}
								onChange={(value) => (value ? setAmount(value) : null)}
							/>,
							<Button key="pay-lecture" onClick={() => handlePayLecture(lecture)}>
								Оплатить
							</Button>,
						]}
					>
						<List.Item.Meta
							title={
								<>
									{<HeartTwoTone twoToneColor={lecture.meta?.state == 'active' ? 'lightgreen' : 'red'} />} {lecture.title} ({renderPrice(lecture.meta?.paidTotal, 'decimal')} из{' '}
									{renderPrice(lecture.meta?.goal)}
									)
									<Progress percent={calculateProgress(lecture)} strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} />
								</>
							}
							description={
								<>
									<Typography.Paragraph
										copyable={{
											icon: <Icon component={TonScanSvg} style={{ scale: '1.5', color: '#aaa' }} />,
											tooltips: ['See on tonscan.org'],
											onCopy: () => {
												window.open(`https://${network == 'testnet' ? 'testnet.' : ''}tonscan.org/address/${lecture.contractAddress}`, '_blank')
											},
										}}
									>
										{lecture.contractAddress}
									</Typography.Paragraph>
									<Space>
										{['funding', 'run-up'].includes(lecture.stage) && (
											<Button key="cancel-lecture" onClick={() => handleCancelLecture(lecture)}>
												Отменить
											</Button>
										)}
										{['implementation'].includes(lecture.stage) && (
											<Button key="add-complaint" onClick={() => handleAddReport(lecture)}>
												Пожаловаться
											</Button>
										)}
										<Button key="resolve-complaint" onClick={() => {}}>
											Решить жалобу
										</Button>
									</Space>
								</>
							}
						/>
					</List.Item>
				)}
			/>
		</>
	)
}

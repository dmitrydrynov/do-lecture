import { useContext, useEffect, useState } from 'react'
import { HeartTwoTone } from '@ant-design/icons'
import Icon from '@ant-design/icons'
import { Button, InputNumber, List, message, Progress, Space, Typography } from 'antd'
import { DateTime } from 'luxon'
import useSWR from 'swr'
import useSWRMutation, { SWRMutationResponse } from 'swr/mutation'
import { Address } from 'ton'
import { TonScanSvg } from '../icons/TonScanSvg'
import { TonContext } from '@/contexts/ton-context'
import { fetcher } from '@/helpers/fetcher'
import { renderPrice } from '@/helpers/utils'
import { LectureContractConnector } from '@/services/ton/lecture-connector'

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
			const lc = LectureContractConnector.init(connector)
			const result: any = await lc.pay({
				address: lecture.contractAddress,
				amount,
				onSuccess: () => {
					message.success('Вы внесли оплату для лекции')
				},
			})

			if (result.hasOwnProperty('error')) {
				throw new Error(`${result.error}. ${result.description}`)
			}
		} catch (e: any) {
			message.error(e.message || 'Оплата лекции не прошла')
			console.error(e)
		}
	}

	const handleCancelLecture = async (lecture: any) => {
		if (!userWallet || !connector) return

		try {
			const res = await cancelLecture({ id: lecture.id })

			if (res.error) {
				console.log(res.error)
				throw new Error(res.error)
			}

			message.success('Вы отменили лекцию. Все полученные выплаты будут возвращены автоматически.')

			onChange()
		} catch (e: any) {
			message.error(e.message || 'Отменить лекцию не удалось.')
			console.error(e)
		}
	}

	const handleAddReport = async (lecture: any) => {
		if (!userWallet || !connector) return

		try {
			const lc = LectureContractConnector.init(connector)
			await lc.sendReport({
				address: Address.parse(lecture.contractAddress),
				onSuccess: async () => {
					onChange()
					message.success('Вы отправили жалобу')
				},
			})
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
							!!lecture.meta && <div key={0}>{DateTime.fromISO(lecture.meta.startTime).toFormat('yyyy LLL dd, hh:mm')}</div>,
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

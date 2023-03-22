import { useContext, useEffect, useState } from 'react'
import { HeartTwoTone } from '@ant-design/icons'
import Icon from '@ant-design/icons'
import { Button, InputNumber, List, message, Progress, Space, Table, Typography } from 'antd'
import useSWR from 'swr'
import useSWRMutation, { SWRMutationResponse } from 'swr/mutation'
import { Address, toNano } from 'ton'
import { TonScanSvg } from '../icons/TonScanSvg'
import { TonContext } from '@/services/ton/context'
import { fetcher } from '@/helpers/fetcher'
import { renderPrice } from '@/helpers/utils'
import dayjs from 'dayjs'
import { Lecture } from 'lecture-contract/wrappers/Lecture'
import { sleep } from '@/services/ton/provider'
import { UserRejectsError } from '@tonconnect/sdk'
import { ColumnsType } from 'antd/es/table'

export const MyLectures = ({ forceUpdate = false, onUpdate = () => {} }: any) => {
	const { connector, provider, network, userWallet } = useContext(TonContext)
	const [amount, setAmount] = useState<number>(0.01)
	const [messageApi, contextHolder] = message.useMessage()
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
		if (!provider) return

		try {
			const lectureContract = await provider.open(Lecture.createFromAddress(Address.parse(lecture.contractAddress)))
			await lectureContract.sendPay(provider.sender(), toNano(amount))
		} catch (e: any) {
			message.error(e.message || 'Оплата лекции не прошла')
			console.error(e)
		}
	}

	const handleCancelLecture = async (lecture: any) => {
		if (!userWallet || !provider) return

		messageApi.open({
			type: 'loading',
			content: 'Waiting for the lecture closing confirmation...',
			duration: 0,
			key: 'cancelLectureProcessing',
		})

		try {
			const lectureContract = await provider.open(Lecture.createFromAddress(Address.parse(lecture.contractAddress)))
			await lectureContract.sendCancel(provider.sender())

			messageApi.open({
				content: 'The transaction sent. The lecture cancelling...',
				key: 'cancelLectureProcessing',
			})

			let attempt = 1
			while (await provider.isContractDeployed(Address.parse(lecture.contractAddress))) {
				if (attempt > 30) break

				console.log(`Attempt ${attempt}`)
				await sleep(2000)
				attempt++
			}

			messageApi.open({
				type: 'success',
				content: 'Lecture was published',
				key: 'cancelLectureProcessing',
			})
		} catch (e: any) {
			messageApi.open({
				type: 'error',
				content: e.message,
				key: 'cancelLectureProcessing',
			})

			console.error(e)
		}
	}

	const handleAddReport = async (lecture: any) => {
		if (!userWallet || !provider) return

		try {
			const lectureContract = await provider.open(Lecture.createFromAddress(Address.parse(lecture.contractAddress)))
			lectureContract.sendReport(provider.sender())
		} catch (e: any) {
			message.error(e.message || 'Отменить лекцию не удалось.')
			console.error(e)
		}
	}

	const columns: ColumnsType<any> = [
		{
			title: 'Date',
			dataIndex: 'date',
			key: 'name',
			render: (date) => {
				const isCurrentYear = dayjs(date).year() == dayjs().year()
				return isCurrentYear ? dayjs(date).format('D MMM [at] hh:mm') : dayjs(date).format('D MMM YYYY [at] hh:mm')
			},
		},
		{
			title: 'Title',
			dataIndex: 'title',
			key: 'name',
		},
		{
			title: 'Status',
			dataIndex: 'status',
			key: 'status',
			align: 'center',
		},
		{
			title: 'Required amount, TON',
			dataIndex: 'price',
			align: 'right',
			key: 'price',
		},
		{
			key: 'actions',
			render: (record) => {
				return (
					<Space>
						<Button>Public</Button>
						<Button>Edit</Button>
						<Button>Delete</Button>
					</Space>
				)
			},
		},
	]

	return (
		<>
			{contextHolder}
			<Table dataSource={data} columns={columns} pagination={false} />
			{/* <List
				loading={isLoading}
				bordered
				dataSource={data}
				renderItem={(lecture: any, key: number) => (
					<List.Item
						key={key}
						actions={[
							<Button key="cancel-lecture" onClick={() => handleCancelLecture(lecture)}>
								Опубликовать
							</Button>,
							<Button key="cancel-lecture" onClick={() => handleCancelLecture(lecture)}>
								Редактировать
							</Button>,
							<Button key="cancel-lecture" onClick={() => handleCancelLecture(lecture)}>
								Удалить
							</Button>,
						]}
					>
						<List.Item.Meta
							title={
								<>
									{lecture.status == 'published' && <HeartTwoTone twoToneColor={lecture.meta?.state == 'active' ? 'lightgreen' : 'red'} />} {lecture.title} ({renderPrice(lecture.meta?.paidTotal, 'decimal')} из{' '}
									{renderPrice(lecture.meta?.goal)})
									{lecture.status == 'published' && <Progress percent={calculateProgress(lecture)} strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} />}
								</>
							}
							description={
								lecture.status == 'published' && (
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
									</>
								)
							}
						/>
					</List.Item>
				)}
			/> */}
		</>
	)
}

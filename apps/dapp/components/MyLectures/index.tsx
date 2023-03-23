/* eslint-disable react/no-unescaped-entities */
import { useContext, useEffect, useState } from 'react'
import { fetcher } from '@/helpers/fetcher'
import { TonContext } from '@/services/ton/context'
import { sleep } from '@/services/ton/provider'
import Icon from '@ant-design/icons'
import { Button, message, Modal, Space, Table, Typography } from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { Lecture } from 'lecture-contract/wrappers/Lecture'
import dynamic from 'next/dynamic'
import useSWR from 'swr'
import useSWRMutation, { SWRMutationResponse } from 'swr/mutation'
import { Address, toNano } from 'ton'
import styles from './style.module.css'
import { TonScanSvg } from '../icons/TonScanSvg'

const LectureModal = dynamic(() => import('@/components/modals/LectureModal').then((r) => r.LectureModal), { ssr: false })

const { confirm } = Modal
const { Paragraph, Text } = Typography

export const MyLectures = ({ forceUpdate = false, onUpdate = () => {} }: any) => {
	const [shouldUpdate, setShouldUpdate] = useState(false)
	const [lectureForEdit, setLectureForEdit] = useState<any>()
	const { connector, provider, network, userWallet } = useContext(TonContext)
	const [amount, setAmount] = useState<number>(0.01)
	const [messageApi, contextHolder] = message.useMessage()
	const { trigger: cancelLecture }: SWRMutationResponse<any, any, any> = useSWRMutation('/api/lecture/cancel', (url, { arg }) => fetcher([url, arg]))
	const { trigger: deleteDraftLecture }: SWRMutationResponse<any, any, any> = useSWRMutation('/api/lecture/delete', (url, { arg }) => fetcher([url, arg]))
	const {
		data,
		mutate: refetchLectures,
		isLoading,
	} = useSWR(connector?.connected ? ['/api/my/lectures'] : null, fetcher, {
		refreshInterval: 10000,
	})

	useEffect(() => {
		refetchLectures().then(() => onUpdate())
	}, [shouldUpdate])

	useEffect(() => {
		if (forceUpdate) setShouldUpdate((u) => !u)
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

			await cancelLecture({ id: lecture.id })

			messageApi.open({
				type: 'success',
				content: 'Lecture was canceled',
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

	const showDeleteConfirm = (record: any) => {
		confirm({
			type: 'error',
			title: 'Delete',
			content: `Are you sure delete "${record.title}" lecture?`,
			// icon: <ExclamationCircleFilled />,
			okText: 'Yes',
			okType: 'danger',
			cancelText: 'No',
			async onOk() {
				await deleteDraftLecture({ id: record.id })
				messageApi.success(`Lecture "${record.title}" was deleted`)
				setShouldUpdate((u) => !u)
			},
		})
	}

	const showCancelConfirm = (record: any) => {
		confirm({
			type: 'warning',
			title: 'Cancel',
			content: (
				<>
					<Paragraph>Are you sure cancel "{record.title}" lecture?</Paragraph>
					<Paragraph>Lecture cancellation is paid, it costs 0.1 TON.</Paragraph>
					<Paragraph>If you agree and ready please press Yes button and approve the transaction in your TON wallet</Paragraph>
				</>
			),
			// icon: <ExclamationCircleFilled />,
			okText: 'Yes',
			okType: 'danger',
			cancelText: 'No',
			async onOk() {
				await handleCancelLecture(record)
				setShouldUpdate((u) => !u)
			},
		})
	}

	const handleSaveLecture = async () => {
		setLectureForEdit(undefined)
	}

	const handleDirectToTonScan = (contractAddress: string) => {
		window.open(`https://${network == 'testnet' ? 'testnet.' : ''}tonscan.org/address/${contractAddress}`, '_blank')
	}

	const columns: ColumnsType<any> = [
		{
			title: 'Date',
			dataIndex: 'date',
			key: 'name',
			render: (date) => {
				const isCurrentYear = dayjs(date).year() == dayjs().year()
				return isCurrentYear ? dayjs(date).format('D MMM [at] HH:mm') : dayjs(date).format('D MMM YYYY [at] hh:mm')
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
			align: 'right',
			render: (_, record) => {
				return (
					<Space>
						{!!record.contractAddress && (
							<Button type="text" shape="circle" onClick={() => handleDirectToTonScan(record.contractAddress)}>
								<Icon component={TonScanSvg} style={{ margin: 0, scale: '1.5', color: '#aaa' }} />
							</Button>
						)}
						{record.meta.state == 'active' && (
							<>
								<Button onClick={() => showCancelConfirm(record)}>Cancel</Button>
							</>
						)}
						{record.meta.state == undefined && record.status == 'draft' && (
							<>
								<Button onClick={() => setLectureForEdit(record)}>Edit</Button>
								<Button onClick={() => showDeleteConfirm(record)}>Delete</Button>
							</>
						)}
					</Space>
				)
			},
		},
	]

	return (
		<>
			{contextHolder}
			<Table className={styles.table} dataSource={data} columns={columns} pagination={false} loading={isLoading} />

			<LectureModal open={!!lectureForEdit} lectureId={lectureForEdit?.id} onFinish={handleSaveLecture} onCancel={() => setLectureForEdit(undefined)} />
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

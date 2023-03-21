import { useContext, useEffect, useState } from 'react'
import { Alert, Col, DatePicker, Form, Input, InputNumber, message, Modal, Row, Spin, TimePicker } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import dayjs, { Dayjs } from 'dayjs'
import useSWR from 'swr'
import useSWRMutation, { SWRMutationResponse } from 'swr/mutation'
import { Address, Cell, toNano } from 'ton-core'
import { SettingsContext } from '@/contexts/settings'
import { TonContext } from '@/contexts/ton-context'
import { fetcher } from '@/helpers/fetcher'
import { TonNetworkProvider, waitForDeploy } from '@/services/ton/provider'
import { code, wrapper } from 'lecture-contract'
import { LectureConfig } from 'lecture-contract/wrappers/Lecture'
import { useTonConnect } from '@/hooks/useTonConnect'
import { TonClient } from 'ton'

const { Lecture } = wrapper

interface AddLectureModalParams {
	open: boolean
	onFinish: () => void
	onCancel: () => void
}

export const AddLectureModal = ({ open, onFinish, onCancel }: AddLectureModalParams) => {
	const [form] = useForm()
	const { connector, userWallet, network } = useContext(TonContext)
	const { sender, provider } = useTonConnect()
	const settings = useContext(SettingsContext)
	const [formData, setFormData] = useState<any>()
	const [creating, setCreating] = useState(false)
	const [messageApi, contextHolder] = message.useMessage()
	const { data: rate } = useSWR(['/api/rates', { coins: formData?.price || 10 }], fetcher)
	const { data: community } = useSWR(['/api/community', {}], fetcher)
	const { trigger: addLecture, isMutating: newLectureAdding }: SWRMutationResponse<any, any, any> = useSWRMutation('/api/lecture/add', (url, { arg }: any) => fetcher([url, arg]))

	useEffect(() => {
		if (open) {
			form.resetFields()
			form.setFieldsValue({ price: 10, duration: 30 })
		}
	}, [open])

	const handleAddPaidLecture = async () => {
		if (!settings?.serviceWallet || !userWallet || !connector?.connected) return

		const data = await form.validateFields()

		try {
			setCreating(true)

			messageApi.open({
				type: 'loading',
				content: 'Waiting...',
				duration: 0,
				key: 'creatingProcess',
			})

			const initCode = Cell.fromBoc(Buffer.from(code.hex, 'hex'))[0]
			const lecture = provider.open(
				Lecture.createFromConfig(
					{
						startTime: Math.floor(Date.now() / 1000 + 60 * 60 * 4),
						goal: toNano('1.5'),
						serviceAddress: Address.parse('EQCEMXa-Y0atAWiwS4ZqG9jwXgnrw4qVlXgIFpn648DFgt18'),
						lecturerAddress: Address.parse('EQB6LmhSEwtpVlX5RPU90t0DPoYgituWnFbOpi78VKcdrJAH'),
						managerAddress: Address.parse('EQCW6MGF9a91SIbyd9aOna5IsKwwt8jvSz445vLqRCSl0wvw'),
					},
					initCode
				)
			)

			await lecture.sendDeploy(sender)
			await waitForDeploy(lecture.address, 60)

			// const startTime = data.date.set('hour', data.time.hour()).set('minute', data.time.minute()).set('second', 0)
			// const initCode = Cell.fromBoc(Buffer.from(code.hex, 'hex'))[0]
			// const initData: LectureConfig = {
			// 	startTime: startTime.unix(),
			// 	goal: toNano(data.price),
			// 	serviceAddress: Address.parse(settings.serviceWallet),
			// 	managerAddress: Address.parse(community.managerAddress),
			// 	lecturerAddress: Address.parse(userWallet.account.address),
			// }

			// const provider = new TonNetworkProvider(connector, network)
			// const lectureContract = await provider.open(Lecture.createFromConfig(initData, initCode))

			// console.log('Start Lecture deploying...')

			// await lectureContract.sendDeploy(sender)

			// console.log('Transaction sent')

			// await provider.waitForDeploy(lectureContract.address)

			// const lectureConnector = LectureContractConnector.init(connector)
			// const result = await lectureConnector.deploy({
			// 	startTime: startTime.unix(),
			// 	goal: data.price || 0,
			// 	serviceAddress: Address.parse(settings.serviceWallet),
			// 	managerAddress: Address.parse(community.managerAddress),
			// 	lecturerAddress: Address.parse(userWallet.account.address),
			// })

			// if (result.hasOwnProperty('error')) {
			// 	throw new Error(result.error)
			// }

			await addLecture({
				title: data.title,
				description: data.description,
				date: startTime.toISOString(),
				contractAddress: lectureContract.address,
				price: data.price,
				duration: data.duration,
			})

			onFinish()
			setCreating(false)
			messageApi.destroy('creatingProcess')
			messageApi.success('New lecture was added')
		} catch (e: any) {
			console.error(e)
			setCreating(false)
			messageApi.destroy('creatingProcess')
			messageApi.error(e.message)
		}
	}

	const disabledTime = (now: any) => {
		const minDate = now.add(4, 'hour')
		const selectedDate = formData.date

		if (selectedDate?.startOf('date').unix() == minDate.startOf('date').unix()) {
			return {
				disabledHours: () => Array.from({ length: minDate.hour() }, (v, i) => i),
			}
		}

		return {}
	}

	const disabledDate = (current: Dayjs) => {
		const minDate = dayjs().add(4, 'hour')
		return current && current < minDate.startOf('day')
	}

	return (
		<>
			{contextHolder}
			<Modal forceRender open={open} confirmLoading={newLectureAdding || creating} onCancel={onCancel} onOk={handleAddPaidLecture} title="New paid lecture">
				<Spin spinning={newLectureAdding || creating}>
					<Form
						form={form}
						layout="vertical"
						requiredMark="optional"
						initialValues={{ duration: 30, community: 'Game Developers Hub' }}
						onValuesChange={(_, values) => setFormData(values)}
					>
						<Form.Item name="title" label="Title" rules={[{ required: true }]}>
							<Input size="large" />
						</Form.Item>
						<Form.Item name="community" label="Community" rules={[{ required: true }]}>
							<Input disabled />
						</Form.Item>
						<Row gutter={[16, 16]}>
							<Col>
								<Form.Item name="date" label="Date" rules={[{ required: true }]}>
									<DatePicker /*disabledDate={disabledDate}*/ format="DD.MM.YYYY" />
								</Form.Item>
							</Col>
							<Col>
								<Form.Item name="time" label="Time" rules={[{ required: true }]}>
									<TimePicker
										placeholder={formData?.date ? 'Select time' : 'Select date before'}
										disabled={!formData?.date}
										format="HH:mm"
										minuteStep={30}
										// disabledTime={disabledTime}
										showNow={false}
									/>
								</Form.Item>
							</Col>
							<Col>
								<Form.Item name="duration" label="Duration, minutes" rules={[{ required: true }]}>
									<InputNumber step={15} min={15} max={120} />
								</Form.Item>
							</Col>
						</Row>
						<Form.Item name="description" label="Description" rules={[{ required: true }]}>
							<Input.TextArea rows={6} />
						</Form.Item>

						<Form.Item
							name="price"
							label="Price"
							rules={[{ required: true }]}
							tooltip="How much would you like to receive for this lecture?"
							help={`This is equal to about ${Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(rate?.fiat || 0)}`}
						>
							<InputNumber addonAfter="TON" min={1} step={0.01} />
						</Form.Item>
						<Alert style={{ marginTop: 30 }} message={`The cost of creating a lecture is 1 TON (~$${rate?.one})`} />
					</Form>
				</Spin>
			</Modal>
		</>
	)
}

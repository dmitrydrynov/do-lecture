import { useContext, useEffect, useState } from 'react'
import { TonContext } from '@/contexts/ton-context'
import { LectureContractConnector } from '@/services/ton/lecture-connector'
import { fetcher } from '@/helpers/fetcher'
import { Alert, Col, DatePicker, Form, Input, InputNumber, message, Modal, Row, Spin, TimePicker } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import dayjs, { Dayjs } from 'dayjs'
import useSWR from 'swr'
import useSWRMutation, { SWRMutationResponse } from 'swr/mutation'
import { Address } from 'ton'
import { LectureConfig } from 'lecture-contract/wrappers/Lecture'

interface AddLectureModalParams {
	open: boolean
	onFinish: () => void
	onCancel: () => void
}

export const AddLectureModal = ({ open, onFinish, onCancel }: AddLectureModalParams) => {
	const [form] = useForm()
	const { connector, userWallet } = useContext(TonContext)
	const [formData, setFormData] = useState<any>()
	const [creating, setCreating] = useState(false)
	const [messageApi, contextHolder] = message.useMessage()
	const { data: rate } = useSWR(['/api/rates', { coins: formData?.price || 10 }], fetcher)
	const { trigger: addLecture, isMutating: newLectureAdding }: SWRMutationResponse<any, any, any> = useSWRMutation('/api/lecture/add', (url, { arg }: any) => fetcher([url, arg]))

	useEffect(() => {
		if (open) {
			form.resetFields()
			form.setFieldsValue({ price: 10, duration: 30 })
		}
	}, [open])

	const handleAddPaidLecture = async () => {
		if (!userWallet || !connector) return

		const data = await form.validateFields()

		try {
			setCreating(true)
			messageApi.open({
				type: 'loading',
				content: 'Waiting...',
				duration: 0,
				key: 'creatingProcess',
			})

			const startTime = data.date.set('hour', data.time.hour()).set('minute', data.time.minute()).set('second', 0)
			const config: LectureConfig = {
				startTime: startTime.unix(),
				managerAddress: Address.parse('kQB6LmhSEwtpVlX5RPU90t0DPoYgituWnFbOpi78VKcdrCuN'),
				lecturerAddress: Address.parse(userWallet.account.address),
				goal: data.price || 0,
			}

			const lc = LectureContractConnector.init(connector)
			const result = await lc.deploy(config)

			if (result.hasOwnProperty('error')) {
				throw new Error(result.error)
			}

			await addLecture({
				title: data.title,
				description: data.description,
				date: startTime.toISOString(),
				contractAddress: result.lectureAddress,
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
					<Form form={form} layout="vertical" requiredMark="optional" initialValues={{ duration: 30 }} onValuesChange={(_, values) => setFormData(values)}>
						<Form.Item name="title" label="Title" rules={[{ required: true }]}>
							<Input />
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

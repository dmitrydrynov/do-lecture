import { useContext, useEffect, useState } from 'react'
import { Alert, Button, Col, DatePicker, Form, Input, InputNumber, message, Modal, Row, Spin, TimePicker, Typography } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import dayjs, { Dayjs } from 'dayjs'
import useSWR from 'swr'
import useSWRMutation, { SWRMutationResponse } from 'swr/mutation'
import { Address, Cell, toNano } from 'ton-core'
import { SettingsContext } from '@/contexts/settings'
import { TonContext } from '@/services/ton/context'
import { fetcher } from '@/helpers/fetcher'
import { code, wrapper } from 'lecture-contract'

const { Lecture } = wrapper
const { Title, Text } = Typography

interface AddLectureModalParams {
	open: boolean
	onFinish: () => void
	onCancel: () => void
}

export const AddLectureModal = ({ open, onFinish, onCancel }: AddLectureModalParams) => {
	const [form] = useForm()
	const { isConnected, provider, userWallet } = useContext(TonContext)
	const settings = useContext(SettingsContext)
	const [formData, setFormData] = useState<any>()
	const [creating, setCreating] = useState(false)
	const [messageApi, contextHolder] = message.useMessage()
	const { data: rate } = useSWR(['/api/rates', { coins: formData?.price || 10 }], fetcher)
	const { data: community } = useSWR(['/api/community', {}], fetcher)
	const { trigger: addLecture, isMutating: newLectureAdding }: SWRMutationResponse<any, any, any> = useSWRMutation('/api/lecture/add', (url, { arg }: any) => fetcher([url, arg]))

	useEffect(() => {
		return () => {
			messageApi.destroy('creatingProcess')
		}
	}, [])

	useEffect(() => {
		if (open) {
			form.resetFields()
			form.setFieldsValue({ price: 10, duration: 30 })
		}
	}, [open])

	const handleAddPaidLecture = async () => {
		if (!settings?.serviceWallet || !userWallet || !isConnected || !provider) return

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
			const startTime = data.date.set('hour', data.time.hour()).set('minute', data.time.minute()).set('second', 0)
			const lecture = provider.open(
				Lecture.createFromConfig(
					{
						startTime: startTime.unix(),
						goal: toNano(data.price),
						serviceAddress: Address.parse(settings.serviceWallet),
						managerAddress: Address.parse(community.managerAddress),
						lecturerAddress: Address.parse(userWallet.account.address),
					},
					initCode
				)
			)

			await lecture.sendDeploy(provider.sender())

			messageApi.open({
				content: `The transaction sent. The lecture deploying...`,
				duration: 0,
				key: 'creatingProcess',
			})

			await provider.waitForDeploy(lecture.address, 60)

			await addLecture({
				community: data.community,
				title: data.title,
				description: data.description,
				date: startTime.toISOString(),
				contractAddress: lecture.address.toString(),
				price: data.price,
				duration: data.duration,
			})

			messageApi.open({
				type: 'success',
				content: `New lecture was published`,
				key: 'creatingProcess',
			})

			onFinish()
			setCreating(false)
		} catch (e: any) {
			if (e.message)
				messageApi.open({
					type: 'error',
					content: e.message,
					key: 'creatingProcess',
				})

			setCreating(false)
			console.error(e)
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

	const handleSaveDraft = async () => {
		setCreating(true)

		try {
			const data = await form.validateFields()
			const startTime = data.date.set('hour', data.time.hour()).set('minute', data.time.minute()).set('second', 0)

			await addLecture({
				community: data.community,
				title: data.title,
				description: data.description,
				date: startTime.toISOString(),
				contractAddress: null,
				price: data.price,
				duration: data.duration,
				isDraft: true,
			})

			messageApi.success('New lecture was saved as draft')
			onFinish()
		} catch (e: any) {
			if (e.message) messageApi.error(e.message)
		}

		setCreating(false)
	}

	return (
		<>
			{contextHolder}
			<Modal
				forceRender
				open={open}
				maskClosable={false}
				confirmLoading={newLectureAdding || creating}
				onCancel={onCancel}
				footer={[
					<Button key="cancel" onClick={onCancel}>
						Cancel
					</Button>,
					<Button key="save-draft" onClick={handleSaveDraft}>
						Save draft
					</Button>,
					<Button key="publish" type="primary" onClick={handleAddPaidLecture}>
						Pay & Publish
					</Button>,
				]}
				title={
					<>
						<Title level={3} style={{ marginBottom: 0 }}>
							New lecture
						</Title>
						<Text type="secondary" style={{ fontWeight: 'normal' }}>
							for {community?.name}
						</Text>
					</>
				}
			>
				<Spin spinning={newLectureAdding || creating}>
					<Form
						form={form}
						layout="vertical"
						style={{ marginTop: 30 }}
						requiredMark="optional"
						initialValues={{ duration: 30, community: community?.id }}
						onValuesChange={(_, values) => setFormData(values)}
					>
						<Form.Item name="community" noStyle>
							<Input hidden />
						</Form.Item>
						<Form.Item name="title" label="Title" rules={[{ required: true }]}>
							<Input size="large" />
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
							tooltip="How many money (coins) do you need to collect to give this lecture?"
							help={`This is equal to about ${Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(rate?.fiat || 0)}`}
						>
							<InputNumber addonAfter="TON" min={1} step={0.01} />
						</Form.Item>
						<Alert style={{ marginTop: 30 }} message={`The cost of creating the lecture is 1 TON (~$${rate?.one})`} />
					</Form>
				</Spin>
			</Modal>
		</>
	)
}

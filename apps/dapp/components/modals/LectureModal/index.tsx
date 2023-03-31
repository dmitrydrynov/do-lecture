import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { SettingsContext } from '@/contexts/settings'
import { fetcher } from '@/helpers/fetcher'
import { TonContext } from '@/services/ton/context'
import { Alert, Button, Col, DatePicker, Form, Input, InputNumber, message, Modal, Row, Select, Spin, TimePicker, Typography } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import dayjs, { Dayjs } from 'dayjs'
import { code, wrapper } from 'lecture-contract'
import useSWR from 'swr'
import useSWRMutation, { SWRMutationResponse } from 'swr/mutation'
import { Address, Cell, toNano } from 'ton-core'

const { Lecture } = wrapper
const { Title, Text, Paragraph } = Typography

interface LectureModalParams {
	open: boolean
	lectureId?: string
	onFinish: () => void
	onCancel: () => void
}

export const LectureModal = ({ open, lectureId, onFinish, onCancel }: LectureModalParams) => {
	const [form] = useForm()
	const [modal, modalHolder] = Modal.useModal()
	const { isConnected, provider, userWallet } = useContext(TonContext)
	const settings = useContext(SettingsContext)
	const [formData, setFormData] = useState<any>()
	const [creating, setCreating] = useState(false)
	const [selectedCommunityId, setSelectedCommunityId] = useState<string>()
	const [messageApi, contextHolder] = message.useMessage()
	const { data: rate } = useSWR(['/api/rates', { coins: formData?.price || 10 }], fetcher)
	const { data: communities } = useSWR(['/api/communities/list', {}], fetcher)
	const { data: lectureData, isLoading: loadingData } = useSWR(!!lectureId && ['/api/lecture/get', { id: lectureId }], fetcher)
	const { trigger: saveLecture, isMutating: newLectureAdding }: SWRMutationResponse<any, any, any> = useSWRMutation('/api/lecture/save', (url, { arg }: any) => fetcher([url, arg]))

	useEffect(() => {
		return () => {
			messageApi.destroy('creatingProcess')
		}
	}, [])

	useEffect(() => {
		if (open) {
			form.resetFields()
			form.setFieldsValue({ price: 10, duration: 30 })
			setSelectedCommunityId(undefined)
		}
	}, [open])

	const valuesForNewRecord = useMemo(() => ({ duration: 30, community: undefined }), [])

	useEffect(() => {
		if (!lectureData) return

		form.setFieldsValue({ ...lectureData, date: dayjs(lectureData.date), time: dayjs(lectureData.date) })
		setSelectedCommunityId(lectureData.community[0])
		setFormData(form.getFieldsValue())
	}, [lectureData])

	const publishLecture = async () => {
		if (!settings?.serviceWallet || !userWallet || !isConnected || !provider) return

		const { date, time, ...data } = await form.validateFields()

		try {
			setCreating(true)

			messageApi.open({
				type: 'loading',
				content: 'Confirm the operation in the wallet application. Waiting...',
				duration: 0,
				key: 'creatingProcess',
			})

			const initCode = Cell.fromBoc(Buffer.from(code.hex, 'hex'))[0]
			const startTime = date.set('hour', time.hour()).set('minute', time.minute()).set('second', 0)
			const lecture = provider.open(
				Lecture.createFromConfig(
					{
						startTime: startTime.unix(),
						duration: Number.parseInt(data.duration) * 60,
						goal: toNano(data.price.toString()),
						serviceAddress: Address.parse(settings.serviceWallet),
						managerAddress: Address.parse(communities.find((comm: any) => comm.id == selectedCommunityId)?.managerAddress),
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

			await saveLecture({
				...data,
				date: startTime.toISOString(),
				contractAddress: lecture.address.toString(),
			})

			messageApi.open({
				type: 'success',
				content: `Lecture was published`,
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
			if (!selectedCommunityId) {
				messageApi.error('You should select a community')
				setCreating(false)
				return
			} else {
				form.setFieldValue('community', selectedCommunityId)
			}

			const { date, time, ...data } = await form.validateFields()
			const startTime = date.set('hour', time.hour()).set('minute', time.minute()).set('second', 0)

			const { error } = await saveLecture({
				...data,
				date: startTime.toISOString(),
				contractAddress: null,
				isDraft: true,
			})

			if (error) throw error

			messageApi.success('Lecture was saved as draft')
			onFinish()
		} catch (e: any) {
			if (e.message) messageApi.error(e.message)
		}

		setCreating(false)
	}

	const showDeployConfirm = async (record: any) => {
		if (!selectedCommunityId) {
			messageApi.error('You should select a community')
			return
		} else {
			form.setFieldValue('community', selectedCommunityId)
		}

		await form.validateFields()
		modal.confirm({
			type: 'info',
			title: `Publish`,
			content: (
				<>
					<Paragraph>
						The cost of publishing the lecture is 1 TON.
						<br />
						After publishing, you will not be able to change the data of the lecture.
						<br />
						Lecture cancellation is paid, it costs 0.1 TON.
					</Paragraph>
					<Paragraph>If you agree and ready please press Yes button and approve the transaction in your TON wallet</Paragraph>
				</>
			),
			okText: 'Publish',
			okType: 'primary',
			cancelText: 'No',
			centered: true,
			onOk: publishLecture,
		})
	}

	const communityOptions: any = communities?.map((comm: any) => ({
		label: comm.title,
		value: comm.id,
	}))

	return (
		<>
			{contextHolder}
			{modalHolder}
			<Modal
				forceRender
				centered
				open={open}
				maskClosable={false}
				confirmLoading={newLectureAdding || creating || loadingData}
				onCancel={onCancel}
				footer={[
					<Button key="cancel" onClick={onCancel}>
						Cancel
					</Button>,
					<Button key="save-draft" onClick={handleSaveDraft}>
						Save draft
					</Button>,
					<Button key="publish" type="primary" onClick={showDeployConfirm}>
						Pay & Publish
					</Button>,
				]}
				title={
					<>
						<Title level={3} style={{ marginBottom: 0 }}>
							{lectureId ? 'Edit lecture' : 'New lecture'}
						</Title>
						<Text type="secondary" style={{ fontWeight: 'normal' }}>
							<Row align="middle" wrap={false}>
								<Col>for {!!lectureId && communities.find((comm: any) => comm.id == selectedCommunityId).title}</Col>
								<Col flex={1}>
									{!lectureId && (
										<Select
											value={selectedCommunityId}
											options={communityOptions}
											onSelect={(value?: string) => setSelectedCommunityId(value)}
											style={{ width: '100%' }}
											bordered={false}
											placeholder="Select a community before"
										/>
									)}
								</Col>
							</Row>
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
						initialValues={valuesForNewRecord}
						onValuesChange={(_, values) => setFormData(values)}
					>
						<Form.Item name="id" noStyle>
							<Input hidden />
						</Form.Item>
						<Form.Item name="community" noStyle>
							<Input hidden />
						</Form.Item>
						<Form.Item name="title" label="Title" rules={[{ required: true }]}>
							<Input size="large" />
						</Form.Item>
						<Row gutter={[16, 16]}>
							<Col>
								<Form.Item name="date" label="Date" rules={[{ required: true }]}>
									<DatePicker disabledDate={disabledDate} format="DD.MM.YYYY" />
								</Form.Item>
							</Col>
							<Col>
								<Form.Item name="time" label="Time" rules={[{ required: true }]}>
									<TimePicker
										placeholder={formData?.date ? 'Select time' : 'Select date before'}
										disabled={!formData?.date}
										format="HH:mm"
										minuteStep={30}
										disabledTime={disabledTime}
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
							name="link"
							label="Link to join this lecture"
							rules={[{ required: true, type: 'url' }]}
							tooltip="Will be available for everyone upon successful fundraising for it. For example, a link to a YouTube stream, to a meeting in Zoom or GoogleMeet"
						>
							<Input />
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
						<Alert style={{ margin: '40px 0px' }} message={`The cost of publishing the lecture is 1 TON (~$${rate?.one})`} />
					</Form>
				</Spin>
			</Modal>
		</>
	)
}

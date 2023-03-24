import { Form, InputNumber, Modal } from 'antd'
import { wrapper } from 'lecture-contract'
import { useState } from 'react'

export const BackThisLecture = ({ open, onFinish, onCancel }: any) => {
	const [form] = Form.useForm()
	const [amount, setAmount] = useState(0.1)

	const handleChange = async () => {
		const { amount } = await form.validateFields()

		console.log(amount)

		setAmount(amount)
	}

	return (
		<Modal open={open} onCancel={onCancel} onOk={() => onFinish(amount)} centered title="Back this lecture" okText="Make a contribution">
			<Form form={form}>
				<Form.Item name="amount" label="How much do you want to make a contribution, TON?" rules={[{ required: true }]}>
					<InputNumber defaultValue={2} step={0.1} min={wrapper.Lecture.MINIMUM_PAYMENT} onChange={handleChange} />
				</Form.Item>
			</Form>
		</Modal>
	)
}

import { TonContext } from '@/services/ton/context'
import { Form, InputNumber, Modal } from 'antd'
import { wrapper } from 'lecture-contract'
import { useContext, useState } from 'react'
import { SelectWalletModal } from '../SelectWalletModal'

export const BackThisLecture = ({ open, wait, onFinish, onCancel }: any) => {
	const [form] = Form.useForm()
	const { isConnected } = useContext(TonContext)
	const [amount, setAmount] = useState(2)
	const [isOpenSelectWalletModal, setIsOpenSelectWalletModal] = useState(false)

	const handleChange = async () => {
		const { amount } = await form.validateFields()
		setAmount(amount)
	}

	const handleConnect = () => {
		setIsOpenSelectWalletModal(true)
	}

	if (!isConnected) {
		return (
			<>
				<Modal
					style={{ maxWidth: 360 }}
					open={open}
					onCancel={onCancel}
					onOk={handleConnect}
					centered
					title="Back this lecture"
					okText="Connect to wallet"
					okButtonProps={{ disabled: wait }}
					cancelButtonProps={{ disabled: wait }}
				>
					<p>You need connect to your TON wallet for backing the lecture</p>
				</Modal>

				<SelectWalletModal open={isOpenSelectWalletModal} onClose={() => setIsOpenSelectWalletModal(false)} />
			</>
		)
	}

	return (
		<Modal
			open={open}
			onCancel={onCancel}
			onOk={() => onFinish(amount)}
			centered
			title="Back this lecture"
			okText="Make a contribution"
			okButtonProps={{ disabled: wait }}
			cancelButtonProps={{ disabled: wait }}
		>
			<Form form={form} disabled={wait} layout="vertical">
				<Form.Item name="amount" label="How much do you want to make a contribution, TON?" rules={[{ required: true }]}>
					<InputNumber defaultValue={2} step={0.1} min={wrapper.Lecture.MINIMUM_PAYMENT} onChange={handleChange} />
				</Form.Item>
			</Form>
		</Modal>
	)
}

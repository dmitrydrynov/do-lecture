import { ReactNode, useEffect, useState } from 'react'
import PublicLayout from '@/components/layouts/PublicLayout'
import styles from './style.module.scss'
import { Alert, Button, Col, Form, Input, Row, Space, Spin, Typography, message } from 'antd'
import Head from 'next/head'
import useSWR from 'swr'
import { fetcher } from '@/helpers/fetcher'
import useSWRMutation, { SWRMutationResponse } from 'swr/mutation'
import { TLoginButton, TLoginButtonSize } from 'react-telegram-auth'

type TelegramUser = Readonly<{
	auth_date: number
	first_name: string
	last_name?: string | undefined
	hash: string
	id: number
	photo_url?: string | undefined
	username?: string | undefined
}>

const { Title, Text } = Typography

const MyProfilePage = () => {
	const [form] = Form.useForm()
	const [messageApi, refMessage] = message.useMessage()
	const [telegramUser, setTelegramUser] = useState<TelegramUser>()
	const {
		data: profile,
		mutate: refetchProfile,
		isLoading: profileLoading,
	} = useSWR(['/api/my/profile'], fetcher, {
		refreshInterval: 0,
		revalidateOnFocus: false,
		revalidateOnMount: true,
	})
	const { trigger: saveProfile, isMutating: profileUpdating }: SWRMutationResponse<any, any, any> = useSWRMutation('/api/my/profile/save', (url, { arg }: any) =>
		fetcher([url, arg])
	)

	useEffect(() => {
		setTelegramUser(undefined)
	}, [])

	useEffect(() => {
		if (profile) {
			const { firstName, lastName, speciality, experience, photoUrl } = profile

			form.setFieldsValue({
				firstName,
				lastName,
				speciality,
				experience,
				photoUrl,
			})
		}
	}, [profile])

	const handleSubmit = async () => {
		const values = await form.validateFields()

		try {
			const res = await saveProfile(values)

			if (res?.error) throw Error(res.error)

			messageApi.success('Your profile updated')
		} catch (error: any) {
			messageApi.error(error.message)
		}
	}

	const handleTelegramAuth = (tgUser: TelegramUser) => {
		setTelegramUser(tgUser)

		form.resetFields(['telegramId', 'telegramUsername'])
		form.setFieldValue('telegramId', tgUser.id)
		form.setFieldValue('telegramUsername', tgUser.username)
	}

	return (
		<>
			{refMessage}
			<Head>
				<title>My Profile</title>
			</Head>
			<main className={styles.main}>
				<Title>My profile</Title>
				<Text type="secondary">Information about you will be placed on the pages of your lectures</Text>

				<Spin spinning={profileUpdating || profileLoading}>
					<Form form={form} layout="vertical" style={{ marginTop: 32 }}>
						<Row gutter={[16, 8]} wrap>
							<Col span={12}>
								<Row gutter={[16, 8]} wrap>
									<Col span={12}>
										<Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
											<Input />
										</Form.Item>
									</Col>
									<Col span={12}>
										<Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
											<Input />
										</Form.Item>
									</Col>
								</Row>
								<Row gutter={[16, 8]}>
									<Col span={24}>
										<Form.Item name="speciality" label="Speciality" rules={[{ required: true }]}>
											<Input />
										</Form.Item>
									</Col>
								</Row>
								<Row gutter={[16, 8]}>
									<Col span={24}>
										<Form.Item name="experience" label="Experience" rules={[{ required: true }]}>
											<Input.TextArea rows={8} />
										</Form.Item>
									</Col>
								</Row>
							</Col>
							<Col span={12}></Col>
						</Row>

						{/* <Row gutter={[16, 8]}>
							<Col>
								<Form.Item name="telegramId" label="Telegram account" rules={[{ required: true, message: 'Please connect to your Telegram account' }]}>
									<Input hidden />
									{!telegramUser && (
										<TLoginButton
											botName="DeLectureBot"
											buttonSize={TLoginButtonSize.Medium}
											cornerRadius={8}
											onAuthCallback={handleTelegramAuth}
											requestAccess="write"
											additionalClassNames={styles.telegramButton}
										/>
									)}
									{!!telegramUser && <Alert message={'Connected to @' + telegramUser.username} />}
								</Form.Item>
								<Form.Item name="telegramUsername" noStyle hidden>
									<Input />
								</Form.Item>
							</Col>
						</Row> */}

						<Button type="primary" size="large" onClick={handleSubmit} style={{ marginTop: 16 }}>
							Save profile
						</Button>
					</Form>
				</Spin>
			</main>
		</>
	)
}

MyProfilePage.getLayout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>

export default MyProfilePage

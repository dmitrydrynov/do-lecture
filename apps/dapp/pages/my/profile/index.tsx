import { ReactNode, useEffect } from 'react'
import PublicLayout from '@/components/layouts/PublicLayout'
import styles from '@/styles/Home.module.css'
import { Button, Col, Form, Input, Row, Typography, message } from 'antd'
import Head from 'next/head'
import useSWR from 'swr'
import { fetcher } from '@/helpers/fetcher'
import useSWRMutation, { SWRMutationResponse } from 'swr/mutation'
import { defaultCookie } from 'config/cookie'
import { withIronSessionSsr } from 'iron-session/next'

const { Title, Text } = Typography

const MyProfilePage = ({ user }: any) => {
	const [form] = Form.useForm()
	const [messageApi] = message.useMessage()
	const { data: profile, mutate: refetchProfile } = useSWR(['/api/my/profile'], fetcher, {
		refreshInterval: 0,
		revalidateOnFocus: false,
		revalidateOnMount: true,
	})
	const { trigger: saveProfile, isMutating: profileUpdating }: SWRMutationResponse<any, any, any> = useSWRMutation('/api/my/profile/save', (url, { arg }: any) =>
		fetcher([url, arg])
	)

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
		try {
			const values = await form.validateFields()

			await saveProfile(values)

			messageApi.success('Your profile updated')
		} catch (error: any) {
			messageApi.error(error.message)
		}
	}

	return (
		<>
			<Head>
				<title>My Profile</title>
			</Head>
			<main className={styles.main}>
				<Title>My profile</Title>
				<Text type="secondary">Information about you will be placed on the pages of your lectures</Text>

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

					<Button type="primary" size="large" onClick={handleSubmit}>
						Save profile
					</Button>
				</Form>
			</main>
		</>
	)
}

MyProfilePage.getLayout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>

// export const getServerSideProps = withIronSessionSsr(async function getServerSideProps({ req }) {
//   console.log('session', req?.session)
// 	return {
// 		props: {
// 			user: req?.session?.user || null,
// 		},
// 	}
// }, defaultCookie)

// export default MyProfilePage

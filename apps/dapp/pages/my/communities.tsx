import { ReactNode, useContext, useState } from 'react'
import PublicLayout from '@/components/layouts/PublicLayout'
import { MyLectures } from '@/components/MyLectures'
import { TonContext } from '@/services/ton/context'
import styles from './style.module.css'
import { Button, Col, Row, Space, Typography } from 'antd'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { HiPlusSm } from 'react-icons/hi'
import Script from 'next/script'
import { TLoginButton, TLoginButtonSize } from 'react-telegram-auth'

const { Title } = Typography
const LectureModal = dynamic(() => import('@/components/modals/LectureModal').then((r) => r.LectureModal), { ssr: false })

const MyCommunitiesPage = ({ user }: any) => {
	const { connector } = useContext(TonContext)
	const [lectureModalOpen, setLectureModalOpen] = useState(false)
	const [lectureAdded, setLectureAdded] = useState(false)

	const handleAddLecture = () => {
		setLectureModalOpen(false)
		setLectureAdded(true)
	}

	return (
		<>
			<Head>
				<title>My Communities</title>
			</Head>
			<main className={styles.main}>
				{connector?.connected && (
					<Space direction="vertical" size="large" style={{ width: '100%' }}>
						<Row align="middle" justify="space-between">
							<Col>
								<Title>My communities</Title>
							</Col>
							<Col>
								<Space align="center">
									<TLoginButton
										botName="DeLectureBot"
										buttonSize={TLoginButtonSize.Medium}
										lang="en"
										usePic={false}
										cornerRadius={12}
										onAuthCallback={(user: any) => {
											console.log('Hello, user!', user)
										}}
										requestAccess={'write'}
										additionalClassNames={styles.telegramLoginBtn}
									/>
									<Button type="primary" onClick={() => setLectureModalOpen(true)}>
										<Space align="center">
											<HiPlusSm style={{ display: 'block' }} />
											Add new
										</Space>
									</Button>
								</Space>
							</Col>
						</Row>

						<MyLectures forceUpdate={lectureAdded} onUpdate={() => setLectureAdded(false)} />

						<LectureModal open={lectureModalOpen} onFinish={handleAddLecture} onCancel={() => setLectureModalOpen(false)} />
					</Space>
				)}
			</main>
		</>
	)
}

MyCommunitiesPage.getLayout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>

export default MyCommunitiesPage

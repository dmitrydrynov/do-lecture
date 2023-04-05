import { ReactNode, useContext, useState } from 'react'
import PublicLayout from '@/components/layouts/PublicLayout'
import { MyLectures } from '@/components/MyLectures'
import { TonContext } from '@/services/ton/context'
import styles from '@/styles/Home.module.css'
import { Button, Col, Row, Space, Typography } from 'antd'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { HiPlusSm } from 'react-icons/hi'
import useSWR from 'swr'
import { fetcher } from '@/helpers/fetcher'
import Link from 'next/link'

const { Title, Text } = Typography
const LectureModal = dynamic(() => import('@/components/modals/LectureModal').then((r) => r.LectureModal), { ssr: false })

const MyLecturesPage = ({ user }: any) => {
	const { connector } = useContext(TonContext)
	const [lectureModalOpen, setLectureModalOpen] = useState(false)
	const [lectureAdded, setLectureAdded] = useState(false)
	const { data: hasProfile, mutate: checkProfile } = useSWR(connector?.connected ? ['/api/my/profile/check'] : null, fetcher, {
		refreshInterval: 0,
		revalidateOnFocus: false,
		revalidateOnMount: true,
	})

	const handleAddLecture = () => {
		setLectureModalOpen(false)
		setLectureAdded(true)
	}

	return (
		<>
			<Head>
				<title>My Lectures</title>
			</Head>
			<main className={styles.main}>
				{connector?.connected && (
					<Space direction="vertical" size="large" style={{ width: '100%' }}>
						<Row align="middle" justify="space-between">
							<Col>
								<Title>My lectures</Title>
							</Col>
							<Col>
								{hasProfile && (
									<Button type="primary" onClick={() => setLectureModalOpen(true)}>
										<Space align="center">
											<HiPlusSm style={{ display: 'block' }} />
											Add new
										</Space>
									</Button>
								)}
							</Col>
						</Row>

						{!hasProfile && (
							<Text>
								To organize your lectures, you first need to fill out your profile. Go to <Link href="/my/profile">Profile page</Link> and do it.
							</Text>
						)}

						{hasProfile && (
							<>
								<MyLectures forceUpdate={lectureAdded} onUpdate={() => setLectureAdded(false)} />
								<LectureModal open={lectureModalOpen} onFinish={handleAddLecture} onCancel={() => setLectureModalOpen(false)} />
							</>
						)}
					</Space>
				)}
			</main>
		</>
	)
}

MyLecturesPage.getLayout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>

export default MyLecturesPage

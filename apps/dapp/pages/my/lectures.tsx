import { ReactNode, useContext, useState } from 'react'
import { Button, Space } from 'antd'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import PublicLayout from '@/components/layouts/PublicLayout'
import { MyLectures } from '@/components/MyLectures'
import { TonContext } from '@/services/ton/context'
import { HiPlusSm } from 'react-icons/hi'
import styles from '@/styles/Home.module.css'

const LectureModal = dynamic(() => import('@/components/modals/LectureModal').then((r) => r.LectureModal), { ssr: false })

const MyLecturesPage = ({ user }: any) => {
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
				<title>{process.env.APP_NAME}</title>
				<meta name="description" content="Generated by create next app" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<main className={styles.main}>
				{connector?.connected && (
					<>
						<Space direction="vertical" size="large" style={{ width: '100%' }}>
							<Button type="primary" onClick={() => setLectureModalOpen(true)}>
								<Space align="center">
									<HiPlusSm style={{ display: 'block' }} />
									Create
								</Space>
							</Button>
							<MyLectures forceUpdate={lectureAdded} onUpdate={() => setLectureAdded(false)} />
						</Space>

						<LectureModal open={lectureModalOpen} onFinish={handleAddLecture} onCancel={() => setLectureModalOpen(false)} />
					</>
				)}
			</main>
		</>
	)
}

MyLecturesPage.getLayout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>

export default MyLecturesPage

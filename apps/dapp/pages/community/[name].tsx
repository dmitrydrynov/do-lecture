import { ReactElement } from 'react'
import PublicLayout from '@/components/layouts/PublicLayout'
import { LecturesList } from '@/components/LecturesList'
import { ReadyLecturesList } from '@/components/ReadyLecturesList'
import { fetcher } from '@/helpers/fetcher'
import styles from '@/styles/Home.module.css'
import { Space, Typography } from 'antd'
import { useRouter } from 'next/router'
import useSWR from 'swr'

const { Title, Text } = Typography

const CommunityPage = () => {
	const router = useRouter()
	const { data: community, isLoading } = useSWR(['/api/community', { name: router.query.name }], fetcher, {
		refreshInterval: 15000,
		revalidateOnFocus: false,
		revalidateOnMount: true,
	})

	if (isLoading) return <>Loading...</>

	return (
		<>
			<main className={styles.main}>
				<div className={styles.mainIntro}>
					<Title>{community?.title} lectures</Title>
					<Text type="secondary">{community?.description}</Text>
				</div>
				<Space direction="vertical" size="large" style={{ width: '100%' }}>
					<LecturesList community={router.query.name} />
					<br />
					<ReadyLecturesList community={router.query.name} />
				</Space>
			</main>
		</>
	)
}

CommunityPage.getLayout = (page: ReactElement) => <PublicLayout>{page}</PublicLayout>

export default CommunityPage

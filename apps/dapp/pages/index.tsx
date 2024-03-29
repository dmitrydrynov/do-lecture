import { ReactElement } from 'react'
import PublicLayout from '@/components/layouts/PublicLayout'
import { LecturesList } from '@/components/LecturesList'
import { ReadyLecturesList } from '@/components/ReadyLecturesList'
import { withSessionSsr } from '@/helpers/withSession'
import Api from '@/services/api'
import styles from '@/styles/Home.module.css'
import { Space, Typography } from 'antd'

const { Title, Text } = Typography

const Home = () => {
	return (
		<>
			<main className={styles.main}>
				<div className={styles.mainIntro}>
					<Title>Decentralized crowdfunding for lectures</Title>
					<Text type="secondary">Share knowledge with your community. This is a platform where you can find funding for interesting lectures</Text>
				</div>
				<Space direction="vertical" size="large" style={{ width: '100%' }}>
					<LecturesList />
					<br />
					<ReadyLecturesList />
				</Space>
			</main>
		</>
	)
}

Home.getLayout = (page: ReactElement) => <PublicLayout>{page}</PublicLayout>

export const getServerSideProps = withSessionSsr(async function getServerSideProps({ req, query }) {
	if (query?.hash) {
		// try login by telegram
		const loggedUser = await Api.loginByTelegram(query)

		if (loggedUser) {
			req.session.user = {
				id: loggedUser.id,
				telegram: { username: loggedUser.telegramUsername, id: loggedUser.telegramId, firstName: loggedUser.telegramName, photoUrl: loggedUser.telegramPhoto },
			}
			await req.session.save()

			return {
				redirect: {
					destination: '/',
				},
				props: {},
			}
		}
	}

	return {
		props: {},
	}
})

export default Home

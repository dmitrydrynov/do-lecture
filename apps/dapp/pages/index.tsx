import { ReactElement, useContext, useState } from 'react'
import PublicLayout from '@/components/layouts/PublicLayout'
import { LecturesList } from '@/components/LecturesList'
import styles from '@/styles/Home.module.css'
import { Space, Typography } from 'antd'
import Head from 'next/head'
import { ReadyLecturesList } from '@/components/ReadyLecturesList'
import { withIronSessionSsr } from 'iron-session/next'
import { sessionOptions } from 'config/sessions'
import TelegramService from '@/services/telegram'
import Api from '@/services/api'

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

export const getServerSideProps = withIronSessionSsr(async function getServerSideProps({ req, query }) {
	// const user = req.session.user;
	if (query?.hash) {
		const tgValidated = TelegramService.verifyAuthorization(query)

		if (tgValidated) {
			const user = await Api.loginByTelegram(query)

			return {
				props: {
					user,
				},
			}
		}
	}

	return {
		props: {
			// user: req.session.user,
		},
	}
}, sessionOptions)

export default Home

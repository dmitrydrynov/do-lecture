import { ReactNode } from 'react'
import PublicLayout from '@/components/layouts/PublicLayout'
import styles from './style.module.css'
import { Avatar, Button, Col, Grid, List, Row, Typography } from 'antd'
import Head from 'next/head'
import useSWR from 'swr'
import { fetcher } from '@/helpers/fetcher'
import Link from 'next/link'

const { Title, Text } = Typography

const CommunitiesPage = () => {
	const screens = Grid.useBreakpoint()
	const { data: communitiesList, isLoading } = useSWR(['/api/communities/list', {}], fetcher, {
		refreshInterval: 15000,
		revalidateOnFocus: false,
		revalidateOnMount: true,
	})

	return (
		<>
			<Head>
				<title>Communities</title>
			</Head>
			<main className={styles.main}>
				<Title style={{ textAlign: 'center' }}>
					List of professional communities
					<Title type="secondary" level={3}>
						where lecturers can propose thier lectures
					</Title>
				</Title>

				<List
					loading={isLoading}
					bordered
					dataSource={communitiesList}
					renderItem={(community: any) => {
						return (
							<List.Item
								actions={
									screens.md
										? [
												<Link href={`/community/${community.name}`} key="comm-lectures-link">
													<Button>Lectures</Button>
												</Link>,
												<Link href={community.link} target="_blank" key="comm-join-btn">
													<Button type="text">Join to community</Button>
												</Link>,
										  ]
										: undefined
								}
							>
								<List.Item.Meta
									avatar={screens.sm && <Avatar src={community.thumbLink} shape="square" size="large" />}
									title={community.title}
									description={
										<>
											{community.description}
											{!screens.md ? (
												<Row style={{ marginTop: 16 }} gutter={[16, 16]} wrap>
													<Col>
														<Link href={`/community/${community.name}`} key="comm-lectures-link">
															<Button>Lectures</Button>
														</Link>
													</Col>
													<Col>
														<Link href={community.link} target="_blank" key="comm-join-btn">
															<Button>Join to community</Button>
														</Link>
													</Col>
												</Row>
											) : undefined}
										</>
									}
								/>
							</List.Item>
						)
					}}
				/>
			</main>
		</>
	)
}

CommunitiesPage.getLayout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>

export default CommunitiesPage

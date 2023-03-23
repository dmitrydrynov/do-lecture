import { ReactNode } from 'react'
import { Button, Col, List, Row, Space, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import styles from './style.module.css'
import { ContributionList } from '@/components/ContributionList'
import { AppCountdown } from '@/components/Countdown'
import PublicLayout from '@/components/layouts/PublicLayout'
import { getFetcher } from '@/helpers/fetcher'
import { renderPrice } from '@/helpers/utils'

const { Text, Paragraph, Title } = Typography

const LecturePage = () => {
	const router = useRouter()
	const { id } = router.query
	const { data, isLoading } = useSWR(['/api/lecture', { id }], getFetcher, {
		refreshInterval: 10000,
	})

	const detailsData = [
		{
			label: 'Stage',
			value: (
				<Tag color="success" style={{ marginRight: 0 }}>
					On {data?.stage}
				</Tag>
			),
		},
		{
			label: 'Funding amount',
			value: renderPrice(data?.meta?.goal),
		},
		{
			label: 'Minimum contribution',
			value: renderPrice(100000000),
		},
	]

	if (!data && isLoading) {
		return <>Loading...</>
	}

	if (data.error) {
		return <>Error: {data.error}</>
	}

	return (
		<>
			<Typography>
				<Text type="secondary">{data.communityName}</Text>
				<br />
				<Title>{data.title}</Title>
				<Paragraph>
					<Text>Date: {dayjs(data.date).format('DD/MM/YYYY')}</Text>
					<br />
					<Text type="secondary">Duration is about {data.duration} minutes</Text>
				</Paragraph>
				<Paragraph>{data.description}</Paragraph>
			</Typography>
			<Row gutter={[64, 64]} wrap style={{ marginTop: 64 }}>
				<Col span={12}>
					<List
						className={styles.detailsList}
						itemLayout="horizontal"
						dataSource={detailsData}
						renderItem={(item) => (
							<List.Item>
								<Row wrap justify="space-between" style={{ width: '100%' }}>
									<Text>{item.label}</Text>
									{item.value}
								</Row>
							</List.Item>
						)}
					/>
					<Row gutter={[64, 64]} wrap style={{ marginTop: 24 }}>
						<Col flex={1}>
							<Space>
								<Button type="primary" size="large" onClick={() => {}}>
									Fund the lecture
								</Button>
							</Space>
						</Col>
						<Col>
							<AppCountdown date={data.date} />
						</Col>
					</Row>
				</Col>
				<Col span={12}></Col>
			</Row>

			{data.meta.paymentCount > 0 && (
				<Typography style={{ marginTop: 64 }}>
					<Title level={4}>Contribution history</Title>
					<ContributionList />
				</Typography>
			)}
		</>
	)
}

LecturePage.getLayout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>

export default LecturePage

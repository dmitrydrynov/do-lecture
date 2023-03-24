import { ReactNode, useContext, useMemo, useState } from 'react'
import { ContributionList } from '@/components/ContributionList'
import { AppCountdown } from '@/components/Countdown'
import PublicLayout from '@/components/layouts/PublicLayout'
import { getFetcher } from '@/helpers/fetcher'
import { renderPrice } from '@/helpers/utils'
import { Button, Col, List, Row, Space, Tag, Typography, message } from 'antd'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import styles from './style.module.css'
import { Address, fromNano, toNano } from 'ton'
import { TonContext } from '@/services/ton/context'
import { wrapper } from 'lecture-contract'
import { BackThisLecture } from '@/components/modals/BackThisLecture'
import lecture from '../api/lecture'

const { Text, Paragraph, Title } = Typography
const { Lecture } = wrapper

const LecturePage = () => {
	const { provider } = useContext(TonContext)
	const router = useRouter()
	const [isOpenBackThisLecture, setIsOpenBackThisLecture] = useState(false)
	const [messageApi, contextHolder] = message.useMessage()
	const { id } = router.query
	const { data, isLoading } = useSWR(['/api/lecture', { id }], getFetcher, {
		refreshInterval: 10000,
	})

	const detailsData = useMemo(() => {
		if (!data) return

		return [
			{
				label: 'Stage',
				value: (
					<Tag color="success" style={{ marginRight: 0 }}>
						{data.stage}
					</Tag>
				),
			},
			{
				label: 'Backers',
				value: data.meta.paymentCount,
			},
			{
				label: 'Goal',
				value: renderPrice(fromNano(data.meta.goal)),
			},
			{
				label: 'Minimum contribution',
				value: renderPrice(fromNano(100000000)),
			},
		]
	}, [data])

	const handleBackThisLecture = async (amount: number) => {
		if (!provider || !data) return

		try {
			const lectureContract = await provider.open(Lecture.createFromAddress(Address.parse(data.contractAddress)))
			await lectureContract.sendPay(provider.sender(), toNano(amount.toString()))
		} catch (e: any) {
			messageApi.error(e.message || 'Оплата лекции не прошла')
			console.error(e)
		}
	}

	if (!data && isLoading) {
		return <>Loading...</>
	}

	if (data?.error) {
		return <>Error: {data.error}</>
	}

	return (
		<>
			{contextHolder}
			<Typography>
				<Title style={{ marginBottom: 0 }}>{data.title}</Title>
				<Text type="secondary" style={{ fontSize: '18px' }}>
					The lecture for {data.communityName}
				</Text>
				<Paragraph style={{ marginTop: 16 }}>
					<Text>Date: {dayjs(data.date).format('D MMM [at] hh:mm a')}</Text>
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
								<Button type="primary" size="large" onClick={() => setIsOpenBackThisLecture(true)}>
									Back this lecture
								</Button>
							</Space>
						</Col>
						<Col>
							<AppCountdown date={dayjs(data.date).subtract(2, 'hours').toISOString()} />
						</Col>
					</Row>
				</Col>
				<Col span={12}></Col>
			</Row>

			{data.meta.paymentCount > 0 && (
				<Typography style={{ marginTop: 64 }}>
					<Title level={4}>Contribution history</Title>
					<ContributionList lectureId={id} />
				</Typography>
			)}

			<BackThisLecture open={isOpenBackThisLecture} onCancel={() => setIsOpenBackThisLecture(false)} onFinish={handleBackThisLecture} />
		</>
	)
}

LecturePage.getLayout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>

export default LecturePage

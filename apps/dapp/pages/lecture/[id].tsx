import { ReactNode, useContext, useMemo, useState } from 'react'
import { ContributionList } from '@/components/ContributionList'
import { AppCountdown } from '@/components/Countdown'
import PublicLayout from '@/components/layouts/PublicLayout'
import { BackThisLecture } from '@/components/modals/BackThisLecture'
import { fetcher, getFetcher } from '@/helpers/fetcher'
import { renderPrice } from '@/helpers/utils'
import { TonContext } from '@/services/ton/context'
import { sleep } from '@/services/ton/provider'
import { Button, Col, List, Row, Space, Tag, Typography, message, Progress } from 'antd'
import dayjs from 'dayjs'
import { wrapper } from 'lecture-contract'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { HiArrowSmRight } from 'react-icons/hi'
import useSWR from 'swr'
import useSWRMutation, { SWRMutationResponse } from 'swr/mutation'
import { Address, fromNano, toNano } from 'ton'
import styles from './style.module.css'

const { Text, Paragraph, Title } = Typography
const { Lecture } = wrapper

const LecturePage = () => {
	const { provider, userWallet } = useContext(TonContext)
	const router = useRouter()
	const [isOpenBackThisLecture, setIsOpenBackThisLecture] = useState(false)
	const [paymentProcessing, setPaymentProcessing] = useState(false)
	const [messageApi, contextHolder] = message.useMessage()
	const { id } = router.query
	const { data, isLoading } = useSWR(['/api/lecture', { id }], getFetcher, {
		refreshInterval: 10000,
	})
	const { trigger: checkLectureStage }: SWRMutationResponse<any, any, any> = useSWRMutation('/api/lecture/check-stage', (url, { arg }) => fetcher([url, arg]))

	const calculateProgress = (lecture: any) => {
		if (!lecture.meta) return 0

		const percent = (lecture.meta.goal - lecture.meta.left) / lecture.meta.goal

		return Math.ceil(percent * 100)
	}

	const detailsData = useMemo(() => {
		if (!data) return

		const details = [
			{
				label: 'Stage',
				value: (
					<>
						<Tag color="success" style={{ marginRight: 0 }}>
							{data.stage}
						</Tag>

						<Progress showInfo={true} strokeWidth={16} percent={calculateProgress(data)} strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} style={{ marginTop: 8 }} />
					</>
				),
			},
			{
				label: 'Backers',
				value: data.meta?.paymentCount,
			},
			{
				label: 'Goal',
				value: data.meta?.goal ? renderPrice(fromNano(data.meta?.goal)) : data.price,
			},
			{
				label: 'Minimum contribution',
				value: renderPrice(fromNano(100000000)),
			},
		]

		return details
	}, [data])

	const handleBackThisLecture = async (amount: number) => {
		if (!provider || !data || !userWallet) return

		setPaymentProcessing(true)
		messageApi.open({
			type: 'loading',
			content: 'Confirm the operation in the wallet application. Waiting...',
			duration: 0,
			key: 'paymentProcess',
		})

		try {
			const lectureContract = await provider.open(Lecture.createFromAddress(Address.parse(data.contractAddress)))
			await lectureContract.sendPay(provider.sender(), toNano(amount.toString()))

			let attempt = 0
			const userPayments = await lectureContract.getPaymentsByUser(Address.parse(userWallet.account.address))
			let newLength = userPayments?.length
			while (userPayments?.length == newLength && attempt < 30) {
				await sleep(2000)

				const _userPayments = await lectureContract.getPaymentsByUser(Address.parse(userWallet.account.address))
				newLength = _userPayments?.length
				attempt++
			}

			await checkLectureStage({ id })

			setIsOpenBackThisLecture(false)
			messageApi.open({
				type: 'success',
				content: 'Successful',
				key: 'paymentProcess',
			})
		} catch (e: any) {
			messageApi.open({
				type: 'error',
				content: e.message || 'Something wrong. Try again later',
				key: 'paymentProcess',
			})
			console.error(e)
		}

		setPaymentProcessing(false)
	}

	if (!data && isLoading) {
		return <>Loading...</>
	}

	if (data?.error) {
		return <>Error: {data.error}</>
	}

	return (
		<main className={styles.main}>
			<Head>
				<title>{data?.title}</title>
				<meta property="og:title" content={data?.title} key="title" />
				<meta name="description" content={data?.description} key="description" />
			</Head>
			{contextHolder}

			<Typography>
				<Title style={{ marginBottom: 0 }}>{data.title}</Title>
				<Text type="secondary" style={{ fontSize: '18px' }}>
					The lecture for {data.communityTitle}
				</Text>
				<Paragraph style={{ marginTop: 16 }}>
					<Text>Date: {dayjs(data.date).format('D MMM [at] hh:mm a')}</Text>
					<br />
					<Text type="secondary">Duration is about {data.duration} minutes</Text>
					<div>
						Status: <Tag color="warning" >{data.stage}</Tag>
					</div>
				</Paragraph>

				<Row gutter={[64, 16]} wrap style={{ marginTop: 32 }} justify="space-between">
					<Col lg={{ span: 13 }} xs={{ span: 24 }}>
						<Paragraph>{data.description}</Paragraph>
					</Col>
					<Col lg={{ offset: 1, span: 10 }} xs={{ span: 24 }}>
						{data.status == 'published' && (
							<Space direction="vertical" size="large" style={{ width: '100%' }}>
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
								{['funding', 'run-up'].includes(data.stage) && <AppCountdown date={dayjs(data.date).subtract(2, 'hours').toISOString()} />}
								<Row gutter={[16, 16]} justify="center" style={{ marginTop: 16 }}>
									{['funding', 'run-up'].includes(data.stage) && (
										<Col>
											<Button type={data.stage == 'funding' ? 'primary' : 'default'} size="large" onClick={() => setIsOpenBackThisLecture(true)}>
												Back this lecture
											</Button>
										</Col>
									)}
									{['implementation', 'completing', 'run-up'].includes(data.stage) && (
										<Col>
											<Link href={data.link} target="_blank">
												<Button type="primary" size="large">
													Go to lecture <HiArrowSmRight style={{ height: 16, position: 'relative', top: 3 }} />
												</Button>
											</Link>
										</Col>
									)}
								</Row>
							</Space>
						)}
					</Col>
				</Row>
			</Typography>

			{data.meta?.paymentCount > 0 && (
				<Typography style={{ marginTop: 64 }}>
					<Title level={4}>Contribution history</Title>
					<ContributionList lectureId={id} />
				</Typography>
			)}

			<BackThisLecture open={isOpenBackThisLecture} wait={paymentProcessing} onCancel={() => setIsOpenBackThisLecture(false)} onFinish={handleBackThisLecture} />
		</main>
	)
}

LecturePage.getLayout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>

export default LecturePage

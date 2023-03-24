import { fetcher } from '@/helpers/fetcher'
import { Progress, Table, Typography } from 'antd'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { HiOutlineChevronRight } from 'react-icons/hi'
import useSWR from 'swr'
import { fromNano } from 'ton'
import styles from './style.module.css'

const { Text } = Typography

export const LecturesList = () => {
	const route = useRouter()
	const { data, isLoading } = useSWR(['/api/lectures'], fetcher, {
		refreshInterval: 10000,
	})

	const calculateProgress = (lecture: any) => {
		if (!lecture.meta) return 0

		const percent = (lecture.meta.goal - lecture.meta.left) / lecture.meta.goal

		return Math.ceil(percent * 100)
	}

	const renderPrice = (price: string, style: 'currency' | 'decimal' = 'currency') => {
		if (price == undefined) return null

		return new Intl.NumberFormat('ru', {
			style,
			currency: 'TON',
		}).format(Number.parseFloat(fromNano(price)))
	}

	const columns = [
		{
			key: '1',
			dataIndex: 'title',
			title: 'Title',
			width: '40%',
			render: (title: string, data: any) => {
				return (
					<>
						<Text>{title}</Text>
						<br />
						<Text type="secondary">
							<small>{data.communityName}</small>
						</Text>
					</>
				)
			},
		},
		{
			key: '2',
			dataIndex: 'price',
			title: 'Funding',
			render: (price: number, lecture: any) => {
				return <Progress percent={calculateProgress(lecture)} strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} />
			},
		},
		{
			key: '3',
			dataIndex: 'date',
			width: '200px',
			title: 'Funding ends in',
			render: (date: string) => {
				const endsIn = dayjs(date).subtract(2, 'hours').fromNow(true)
				const parsedDate = dayjs(date).subtract(2, 'hours').format('D MMM YYYY [at] hh:mm')

				return (
					<>
						<Text>{endsIn}</Text>
						<br />
						<Text type="secondary">{parsedDate}</Text>
					</>
				)
			},
		},
		{
			key: 'arrow',
			width: 50,
			render: () => <HiOutlineChevronRight />,
		},
	]

	return (
		<>
			<Table
				className={styles.table}
				rowClassName={styles.tableRow}
				onRow={(record, rowIndex) => {
					return {
						onClick: (event) => {
							route.push(`/lecture/${record.id}`)
						}, // click row
					}
				}}
				loading={isLoading}
				dataSource={data?.map((r: any) => ({ key: r.id, ...r }))}
				columns={columns}
				pagination={false}
			/>
		</>
	)
}

import { useMemo } from 'react'
import { fetcher } from '@/helpers/fetcher'
import { Grid, Progress, Table, Typography } from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { HiOutlineChevronRight } from 'react-icons/hi'
import useSWR from 'swr'
import styles from './style.module.css'

const { Text, Title } = Typography

export const LecturesList = ({ community }: any) => {
	const route = useRouter()
	const screens = Grid.useBreakpoint()
	const { data, isLoading } = useSWR(['/api/lectures/funding', { community }], fetcher, {
		refreshInterval: 10000,
	})

	const calculateProgress = (lecture: any) => {
		if (!lecture.meta) return 0

		const percent = (lecture.meta.goal - lecture.meta.left) / lecture.meta.goal

		return Math.ceil(percent * 100)
	}

	const columns: ColumnsType<any> = useMemo(
		() => [
			{
				key: '1',
				dataIndex: 'title',
				title: 'Lectures',
				width: !screens.md ? '100%' : '40%',
				render: (title: string, data: any) => {
					const parsedDate = dayjs(data.date).subtract(2, 'hours').format('D MMM YYYY [at] hh:mm a')

					return (
						<>
							<Text>{title}</Text>
							<br />
							<Text type="secondary">
								<small>in {data.communityTitle}</small>
							</Text>
							<br />
							{!screens.md && <Text type="secondary">Funding ends in {parsedDate}</Text>}
						</>
					)
				},
			},
			{
				key: '2',
				dataIndex: 'price',
				title: 'Funding',
				responsive: ['md'],
				render: (price: number, lecture: any) => {
					return screens.md ? <Progress percent={calculateProgress(lecture)} strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} /> : calculateProgress(lecture) + '%'
				},
			},
			{
				key: '3',
				dataIndex: 'date',
				responsive: ['md'],
				width: '200px',
				title: 'Funding ends in',
				render: (date: string) => {
					const endsIn = dayjs(date).subtract(2, 'hours').fromNow(true)
					const parsedDate = dayjs(date).subtract(2, 'hours').format('D MMM YYYY [at] hh:mm a')

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
		],
		[screens]
	)

	return (
		<>
			<Title level={4} type="secondary" style={{ textAlign: 'center' }}>
				Looking for funding
			</Title>
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
				dataSource={Array.isArray(data) ? data?.map((r: any) => ({ key: r.id, ...r })) : undefined}
				columns={columns}
				pagination={false}
			/>
		</>
	)
}

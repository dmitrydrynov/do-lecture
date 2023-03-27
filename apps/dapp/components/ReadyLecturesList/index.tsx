import { fetcher } from '@/helpers/fetcher'
import { Grid, Progress, Table, TableColumnType, Typography } from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { HiOutlineChevronRight } from 'react-icons/hi'
import useSWR from 'swr'
import { fromNano } from 'ton'
import styles from './style.module.css'

const { Text } = Typography

export const ReadyLecturesList = () => {
	const route = useRouter()
	const screens = Grid.useBreakpoint()
	const { data, isLoading } = useSWR(['/api/lectures/ready'], fetcher, {
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
				width: screens.xs ? '100%' : '40%',
				render: (title: string, data: any) => {
					const parsedDate = dayjs(data.date).subtract(2, 'hours').format('D MMM YYYY [at] hh:mm')

					return (
						<>
							<Text>{title}</Text>
							<br />
							<Text type="secondary">
								<small>in {data.communityName}</small>
							</Text>
							<br />
							{!screens.md && <Text type="secondary">Funding ends in {parsedDate}</Text>}
						</>
					)
				},
			},
			{
				key: '3',
				dataIndex: 'date',
				responsive: ['md'],
				width: '200px',
				title: 'When',
				render: (date: string) => {
					const endsIn = dayjs(date).fromNow(true)
					const parsedDate = dayjs(date).format('D MMM YYYY [at] hh:mm')

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

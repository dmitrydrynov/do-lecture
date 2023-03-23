import { Table, Typography } from 'antd'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { fromNano } from 'ton'
import styles from './style.module.css'
import { fetcher } from '@/helpers/fetcher'

const { Text } = Typography

export const ContributionList = () => {
	const route = useRouter()
	const { data, isLoading } = useSWR(['/api/lectures/paid'], fetcher, {
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
			key: 'amount',
			dataIndex: 'amount',
			title: 'Amount',
			render: (amount: number) => <Text>{amount}</Text>,
		},
		{
			key: 'date',
			dataIndex: 'date',
			title: 'Date',
			render: (date: number) => <Text>{date}</Text>,
		},
		{
			key: '3address',
			dataIndex: 'senderAddress',
			title: 'From',
			render: (address: string) => <Text>{address}</Text>,
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
				dataSource={data}
				columns={columns}
				pagination={false}
			/>
		</>
	)
}

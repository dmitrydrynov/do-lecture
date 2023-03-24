import { fetcher } from '@/helpers/fetcher'
import { Table, Typography } from 'antd'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { fromNano } from 'ton'
import styles from './style.module.css'
import { renderPrice } from '@/helpers/utils'

const { Text } = Typography

export const ContributionList = ({ lectureId }: any) => {
	const route = useRouter()
	const { data, isLoading } = useSWR(['/api/lecture/payments', { lectureId }], fetcher, {
		refreshInterval: 10000,
	})

	const columns = [
		{
			key: 'value',
			dataIndex: 'value',
			title: 'Amount',
			render: (value: number) => <Text>{renderPrice(fromNano(value))}</Text>,
		},
		{
			key: 'timestamp',
			dataIndex: 'timestamp',
			title: 'Date',
			render: (timestamp: number) => <Text>{timestamp}</Text>,
		},
		{
			key: 'address',
			dataIndex: 'address',
			title: 'From',
			render: (address: string) => <Text>{address}</Text>,
		},
	]

	return (
		<>
			<Table className={styles.table} rowClassName={styles.tableRow} loading={isLoading} dataSource={data} columns={columns} pagination={false} />
		</>
	)
}

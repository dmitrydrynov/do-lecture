import { fetcher } from '@/helpers/fetcher'
import { Grid, Table, Typography } from 'antd'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { fromNano } from 'ton'
import styles from './style.module.css'
import { renderPrice, sliceAddress } from '@/helpers/utils'
import dayjs from 'dayjs'
import { TonCoinSvg } from '../icons/TonCoinSvg'
import Link from 'next/link'
import { useContext } from 'react'
import { TonContext } from '@/services/ton/context'

const { Text } = Typography

export const ContributionList = ({ lectureId }: any) => {
	const sceens = Grid.useBreakpoint()
	const { network } = useContext(TonContext)
	const { data, isLoading } = useSWR(['/api/lecture/payments', { lectureId }], fetcher, {
		refreshInterval: 10000,
	})

	const columns = [
		{
			key: 'value',
			dataIndex: 'value',
			title: 'Amount',
			render: (value: number) => (
				<Text style={{ whiteSpace: 'nowrap' }}>
					<TonCoinSvg /> {renderPrice(fromNano(value), 'decimal')}
				</Text>
			),
		},
		{
			key: 'timestamp',
			dataIndex: 'timestamp',
			title: 'Date',
			render: (timestamp: number) => <Text type="secondary">{dayjs(timestamp * 1000).format('D MMM YYYY [at] hh:mm a')}</Text>,
		},
		{
			key: 'address',
			dataIndex: 'address',
			title: 'From',
			render: (address: string) => (
				<Text ellipsis={true}>
					<Link href={`https://${network == 'testnet' || process.env.NEXT_PUBLIC_IS_TESTNET == 'true' ? 'testnet.' : ''}tonscan.org/address/${address}`} target="_blank">
						{sliceAddress(address, sceens.md ? 16 : 3)}
					</Link>
				</Text>
			),
		},
	]

	return (
		<>
			<Table
				size="small"
				className={styles.table}
				rowClassName={styles.tableRow}
				loading={isLoading}
				dataSource={data}
				columns={columns}
				pagination={data?.length < 10 ? false : {}}
			/>
		</>
	)
}

import { useContext } from 'react'
import { TonContext } from '@/contexts/ton-context'
import { Button, Row, Layout, Col, Space, Tag } from 'antd'
import Link from 'next/link'
import styles from './style.module.css'
import { AuthButton } from '../AuthButton'

const { Header } = Layout

export const AppHeader = () => {
	const { connector, network } = useContext(TonContext)

	return (
		<Header className={styles.header} style={{ position: 'sticky', top: 0, zIndex: 1, width: '100%' }}>
			<Row justify="space-between" align="middle">
				<Col>
					<Link href="/">
						<div
							style={{
								float: 'left',
								width: 120,
								height: 31,
								margin: '16px 24px 16px 0',
								background: 'rgba(255, 255, 255, 0.2)',
							}}
						/>
					</Link>
					{network == 'testnet' && <Tag color="blue">{network}</Tag>}
				</Col>
				<Col>
					<Space>
						{connector?.connected && (
							<Link href="/my/lectures" style={{ marginRight: '10px' }}>
								<Button type="text">My Lectures</Button>
							</Link>
						)}
						<AuthButton />
					</Space>
				</Col>
			</Row>
		</Header>
	)
}

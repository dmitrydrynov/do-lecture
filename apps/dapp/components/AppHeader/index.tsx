import { useContext, useEffect, useState } from 'react'
import { TonContext } from '@/services/ton/context'
import { Button, Row, Layout, Col, Space, Tag, Drawer, Grid, Menu } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { HiMenu } from 'react-icons/hi'
import styles from './style.module.css'
import { AuthButton } from '../AuthButton'
import { TelegramLogin } from '../TelegramLogin'

const { Header } = Layout

export const AppHeader = () => {
	const router = useRouter()
	const screens = Grid.useBreakpoint()
	const { connector, network } = useContext(TonContext)
	const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false)

	useEffect(() => {
		setMobileMenuIsOpen(false)
	}, [screens])

	const handleChangeAuthButton = async () => {
		await router.push('/')
		setMobileMenuIsOpen(false)
	}

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
					{(network == 'testnet' || process.env.NEXT_PUBLIC_IS_TESTNET == 'true') && <Tag color="blue">testnet</Tag>}
				</Col>
				<Col>
					<Space>
						{screens.md ? (
							<>
								<Link href="/communities" style={{ marginRight: '10px' }}>
									<Button type="text">Communities</Button>
								</Link>
								{connector?.connected && (
									<>
										<Link href="/my/lectures" style={{ marginRight: '10px' }}>
											<Button type="text">My Lectures</Button>
										</Link>

										<Link href="/my/profile" style={{ marginRight: '10px' }}>
											<Button type="text">My Profile</Button>
										</Link>
									</>
								)}
								<TelegramLogin onChange={handleChangeAuthButton} />
								<AuthButton onChange={handleChangeAuthButton} />
							</>
						) : (
							<Button
								type="text"
								shape="circle"
								onClick={() => setMobileMenuIsOpen(true)}
								icon={<HiMenu aria-label="menu" size={24} style={{ position: 'relative', top: 8 }} onClick={() => setMobileMenuIsOpen(true)} />}
							></Button>
						)}
					</Space>
				</Col>
			</Row>
			<Drawer title="Main menu" width="100%" onClose={() => setMobileMenuIsOpen(false)} open={mobileMenuIsOpen} extra={<AuthButton onChange={handleChangeAuthButton} />}>
				{connector?.connected ? (
					<Menu
						mode="vertical"
						style={{ background: 'transparent' }}
						selectedKeys={[]}
						selectable={false}
						onClick={() => setMobileMenuIsOpen(false)}
						items={[
							{
								key: '',
								label: 'Communities',
								onClick: () => router.push('/communities'),
							},
							{
								key: '',
								label: 'My Lectures',
								onClick: () => router.push('/my/lectures'),
							},
							{
								key: '',
								label: 'My Profile',
								onClick: () => router.push('/my/profile'),
							},
						]}
					/>
				) : (
					<Menu
						mode="vertical"
						style={{ background: 'transparent' }}
						selectedKeys={[]}
						selectable={false}
						onClick={() => setMobileMenuIsOpen(false)}
						items={[
							{
								key: '',
								label: 'Communities',
								onClick: () => router.push('/communities'),
							},
						]}
					/>
				)}
			</Drawer>
		</Header>
	)
}

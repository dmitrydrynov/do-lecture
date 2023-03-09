import { Layout } from 'antd'
import styles from './style.module.css'
import { AppHeader } from '../../AppHeader'

const { Content } = Layout

export default function PublicLayout({ children }: any) {
	return (
		<Layout style={{ minHeight: '100vh' }}>
			<AppHeader />
			<Content className={styles.layoutContent}>
				<div className={styles.pageContent}>{children}</div>
			</Content>
		</Layout>
	)
}

import { Grid, Row, Space, Typography } from 'antd'
import Countdown, { zeroPad } from 'react-countdown'
import styles from './style.module.css'

const { Text } = Typography

export const AppCountdown = ({ date }: { date: string }) => {
	const screens = Grid.useBreakpoint()
	const renderer = ({ days, hours, minutes, seconds }: any) => {
		const hoursString = zeroPad(hours)
		const minutesString = zeroPad(minutes)
		const secondsString = zeroPad(seconds)

		return (
			<Row justify="center">
				<Space direction={screens.md ? 'horizontal' : 'vertical'} style={{ textAlign: !screens.md ? 'center' : 'left' }}>
					<Text type="secondary">Ends in</Text>
					<Row justify={screens.md ? 'end' : 'start'}>
						<div className={styles.countdownText}>{days} days</div>
						<div className={styles.countdownDots}></div>
						<div className={styles.countdownTime}>
							<span>{hoursString[0]}</span>
							<span>{hoursString[1]}</span>
						</div>
						<div className={styles.countdownDots}></div>
						<div className={styles.countdownTime}>
							<span>{minutesString[0]}</span>
							<span>{minutesString[1]}</span>
						</div>
						<div className={styles.countdownDots}></div>
						<div className={styles.countdownTime}>
							<span>{secondsString[0]}</span>
							<span>{secondsString[1]}</span>
						</div>
					</Row>
				</Space>
			</Row>
		)
	}

	return (
		<Countdown date={date} renderer={renderer}>
			<Text type="secondary">Funding will close soon</Text>
		</Countdown>
	)
}

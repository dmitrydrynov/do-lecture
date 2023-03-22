import '@/styles/globals.css'
import { TonConnectError } from '@tonconnect/sdk'
import { ConfigProvider } from 'antd'
import { appTheme } from 'config/theme'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { SettingsContext, useSettingsContext } from '@/contexts/settings'
import { TonContext, useTonContext } from '@/services/ton/context'

dayjs.extend(relativeTime)

export default function App({ Component, pageProps }: AppPropsWithLayout) {
	const getLayout = Component.getLayout ?? ((page) => page)
	const onConnectError = (error: TonConnectError) => {
		console.log(error)
	}
	const tonContext = useTonContext({ onConnectError })
	const settingsContext = useSettingsContext()

	return (
		<ConfigProvider theme={appTheme}>
			<SettingsContext.Provider value={settingsContext}>
				<TonContext.Provider value={tonContext}>{getLayout(<Component {...pageProps} />)}</TonContext.Provider>
			</SettingsContext.Provider>
		</ConfigProvider>
	)
}

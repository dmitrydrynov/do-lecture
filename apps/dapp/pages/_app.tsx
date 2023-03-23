import '@/styles/globals.css'
import { SettingsContext, useSettingsContext } from '@/contexts/settings'
import { TonContext, useTonContext } from '@/services/ton/context'
import { defaultTheme } from 'config/theme'
import { TonConnectError } from '@tonconnect/sdk'
import { ConfigProvider } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export default function App({ Component, pageProps }: AppPropsWithLayout) {
	const getLayout = Component.getLayout ?? ((page) => page)
	const onConnectError = (error: TonConnectError) => {
		console.log(error)
	}
	const tonContext = useTonContext({ onConnectError })
	const settingsContext = useSettingsContext()

	return (
		<ConfigProvider theme={defaultTheme}>
			<SettingsContext.Provider value={settingsContext}>
				<TonContext.Provider value={tonContext}>{getLayout(<Component {...pageProps} />)}</TonContext.Provider>
			</SettingsContext.Provider>
		</ConfigProvider>
	)
}

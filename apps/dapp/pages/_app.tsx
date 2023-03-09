import '@/styles/globals.css'
import { TonContext, useTonContext } from '@/contexts/ton-context'
import { appTheme } from 'config/theme'
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

	return (
		<ConfigProvider theme={appTheme}>
			<TonContext.Provider value={tonContext}>{getLayout(<Component {...pageProps} />)}</TonContext.Provider>
		</ConfigProvider>
	)
}

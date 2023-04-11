import '@/styles/globals.css'
import { SettingsContext, useSettingsContext } from '@/contexts/settings'
import { TonContext, useTonContext } from '@/services/ton/context'
import { defaultTheme } from 'config/theme'
import { TonConnectError } from '@tonconnect/sdk'
import { ConfigProvider } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import Head from 'next/head'
import { UserContext, useUserContext } from '@/contexts/user'

dayjs.extend(relativeTime)

export default function App({ Component, pageProps }: AppPropsWithLayout) {
	const getLayout = Component.getLayout ?? ((page) => page)
	const onConnectError = (error: TonConnectError) => {
		console.log(error)
	}
	const tonContext = useTonContext({ onConnectError })
	const settingsContext = useSettingsContext()
	const userContext = useUserContext()

	return (
		<>
			<Head>
				<title>Delecture</title>
				<meta property="og:title" content="My page title" key="title" />
				<meta name="description" content="Share knowledge with your community. This is a platform where you can find funding for interesting lectures" key="description" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<ConfigProvider theme={defaultTheme}>
			<UserContext.Provider value={userContext}>
				<SettingsContext.Provider value={settingsContext}>
					<TonContext.Provider value={tonContext}>{getLayout(<Component {...pageProps} />)}</TonContext.Provider>
				</SettingsContext.Provider>
				</UserContext.Provider>
			</ConfigProvider>
		</>
	)
}

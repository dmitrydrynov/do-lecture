import { ReactElement, ReactNode } from 'react'
import { NextPage } from 'next'
import type { AppProps } from 'next/app'

export declare module '@foile/crypto-pay-api'

export declare module 'iron-session' {
	interface IronSessionData {
		user?: {
			id: string
			telegram?: {
				firstName?: string
				username: string
				photoUrl?: string
				id: number
			}
		}
	}
}

export declare global {
	interface Window {
		tonProtocolVersion?: number
		ton?: any
	}

	type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
		getLayout?: (page: ReactElement) => ReactNode
	}

	type AppPropsWithLayout = AppProps & {
		Component: NextPageWithLayout
	}

	interface TelegramUserData {
		id: number
		first_name: string
		last_name?: string
		username?: string
		photo_url?: string
		auth_date: number
		hash: string
	}
}
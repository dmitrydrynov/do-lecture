import { ReactElement, ReactNode } from 'react'
import { NextPage } from 'next'
import type { AppProps } from 'next/app'

export declare module '@foile/crypto-pay-api'

export declare module 'iron-session' {
	interface IronSessionData {
		user?: {
			id: string
			telegram?: {
				username: string
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
}

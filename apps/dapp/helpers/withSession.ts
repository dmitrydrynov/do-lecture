import { withIronSessionApiRoute, withIronSessionSsr } from 'iron-session/next'
import { sessionOptions } from 'config/sessions'
import { GetServerSidePropsContext, GetServerSidePropsResult, NextApiHandler } from 'next'

export function withSessionRoute(handler: NextApiHandler) {
	return withIronSessionApiRoute(handler, sessionOptions)
}

export function withSessionSsr<P extends { [key: string]: unknown } = { [key: string]: unknown }>(
	handler: (context: GetServerSidePropsContext) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>
) {
	return withIronSessionSsr(handler, sessionOptions)
}

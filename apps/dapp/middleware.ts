import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session/edge'
import { sessionOptions } from 'config/sessions'
import Api from './services/api'

export const middleware = async (req: NextRequest) => {
	const { pathname, searchParams } = req.nextUrl.clone()
	const params = Object.fromEntries(searchParams)
	const res = NextResponse.next()
	const session = await getIronSession(req, res, sessionOptions)
	const { user } = session

	if (pathname == '/') {
		const _user = await Api.loginByTelegram(params)

		console.log('111', '_user')
	}

	if (pathname.startsWith('/my')) {
		if (!user?.id) {
			return NextResponse.redirect(new URL('/', req.url)) // redirect to /unauthorized page
		}
	}

	return res
}

export const config = {
	matcher: '/:path*',
}

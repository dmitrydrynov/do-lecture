import { sessionOptions } from 'config/sessions'
import { getIronSession } from 'iron-session/edge'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const middleware = async (req: NextRequest) => {
	const url = req.nextUrl.clone();
	const res = NextResponse.next()
	const session = await getIronSession(req, res, sessionOptions)
	const { user } = session

	if (url.pathname.startsWith('/my')) {
		if (!user?.id) {
			return NextResponse.redirect(new URL('/', url.href)) // redirect to /unauthorized page
		}
	}

	return res
}

export const config = {
	matcher: '/:path*',
}

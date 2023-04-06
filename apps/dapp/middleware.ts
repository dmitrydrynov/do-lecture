import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session/edge'
import { sessionOptions } from 'config/sessions'

export const middleware = async (req: NextRequest) => {
	const res = NextResponse.next()
	const session = await getIronSession(req, res, sessionOptions)

	const { user } = session

	// like mutate user:
	// user.something = someOtherThing;
	// or:
	// session.user = someoneElse;

	// uncomment next line to commit changes:
	// await session.save();
	// or maybe you want to destroy session:
	// await session.destroy();

	console.log('from middleware', { user })

	// demo:
	if (!user?.id) {
		// unauthorized to see pages inside admin/
		return NextResponse.redirect(new URL('/', req.url)) // redirect to /unauthorized page
	}

	return res
}

export const config = {
	matcher: '/my/:path*',
}

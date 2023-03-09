import { withIronSessionApiRoute } from 'iron-session/next'
import type { NextApiRequest, NextApiResponse } from 'next'

export default withIronSessionApiRoute(
	function handler(req: NextApiRequest, res: NextApiResponse) {
		req.session.destroy()
		res.send({ ok: true })
	},
	{
		cookieName: 'dolecture-cookie',
		password: process.env.JWT_SECRET as string,
		cookieOptions: {
			secure: process.env.NODE_ENV === 'production',
		},
	}
)

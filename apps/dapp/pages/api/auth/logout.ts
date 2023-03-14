import { defaultCookie } from 'config/cookie'
import { withIronSessionApiRoute } from 'iron-session/next'
import type { NextApiRequest, NextApiResponse } from 'next'

export default withIronSessionApiRoute(function handler(req: NextApiRequest, res: NextApiResponse) {
	req.session.destroy()
	res.send({ ok: true })
}, defaultCookie)

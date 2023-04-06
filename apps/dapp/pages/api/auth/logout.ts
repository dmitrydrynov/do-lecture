import { sessionOptions } from 'config/sessions'
import { withIronSessionApiRoute } from 'iron-session/next'
import type { NextApiRequest, NextApiResponse } from 'next'

export default withIronSessionApiRoute(handler, sessionOptions)

function handler(req: NextApiRequest, res: NextApiResponse) {
	req.session.destroy()
	res.send({ ok: true })
}

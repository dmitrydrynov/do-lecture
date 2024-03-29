import { IronSessionOptions } from 'iron-session'

export const sessionOptions: IronSessionOptions = {
	cookieName: 'dolecture-cookie',
	password: process.env.JWT_SECRET as string,
	cookieOptions: {
		secure: process.env.NODE_ENV === 'production',
	},
}

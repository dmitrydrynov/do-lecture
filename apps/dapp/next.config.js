/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	skipMiddlewareUrlNormalize: true,
	transpilePackages: ['lecture-contract'],
	images: {
		domains: ['t.me'],
	},
}

module.exports = nextConfig

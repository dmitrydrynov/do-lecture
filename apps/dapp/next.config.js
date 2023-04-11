/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	skipMiddlewareUrlNormalize: true,
	transpilePackages: ['lecture-contract'],
}

module.exports = nextConfig

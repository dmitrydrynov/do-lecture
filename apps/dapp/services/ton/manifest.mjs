import fs from 'fs'
import path from 'path'
import * as dotenv from 'dotenv'

dotenv.config()

const filePath = path.join(process.cwd(), '/public/tonconnect-manifest.json')

const main = async () => {
	const host = process.env.NEXT_PUBLIC_APP_URL
	const name = process.env.NEXT_PUBLIC_APP_NAME

	const manifest = {
		url: host,
		name: name,
		iconUrl: host + '/lectures-dapp-icon.png',
		termsOfUseUrl: host + '/terms-of-use.txt',
		privacyPolicyUrl: host + '/privacy-policy.txt',
	}

	fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2))
}

main().then(() => console.log('Ton connect manifest was generated.'))

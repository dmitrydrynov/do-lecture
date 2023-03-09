export default class Api {
	static getNetworkDetails = async (contractAddress: string) => {
		const response = await fetch('/api/lecture/network-details', {
			method: 'post',
			body: JSON.stringify({ contractAddress }),
			headers: {
				accept: 'application/json',
				'content-type': 'application/json',
			},
		})
		const data = await response.json()

		return data
	}
}

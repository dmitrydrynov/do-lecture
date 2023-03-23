export const fetcher = ([url, data]: any, changeData?: (data: any) => any) =>
	fetch(url, {
		method: 'post',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	}).then(async (res) => {
		if (!res.ok && res.statusText) throw Error(res.statusText)

		let data = await res.json()

		if (changeData) {
			data = changeData(data)
		}

		return data
	})

export const getFetcher = ([url, data]: any, changeData?: (data: any) => any) => {
	const params = new URLSearchParams(data)

	return fetch(url + '?' + params.toString(), {
		method: 'get',
		headers: { 'Content-Type': 'application/json' },
	}).then(async (res) => {
		let data = await res.json()

		if (changeData) {
			data = changeData(data)
		}

		return data
	})
}

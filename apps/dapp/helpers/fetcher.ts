export const fetcher = ([url, data]: any, changeData?: (data: any) => any) =>
	fetch(url, {
		method: 'post',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	}).then(async (res) => {
		if (!res.ok && res.statusText) throw Error(res.statusText)

		const dataAsText = await res.text()

		let data = !!dataAsText ? JSON.parse(dataAsText) : undefined

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

export const fetcherWithCredentials = async ([url, data]: any, params?: Record<string, any>) => {
	try {
		const res = await fetch(url, {
			method: 'post',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'X-Requested-With': 'XMLHttpRequest',
			},
			body: new URLSearchParams(data),
		})

		if (!res.ok && res.statusText) throw Error(res.statusText)

		return await res.json()
	} catch (e: any) {
		throw e
	}
}

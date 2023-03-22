import Airtable from 'airtable'
import { Attachment } from 'airtable/lib/attachment'
import { Collaborator } from 'airtable/lib/collaborator'
import dayjs from 'dayjs'

const AirtableService = new Airtable({
	apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID as string)

export default AirtableService

export const createLecture = async ({ title, description, lecturerId, date, contractAddress, duration, status, price, stage, community }: any) => {
	try {
		const newLecture = await AirtableService('Lecture').create({
			title,
			description,
			date,
			contractAddress,
			duration,
			status,
			stage,
			price,
			lecturer: [lecturerId],
			community: [community],
		})

		if (!newLecture) return

		return { ...newLecture.fields, id: newLecture.id }
	} catch (error: any) {
		console.error('[AIRTABLE ERROR]', error)
		return null
	}
}

export const cancelLecture = async (id: string) => {
	try {
		await AirtableService('Lecture').update(id, {
			status: 'closed',
			closedAt: dayjs().toISOString(),
		})
	} catch (error: any) {
		console.error('[AIRTABLE ERROR]', error)
		return null
	}
}

export const getPaidLecturesByLecturer = async (userId: string, status: string[] = ['published']) => {
	try {
		const list = await AirtableService('Lecture')
			.select({
				filterByFormula: `AND(lecturer = "${userId}", FIND(status, "${status.join(' ')}"), price > 0, LEN(contractAddress) > 0)`,
			})
			.all()

		return list.map((l: any) => ({ id: l.id, ...l.fields }))
	} catch (error: any) {
		console.error('[AIRTABLE ERROR]', error)
		return null
	}
}

export const getFundingPaidLectures = async () => {
	try {
		const list = await AirtableService('Lecture')
			.select({
				filterByFormula: `AND(status = "published", DATETIME_DIFF(date, "${dayjs().toISOString()}", 'hours') > 2)`,
				maxRecords: 200,
				sort: [{ field: 'date', direction: 'asc' }],
			})
			.all()

		return list.map((l: any) => ({ id: l.id, ...l.fields }))
	} catch (error: any) {
		console.error('[AIRTABLE ERROR]', error)
		return null
	}
}

export const getRunupPaidLectures = async () => {
	try {
		const list = await AirtableService('Lecture')
			.select({
				filterByFormula: `AND(status = "published", DATETIME_DIFF(date, "${dayjs().toISOString()}", 'hours') <= 2)`,
				maxRecords: 200,
			})
			.all()

		return list.map((l: any) => ({ id: l.id, ...l.fields }))
	} catch (error: any) {
		console.error('[AIRTABLE ERROR]', error)
		return null
	}
}

export const createUser = async ({ hash }: any) => {
	const user = await AirtableService('User').create({
		hash,
		roles: ['member'],
	})

	return { id: user.id, ...user.fields }
}

export const findUserByHash = async ({ hash }: any) => {
	const users = await AirtableService('User')
		.select({
			filterByFormula: `hash = "${hash}"`,
			maxRecords: 1,
		})
		.all()
	const user = users[0] || null

	return user ? { id: user.id, ...user.fields } : null
}

export const getLecture = async (id: string) => {
	const lecture = await AirtableService('Lecture').find(id)

	return { id: lecture.id, ...lecture.fields }
}

export const getCommunity = async (id: string) => {
	const community = await AirtableService('Community').find(id)

	return { id: community.id, ...community.fields }
}

export const getSettings = async () => {
	const settings = await AirtableService('Settings').select().all()
	let response: Record<string, string> = {}

	settings.map((setting) => {
		const name = setting.get('Name') as string
		const value = setting.get('Value') as string

		response[name] = value
	})

	return Object.entries(response).length > 0 ? response : null
}

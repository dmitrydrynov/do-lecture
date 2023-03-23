import Airtable, { FieldSet, Record as AirtableRecord, Records as AirtableRecords } from 'airtable'
import { Attachment } from 'airtable/lib/attachment'
import { Collaborator } from 'airtable/lib/collaborator'
import dayjs from 'dayjs'

const AirtableService = new Airtable({
	apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID as string)

export default AirtableService

export const saveLecture = async (data: any) => {
	try {
		const { id, lecturerId, community, ...args } = data
		let lecture: any

		if (id) {
			lecture = await AirtableService('Lecture').update(id, {
				...args,
				lecturer: [lecturerId],
				community: [community],
			})
		} else {
			lecture = await AirtableService('Lecture').create({
				...args,
				lecturer: [lecturerId],
				community: [community],
			})
		}

		if (!lecture) throw Error('The data not recorded in database')

		return { id: lecture.id, ...lecture.fields }
	} catch (error: any) {
		console.error('[AIRTABLE ERROR]', error)
		throw error
	}
}

export const cancelLecture = async (id: string) => {
	try {
		await AirtableService('Lecture').update(id, {
			status: 'closed',
			stage: 'canceled',
			closedAt: dayjs().toISOString(),
		})
	} catch (error: any) {
		console.error('[AIRTABLE ERROR]', error)
		throw error
	}
}

export const deleteDraftLecture = async (id: string) => {
	try {
		const [lecture] = await AirtableService('Lecture')
			.select({
				filterByFormula: `AND(RECORD_ID() = "${id}", status = "draft")`,
			})
			.all()

		if (lecture) {
			await AirtableService('Lecture').destroy(lecture.id)
		} else {
			throw Error('Lecture did not find or is not draft')
		}
	} catch (error: any) {
		console.error('[AIRTABLE ERROR]', error)
		throw error
	}
}

export const getPaidLecturesByUser = async (userId: string, status: string[] = ['published']) => {
	try {
		const list = await AirtableService('Lecture')
			.select({
				filterByFormula: `AND(lecturer = "${userId}", FIND(status, "${status.join(' ')}"), price > 0)`,
			})
			.all()

		return list?.length > 0 ? list.map((l) => parseAirtableRecord(l)) : []
	} catch (error: any) {
		console.error('[AIRTABLE ERROR]', error)
		throw error
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

		return list.map((l: any) => parseAirtableRecord(l))
	} catch (error: any) {
		console.error('[AIRTABLE ERROR]', error)
		throw error
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

		return list.map((l: any) => parseAirtableRecord(l))
	} catch (error: any) {
		console.error('[AIRTABLE ERROR]', error)
		throw error
	}
}

export const createUser = async ({ hash }: any) => {
	const user = await AirtableService('User').create({
		hash,
		roles: ['member'],
	})

	return parseAirtableRecord(user)
}

export const findUserByHash = async ({ hash }: any) => {
	const users = await AirtableService('User')
		.select({
			filterByFormula: `hash = "${hash}"`,
			maxRecords: 1,
		})
		.all()
	const user = users[0] || null

	return user ? parseAirtableRecord(user) : null
}

export const getLecture = async (id: string) => {
	const lecture = await AirtableService('Lecture').find(id)

	return parseAirtableRecord(lecture)
}

export const getCommunity = async (id: string) => {
	const community = await AirtableService('Community').find(id)

	return parseAirtableRecord(community)
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

const parseAirtableRecord = (record: AirtableRecord<FieldSet>): { id: string; [key: string]: any } => {
	return { id: record.id, ...record.fields }
}

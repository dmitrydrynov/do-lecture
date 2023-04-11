/* eslint-disable react-hooks/exhaustive-deps */
import { createContext } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/helpers/fetcher'

export type UserContextType = {
	id?: string
	telegram?: {
		username: string
		id: number
	}
}

export const UserContext = createContext<UserContextType>({})

export const useUserContext = () => {
	const { data } = useSWR(['/api/auth/me'], fetcher, { revalidateOnFocus: false })

	return data
}

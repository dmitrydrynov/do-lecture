/* eslint-disable react-hooks/exhaustive-deps */
import { createContext, useEffect, useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/helpers/fetcher'
import { useRouter } from 'next/router'

export type UserContextType = {
	id?: string
	telegram?: {
		username: string
		id: number
	}
}

export const UserContext = createContext<UserContextType>({})

export const useUserContext = () => {
	const router = useRouter()
	const [user, setUser] = useState<any>()

	useEffect(() => {
		userFetcher()
	}, [])

	const userFetcher = async () => {
		const { user } = await fetcher(['/api/auth/me'])
		setUser(user)
	}

	return { user, refreshSession: userFetcher }
}

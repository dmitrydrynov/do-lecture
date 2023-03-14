/* eslint-disable react-hooks/exhaustive-deps */
import { createContext } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/helpers/fetcher'

export type SettingsContextType = {
	serviceAddress?: string
}

export const SettingsContext = createContext<SettingsContextType>({})

export const useSettingsContext = () => {
	const { data } = useSWR(['/api/settings', {}], fetcher, { revalidateOnFocus: false })

	return data
}

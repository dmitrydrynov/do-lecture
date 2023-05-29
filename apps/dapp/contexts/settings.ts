/* eslint-disable react-hooks/exhaustive-deps */
import { createContext } from 'react'
import { fetcher } from '@/helpers/fetcher'
import useSWR from 'swr'

export type SettingsContextType = {
	serviceWallet?: string
}

export const SettingsContext = createContext<SettingsContextType>({})

export const useSettingsContext = () => {
	const { data } = useSWR(['/api/settings', {}], fetcher, { revalidateOnFocus: false })

	return data
}

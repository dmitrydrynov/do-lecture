import { fromNano } from 'ton'

export function isMobile(): boolean {
	return window.innerWidth <= 500
}

export function isDesktop(): boolean {
	return window.innerWidth >= 1050
}

export function openLink(href: string, target = '_self') {
	window.open(href, target, 'noreferrer noopener')
}

export function addReturnStrategy(url: string, returnStrategy: 'back' | 'none'): string {
	if (!url) return ''

	const link = new URL(url)
	link.searchParams.append('ret', returnStrategy)
	return link.toString()
}

export const renderPrice = (price: string | number, style: 'currency' | 'decimal' = 'currency') => {
	if (price == undefined) return null

	return new Intl.NumberFormat('ru', {
		style,
		currency: 'TON',
	}).format(Number.parseFloat(fromNano(price)))
}

import { ThemeConfig, theme } from 'antd'
import { Rubik as AppFont } from 'next/font/google'

const mainFont = AppFont({ weight: ['400'], subsets: ['latin', 'cyrillic'] })

export const appTheme: ThemeConfig = {
	algorithm: theme.darkAlgorithm,
	token: {
		fontFamily: mainFont.style.fontFamily,
		colorBgMask: 'rgba(0,0,0,.75)',
		colorPrimary: '#248bda',
		colorBgBase: '#1a2026',
		borderRadius: 12,
		wireframe: false,
		colorBorder: '#3c4a58',
		colorBorderSecondary: '#242b32',
		colorBgElevated: '#333f4a',
		colorBgLayout: '#1a2026',
		fontSize: 16,
		colorText: '#ffffff',
	},
	components: {
		Layout: {
			colorBgHeader: '#212a33',
		},
		Button: {
			colorBgContainer: '#2b343e',
			colorBorder: '#3c4a58',
		},
		Dropdown: {
			colorPrimary: '#fff',
			colorPrimaryBorder: '#19384f',
			controlItemBgActiveHover: '#14293c',
		},
		Menu: {
			colorItemTextSelected: '#ffffff',
		},
		Slider: {
			colorPrimary: '#2279bc',
		},
		Modal: {
			colorBgElevated: '#1a2026',
		},
	},
}

export const defaultTheme: ThemeConfig = {
	algorithm: theme.darkAlgorithm,
	token: {
		fontFamily: mainFont.style.fontFamily,
		borderRadius: 12,
		colorPrimary: '#25d9b3',
		colorBgMask: 'rgba(0, 0, 0, 0.75)',
		colorBgContainer: '#252c33',
		colorBgElevated: '#1a2026',
		colorBgLayout: '#1a2026',
		colorBorder: '#3c4a58',
		colorBorderSecondary: '#2a333c',
		fontSize: 16,
		wireframe: false,
	},
	components: {
		Table: {
			colorLink: '#25d9b3',
			colorLinkActive: '#25d9b3',
			colorLinkHover: '#25d9b3',
			colorTextHeading: 'rgba(255,255,255,0.4)'
		},
		Button: {
			colorLink: '#25d9b3',
			colorLinkActive: '#25d9b3',
			colorLinkHover: '#25d9b3',
		},
		Typography: {
			colorLink: '#25d9b3',
			colorLinkActive: '#25d9b3',
			colorLinkHover: '#25d9b3',
		},
		Select: {
			controlItemBgActive: '#203c38',
		},
		Segmented: {
			colorBgLayout: '#2e343b',
			colorBgElevated: '#626c76',
		},
	},
}

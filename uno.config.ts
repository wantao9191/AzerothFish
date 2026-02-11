import {
    defineConfig,
    transformerDirectives,
    transformerVariantGroup,
} from 'unocss'
import { presetWeapp } from 'unocss-preset-weapp'
import presetIcons from '@unocss/preset-icons'
import { transformerAttributify, transformerClass } from 'unocss-preset-weapp/transformer'

export default defineConfig({
    presets: [
        // https://github.com/MellowCo/unocss-preset-weapp
        presetWeapp({
            isPreprocess: true,
            // 1rem = 32rpx by default in preset-weapp which matches the spec (16px = 32rpx)
        }),
        presetIcons({
            scale: 1.2,
            warn: true,
            collections: {
                tabler: () => import('@iconify-json/tabler/icons.json').then(i => i.default),
            }
        }),
    ],
    theme: {
        colors: {
            // A. 主色调
            primary: '#8B6DFF', // 电光紫
            secondary: '#7052CC', // 深邃紫
            // 主渐变
            'primary-gradient-start': '#B4C0FF',
            'primary-gradient-end': '#8E9EFF',
            
            // B. 辅助色
            pink: '#FF85C0', // 甜心粉
            cyan: '#5AD8F2', // 天空青
            yellow: '#FFD43B', // 活力黄
            red: '#FF4D4F', // 功能红
            green: '#2CC995', // 功能绿

            // C. 中性色
            'text-main': '#333333', // 主要文字
            'text-regular': '#666666', // 常规文字
            'text-secondary': '#999999', // 次要文字
            'bg-page': '#F5F6F8', // 全局页面背景
            'bg-card': '#FFFFFF', // 卡片背景
            'border-base': '#F0F0F0', // 分割线
        },
        fontSize: {
            // 字体规范 (1px = 2rpx)
            'title': ['48rpx', { lineHeight: '1.5', fontWeight: '600' }], // 24px
            'subtitle': ['40rpx', { lineHeight: '1.5', fontWeight: '500' }], // 20px
            'body': ['32rpx', { lineHeight: '1.5', fontWeight: '400' }], // 16px
            'aux': ['28rpx', { lineHeight: '1.5', fontWeight: '400' }], // 14px
            
            // Standard sizes mapping if needed
            'xs': '24rpx',
            'sm': '28rpx',
            'base': '32rpx',
            'lg': '36rpx',
            'xl': '40rpx',
            '2xl': '48rpx',
            '3xl': '60rpx', // Just in case
        },
        borderRadius: {
            'none': '0',
            'sm': '8rpx',
            'DEFAULT': '16rpx', // 8px -> 16rpx (standard radius)
            'md': '24rpx', // 12px -> 24rpx (modal radius)
            'lg': '32rpx',
            'full': '9999px',
        }
    },
    shortcuts: {
        'btn': 'flex items-center justify-center rounded transition-all active:opacity-80',
        'btn-primary': 'bg-primary text-white',
        'btn-sm': 'h-64rpx text-aux px-4', // 32px
        'btn-md': 'h-80rpx text-body px-6', // 40px
        'btn-lg': 'h-96rpx text-body px-8', // 48px
        'input': 'h-96rpx bg-bg-page rounded px-4 text-body text-text-main border border-transparent focus:border-primary transition-colors',
        'card': 'bg-bg-card rounded shadow-sm',
    },
    transformers: [
        transformerDirectives(),
        transformerVariantGroup(),
        transformerAttributify(),
        transformerClass(),
    ],
})

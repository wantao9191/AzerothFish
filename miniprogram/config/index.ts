/**
 * 项目配置文件
 * 支持根据小程序运行环境自动切换配置
 */

// 环境配置
const ENV = {
    development: {
        // baseUrl: ' http://localhost:3000/api',
        baseUrl: 'https://wantapp.cn/api',
        env_version: 'develop',
    },
    stage: {
        baseUrl: 'https://wantapp.cn/api',
        env_version: 'trial',
    },
    production: {
        baseUrl: 'https://wantapp.cn/api',
        env_version: 'release',
    }
}

/**
 * 获取当前运行环境
 * 
 * 方案1：手动指定（推荐用于开发调试）
 * 直接修改下面的 MANUAL_ENV 变量来切换环境
 * 
 * 方案2：自动识别（推荐用于生产环境）
 * 根据小程序的运行环境自动判断：
 * - develop: 开发版（开发者工具调试）-> development
 * - trial: 体验版 -> stage  
 * - release: 正式版 -> production
 */

// ========== 手动指定环境（优先级最高） ==========
// 如果需要手动指定环境，取消下面一行的注释并设置值
// 可选值: 'development' | 'stage' | 'production' | null
const MANUAL_ENV = null// 设置为 null 则使用自动识别

// ========== 自动识别环境 ==========
function getAutoEnv() {
    try {
        // 尝试获取账号信息（需要基础库 2.2.2+）
        const accountInfo = wx.getAccountInfoSync()
        const envVersion = accountInfo.miniProgram?.envVersion
        return {
            develop: 'development',
            trial: 'stage',
            release: 'production'
        }[envVersion]
    } catch (e) {
        // 如果获取失败，可能是基础库版本过低
        console.warn('获取环境信息失败，使用默认配置', e)
    }

    // 默认环境
    return 'production'
}

// 获取当前环境：优先使用手动设置，否则自动识别
const currentEnv = MANUAL_ENV || getAutoEnv()
export default {
    ...ENV[currentEnv as keyof typeof ENV],
    env: currentEnv,
    timeout: 30000,
    tokenKey: 'ACCESS_TOKEN',
    userInfoKey: 'USER_INFO',
    upload: {
        maxSize: 100 * 1024 * 1024,
        allowExtensions: ['txt']
    },
}

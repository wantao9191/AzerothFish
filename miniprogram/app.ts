// app.ts
import './utils/page-extend'
import config from './config/index'
App<IAppOption>({
  globalData: {
    isLogin: false,
    USER_INFO: null,
  },
  onLaunch() {
    const userInfo = wx.getStorageSync(config.userInfoKey)
    if (userInfo) {
      this.globalData.isLogin = true
      this.globalData.USER_INFO = userInfo
    }
  },
})

const systemInfo = wx.getSystemInfoSync()
const safeAreaTop = systemInfo.safeArea ? systemInfo.safeArea.top : 0

const originalPage = Page

Page = function (config: any) {
  config.data = {
    ...config.data,
    safeAreaTop,
  }
  return originalPage(config)
}

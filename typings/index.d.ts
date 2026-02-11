/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    isLogin: boolean,
    USER_INFO: any,
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}
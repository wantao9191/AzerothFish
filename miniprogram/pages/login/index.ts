// pages/login/index.ts
import config from '../../config/index';
import { post } from '../../utils/request';
import Toast, { hideToast } from 'tdesign-miniprogram/toast';
const app = getApp<IAppOption>();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isAgree: false,
    showProtocol: false,
    showPrivacy: false,
  },

  onAgreeChange(e: any) {
    const isAgree = e.type === 'tap' ? !this.data.isAgree : e.detail.checked;
    this.setData({ isAgree });
  },

  openProtocol() {
    this.setData({ showProtocol: true });
  },

  openPrivacy() {
    this.setData({ showPrivacy: true });
  },

  closePopups() {
    this.setData({
      showProtocol: false,
      showPrivacy: false,
    });
  },

  handleLogin() {
    if (!this.data.isAgree) {
      wx.showToast({
        title: '请先阅读并同意用户协议',
        icon: 'none',
      });
      return;
    }
    this.getUserInfo();
  },

  getUserInfo() {
    Toast({
      message: 'Loading...',
      theme: 'loading',
      direction: 'column',
      duration: -1,
    });
    wx.login({
      success: (res) => {
        post('/auth/login', {
          code: res.code,
        }).then(res => {
          if (res.code === 200) {
            const { token, userInfo } = res.data;
            app.globalData.isLogin = true;
            app.globalData.USER_INFO = userInfo;
            wx.setStorageSync(config.userInfoKey, userInfo);
            wx.setStorageSync(config.tokenKey, token);
            Toast({
              message: '登录成功',
              theme: 'success',
              direction: 'column',
              duration: 2000,
            });
            setTimeout(() => {
              wx.reLaunch({
                url: '/pages/index/index',
              });
            }, 2000);
          } else {
            Toast({
              message: res.message,
              theme: 'error',
              direction: 'column',
              duration: 2000,
            });
          }
          hideToast();
        }).catch(err => {
          Toast({
            message: err.message,
            theme: 'error',
            direction: 'column',
            duration: 2000,
          });
          hideToast();
        });
        console.log(res);
      },
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})
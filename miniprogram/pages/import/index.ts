// pages/import/index.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    popupVisible: false,
    imageSrc: '', // 存储选择的图片路径
    paddingTop: 20 // 默认 padding
  },

  /**
   * 显示选择方式弹窗
   */
  showPopup() {
    this.setData({
      popupVisible: true
    });
  },

  /**
   * 关闭弹窗
   */
  closePopup() {
    this.setData({
      popupVisible: false
    });
  },

  /**
   * 监听弹窗显隐变化
   */
  onVisibleChange(e: any) {
    this.setData({
      popupVisible: e.detail.visible,
    });
  },

  /**
   * 从相册选择
   */
  chooseFromAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        this.setData({
          imageSrc: res.tempFiles[0].tempFilePath,
          popupVisible: false
        });
      }
    });
  },

  /**
   * 拍照
   */
  chooseFromCamera() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        this.setData({
          imageSrc: res.tempFiles[0].tempFilePath,
          popupVisible: false
        });
      }
    });
  },

  /**
   * 从聊天记录选择
   */
  chooseFromChat() {
    wx.chooseMessageFile({
      count: 1,
      type: 'image',
      success: (res) => {
        this.setData({
          imageSrc: res.tempFiles[0].path,
          popupVisible: false
        });
      }
    });
  },

  /**
   * 生成处理
   */
  handleGenerate() {
    if (!this.data.imageSrc) {
      wx.showToast({
        title: '请先上传图片',
        icon: 'none'
      });
      return;
    }
    wx.showLoading({
      title: '生成中...',
    });
    // 模拟生成过程
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '生成成功',
      });
    }, 1500);
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    const { statusBarHeight } = wx.getWindowInfo();
    // 简单估算导航栏高度 + 状态栏高度 + 一些留白
    const paddingTop = statusBarHeight + 44 + 10; 
    this.setData({ paddingTop });
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
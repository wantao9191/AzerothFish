// pages/import/index.ts
import { get, post, del } from '../../utils/request';
import { uploadFileToCos } from '../../utils/upload';
import Toast, { hideToast } from 'tdesign-miniprogram/toast';
const app = getApp<IAppOption>();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [] as any[],
    noData: false,
    statusBarHeight: 0,
    selecting: false,
    selectedList: [] as any[],
    showDialog: false,
    showDownloadDialog: false,
    isLogin: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.setData({ isLogin: app.globalData.isLogin });
    if (!app.globalData.isLogin) {
      return
    }
    this.getList();
  },
  login() {
    wx.navigateTo({
      url: '/pages/login/index',
    });
  },
  async getList() {
    try {
      Toast({
        message: 'Loading...',
        theme: 'loading',
        direction: 'column',
        duration: -1,
      });
      const books = await get('/books')
      this.setData({ list: books.data, noData: books.data.length === 0 });
      hideToast();
    } catch {
      hideToast();
    }
  },
  importBook() {
    if (!app.globalData.isLogin) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/index',
            });
          }
        }
      });
      return;
    }
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['txt'], // 限制只选择 txt 文件
      success: (res) => {
        const file = res.tempFiles[0];
        const fileName = file.name;
        const filePath = file.path;
        const fileSize = file.size;
        console.log('选择文件:', fileName, filePath);

        // 上传到 COS
        wx.showLoading({ title: '上传中...' });
        const keyValue = `list[${this.data.list.length}]`
        this.setData({ [keyValue]: { title: fileName }, noData: false });
        uploadFileToCos(filePath, 'resource', (percent) => {
          this.setData({ [keyValue]: { percent } });
        })
          .then(url => {
            wx.hideLoading();
            console.log('上传成功，文件地址:', url);
            post('/upload', { fileUrl: url, fileName, fileSize }).then(res => {
              console.log('上传成功', res);
              this.getList();
            })
          })
          .catch(err => {
            wx.hideLoading();
            console.error('上传失败', err);
            wx.showToast({ title: '上传失败', icon: 'none' });
          });
      },
      fail: (err) => {
        if (err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({ title: '选择文件失败', icon: 'none' });
        }
      }
    })
  },
  handleBookClick(e: any) {
    const id = e.currentTarget.dataset.id;
    if (this.data.selecting) {
      const index = this.data.selectedList.indexOf(id);
      if (index === -1) {
        this.setData({ selectedList: [...this.data.selectedList, id] });
      } else {
        this.setData({ selectedList: this.data.selectedList.filter((item: any) => item !== id) });
      }
      return;
    }
    wx.navigateTo({
      url: `/pages/read/index?id=${id}`,
    });
  },
  handleBookLongPress(e: any) {
    const id = e.currentTarget.dataset.id;
    this.setData({ selecting: true, selectedList: [...this.data.selectedList, id] });
  },
  enterSelectMode() {
    this.setData({ selecting: true });
  },
  cancelSelect() {
    this.setData({ selecting: false, selectedList: [] });
  },
  selectAll() {
    this.setData({ selectedList: this.data.list.map((item: any) => item.id) });
  },
  onDeleteBook() {
    if (!this.data.selectedList.length) {
      Toast({
        message: '请选择要移除的书架',
        theme: 'warning',
        duration: 2000,
        direction: 'column',
      });
      return;
    }
    this.setData({ showDialog: true });
  },
  deleteBook() {
    this.setData({ showDialog: false });
    Toast({
      message: 'Loading...',
      theme: 'loading',
      direction: 'column',
      duration: -1,
    });
    del('/books', { ids: this.data.selectedList }).then(() => {
      this.setData({ selecting: false, selectedList: [] });
      this.getList();
      Toast({
        message: '操作成功！',
        theme: 'success',
        direction: 'column',
      });
    })
  },
  confirmDownload() {
    // TODO: 实现下载逻辑
    console.log('确认下载');
    this.setData({ showDownloadDialog: false, selecting: false, selectedList: [] });
  },
  cancelDelete() {
    this.setData({ showDialog: false });
  },
  downloadSelectedBooks() {
    if (!this.data.selectedList.length) {
      Toast({
        message: '请选择要下载的书架',
        theme: 'warning',
        duration: 2000,
        direction: 'column',
      });
      return;
    }
    this.setData({ showDownloadDialog: true });
  },
  cancelDownload() {
    this.setData({ showDownloadDialog: false });
  },
  toPerfectInfo() {
    wx.navigateTo({
      url: '/pages/perfectInfo/index',
    });
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
    this.setData({ isLogin: app.globalData.isLogin });
    if (app.globalData.isLogin && this.data.list.length === 0) {
      this.getList();
    }
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
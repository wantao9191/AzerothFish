// pages/import/index.ts
import { uploadFileToCos } from "../../utils/upload";
import { post, streamRequest } from "../../utils/request";
import Toast from 'tdesign-miniprogram/toast';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    popupVisible: false,
    statusBarHeight: 0,
    imageList: [] as any[],
    // 选择器相关
    levelPickerVisible: false,
    formatPickerVisible: false,
    levelValue: '',
    formatValue: 'docx',
    selectedLevel: '',
    selectedFormat: 'docx',

    levelList: [
      {
        value: '小学',
        label: '小学',
        id: 'a1',
        children: [
          {
            value: '一年级',
            label: '一年级',
            id: '1',
          },
          {
            value: '二年级',
            label: '二年级',
            id: '2',
          },
          {
            value: '三年级',
            label: '三年级',
            id: '3',
          },
          {
            value: '四年级',
            label: '四年级',
            id: '4',
          },
          {
            value: '五年级',
            label: '五年级',
            id: '5',
          },
          {
            value: '六年级',
            label: '六年级',
            id: '6',
          },]
      },
      {
        value: '初中',
        label: '初中',
        id: 'a2',
        children: [
          {
            value: '一年级',
            label: '一年级',
            id: '7',
          },
          {
            value: '二年级',
            label: '二年级',
            id: '8',
          },
          {
            value: '三年级',
            label: '七年级',
            id: '9',
          },
          {
            value: '八年级',
            label: '八年级',
            id: '10',
          },
        ]
      },
      {
        value: '高中',
        label: '高中',
        id: 'a3',
        children: [
          {
            value: '一年级',
            label: '一年级',
            id: '11',
          },
          {
            value: '二年级',
            label: '二年级',
            id: '12',
          },
          {
            value: '三年级',
            label: '三年级',
            id: '13',
          },
        ]
      },
      {
        value: '大学',
        label: '大学',
        id: 'a4',
        children: [
          {
            value: '一年级',
            label: '一年级',
            id: '14',
          },
          {
            value: '二年级',
            label: '二年级',
            id: '15',
          },
          {
            value: '三年级',
            label: '三年级',
            id: '16',
          },
          {
            value: '四年级',
            label: '四年级',
            id: '17',
          },
          {
            value: '五年级',
            label: '五年级',
            id: '18',
          },
        ]
      },
    ] as any[],
    formatList: [{ value: 'docx', label: 'docx' }, { value: 'pdf', label: 'pdf' }, { value: 'txt', label: 'txt' }, { value: 'markdown', label: 'markdown' }],
    keys: { value: 'id', label: 'label' },
    step: 0,
    canGenerate: false,
    generateImages: [] as any[],
    stepDatas: [] as any[],
    stepTypes: {
      step_complete: '完成',
      step_start: '正在进行',
      complete: '完成',
      error: '失败',
    } as any,
    stepStatus: {
      image_parse: '图片解析',
      copy_rewrite: '文案改写',
      file_generate: '文件生成',
    } as any,
    articles: [] as any[],
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
      count: 9,
      mediaType: ['image'],
      sourceType: ['album'],
      success: async (res) => {
        await this.uploadImage(res.tempFiles);
      }
    });
  },

  /**
   * 拍照
   */
  chooseFromCamera() {
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: async (res) => {
        await this.uploadImage(res.tempFiles);
      }
    });
  },

  /**
   * 从聊天记录选择
   */
  chooseFromChat() {
    wx.chooseMessageFile({
      count: 9,
      type: 'image',
      success: async (res) => {
        await this.uploadImage(res.tempFiles);
        this.setData({
          popupVisible: false
        });
      }
    });
  },

  /**
   * 删除图片
   */
  deleteImage(e: any) {
    const { key } = e.currentTarget.dataset;
    const imageList = this.data.imageList.filter(item => item.key !== key);
    const generateImages = this.data.generateImages.filter((_, index) => {
      return this.data.imageList[index].key !== key;
    });
    this.setData({
      imageList,
      generateImages,
      canGenerate: imageList.length > 0
    });
  },
  async uploadImage(files: any[]) {
    try {
      this.setData({
        imageList: files.map(file => {
          return {
            status: 'uploading',
            key: file.tempFilePath,
          }
        }),
        popupVisible: false,
      });
      const promises = files.map(async (file) => {
        const index = this.data.imageList.findIndex(item => item.key === file.tempFilePath);
        const key = `imageList[${index}]`;
        try {
          const url = await uploadFileToCos(file.tempFilePath, 'common');
          this.setData({ [key]: { status: 'uploaded', url: file.tempFilePath } });
          return url;
        } catch (error) {
          this.setData({ [key]: { status: 'failed' }, popupVisible: false });
          return null;
        }
      });
      const urls = await Promise.all(promises);
      this.setData({
        canGenerate: true,
        generateImages: urls,
      });
      console.log(urls);

    } catch (error) {
      console.error('上传失败', error);
    }
  },
  async handleGenerate() {
    try {
      if (!this.data.generateImages.length) {
        Toast({
          message: '请先上传图片',
          theme: 'warning',
          duration: 2000,
          direction: 'column',
        });
        return;
      }
      if (!this.data.selectedLevel) {
        Toast({
          message: '请先选择年级',
          theme: 'warning',
          duration: 2000,
          direction: 'column',
        });
        return;
      }
      if (!this.data.selectedFormat) {
        Toast({
          message: '请先选择格式',
          theme: 'warning',
          duration: 2000,
          direction: 'column',
        });
        return;
      }
      // 重置累加的文本
      this.setData({
        step: 1,
        stepDatas: [],
      });

      await streamRequest({
        url: '/generate',
        data: {
          imageUrls: this.data.generateImages,
          subject: '语文',
          level: this.data.selectedLevel,
          format: this.data.selectedFormat
        },
        onProgress: (event: any) => {
          // 如果有 chunk，累加到对应步骤
          const stepDatas = this.data.stepDatas;
          stepDatas.push(event);
          this.setData({
            stepDatas: stepDatas,
            step: event.type === 'complete' ? 2 : 1,
            articles: event?.data?.articles ?? [] as any[],
          });
          console.log('Progress event:', event);
        }
      });
    } catch (error) {
      console.error('生成失败:', error);
      Toast({
        message: '生成失败，请重试',
        theme: 'error',
        duration: 2000,
        direction: 'column',
      });
    }

  },
  /**
   * 显示年级选择器
   */
  showLevelPicker() {
    this.setData({
      levelPickerVisible: true
    });
  },

  /**
   * 显示格式选择器
   */
  showFormatPicker() {
    this.setData({
      formatPickerVisible: true
    });
  },

  /**
   * 年级选择变化
   */
  onLevelChange(e: any) {
    const { selectedOptions } = e.detail;
    const [grade, stage] = selectedOptions
    console.log(grade, stage);
    this.setData({
      selectedLevel: `${grade.label}${stage.label}`,
      levelValue: stage.id,
    });
    console.log(this.data, e);
  },

  /**
   * 格式选择变化
   */
  onFormatChange(e: any) {
    console.log(e);
    const { value } = e.detail;
    this.setData({
      formatValue: value,
      selectedFormat: value
    });
  },

  /**
   * 选择器取消
   */
  onPickerCancel() {
    this.setData({
      levelPickerVisible: false,
      formatPickerVisible: false
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
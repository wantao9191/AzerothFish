// pages/read/index.ts
import { get, post } from '../../utils/request';
import Toast, { hideToast } from 'tdesign-miniprogram/toast';

Page({
  data: {
    book: {} as any,
    progress: {} as any,
    chapters: {} as any,
    showSettings: false,
    catalogVisible: false,
    scrollTop: 0,
    safeAreaTop: 0, // 新增状态栏高度数据
    scrollIntoViewId: '',
  },

  // 记录当前的滚动位置
  currentScrollTop: 0,
  progressTimer: null as number | null,

  async onLoad(options: any) {
    const { id } = options;
    Toast({
      message: 'Loading...',
      theme: 'loading',
      direction: 'column',
      duration: -1,
    });
    await this.getBook(id);
    await this.getProgress(id);
    if (this.data.progress && this.data.progress.currentChapterId) {
      await this.getChapters(this.data.progress.currentChapterId);
    } else {
      await this.getChapters(this.data.book.chapters[0].id);
    }
    hideToast();
  },
  async getBook(id: number) {
    try {
      const books = await get(`/books/${id}`)
      this.setData({ book: books.data });
      hideToast();
    } catch {
      hideToast();
    }
  },
  async getProgress(id: number) {
    try {
      const progress = await get(`/books/${id}/progress`)
      this.setData({ progress: progress.data });
    } catch {
      hideToast();
    }
  },
  async getChapters(id: number) {
    try {
      const res = await get(`/chapters/${id}`);
      this.setData({ chapters: res.data, scrollIntoViewId: `chapter-${id}` }, () => {
        // 如果加载的是进度记录的章节，且有进度值，则恢复滚动位置
        if (this.data.progress && this.data.progress.currentChapterId === id && this.data.progress.progress) {
          this.setData({ scrollTop: this.data.progress.progress });
        } else {
          this.setData({ scrollTop: 0 });
        }
      });
    } catch (e) {
      console.error(e);
    }
  },
  async onChapterClick(e: any) {
    Toast({
      message: 'Loading...',
      theme: 'loading',
      direction: 'column',
      duration: -1,
    });
    const { id } = e.currentTarget.dataset;
    this.setData({ catalogVisible: false, showSettings: false });
    await this.getChapters(id);
    hideToast();
  },
  back() {
    wx.navigateBack();
  },
  showCatalog() {
    this.setData({
      catalogVisible: true,

    });
  },
  closeCatalog() {
    this.setData({ catalogVisible: false });
  },
  onVisibleChange(e: any) {
    this.setData({ catalogVisible: e.detail.visible });
  },
  toggleSettings() {
    this.setData({ showSettings: !this.data.showSettings });
  },
  async previousChapter() {
    Toast({
      message: 'Loading...',
      theme: 'loading',
      direction: 'column',
      duration: -1,
    });
    await this.getChapters(this.data.book.chapters[this.data.chapters.orderIndex - 2].id);
    this.updateProgress();
    hideToast();
  },
  async nextChapter() {
    Toast({
      message: 'Loading...',
      theme: 'loading',
      direction: 'column',
      duration: -1,
    });
    await this.getChapters(this.data.book.chapters[this.data.chapters.orderIndex].id);
    this.updateProgress();
    hideToast();
  },
  updateProgress() {
    if (!this.data.book || !this.data.book.id || !this.data.chapters || !this.data.chapters.id) return;

    post(`/books/${this.data.book.id}/progress`, {
      currentChapterId: this.data.chapters.id,
      progress: parseInt(this.currentScrollTop.toString()) || 0,
    });
  },

  onScroll(e: any) {
    // 实时记录滚动位置，但不频繁 setData 避免性能问题
    this.currentScrollTop = e.detail.scrollTop;

    // 防抖：滚动停止 5s 后自动保存进度
    if (this.progressTimer) {
      clearTimeout(this.progressTimer);
    }
    this.progressTimer = setTimeout(() => {
      this.updateProgress();
    }, 2000);
  },

  onUnload() {
    if (this.progressTimer) {
      clearTimeout(this.progressTimer);
    }
  },
});

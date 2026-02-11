import config from '../config/index';

// 后端接口基础地址，根据环境修改
const BASE_URL = config.baseUrl;

// 对应后端的 ResultCode
export enum ResultCode {
  SUCCESS = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  ERROR = 500,
}

// 对应后端的 Result<T> 接口
export interface ApiResult<T = any> {
  code: number;
  message: string;
  data?: T;
}

// 请求配置接口
interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  showLoading?: boolean; // 是否显示 loading
}

// Token 存储键名
const TOKEN_KEY = config.tokenKey;

/**
 * 获取 Token
 */
export const getToken = (): string => {
  return wx.getStorageSync(TOKEN_KEY) || '';
};

/**
 * 设置 Token
 */
export const setToken = (token: string) => {
  wx.setStorageSync(TOKEN_KEY, token);
};

/**
 * 移除 Token
 */
export const removeToken = () => {
  wx.removeStorageSync(TOKEN_KEY);
};

/**
 * 核心请求方法
 */
const request = <T = any>(options: RequestOptions): Promise<ApiResult<T>> => {
  return new Promise((resolve, reject) => {
    const { url, method = 'GET', data, header = {} } = options;

    // 拼接完整 URL
    // 如果 url 已经是完整的 (http 开头)，则不拼接 BASE_URL
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

    // 获取并携带 Token
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...header,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    wx.request({
      url: fullUrl,
      method,
      data,
      header: headers,
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        // HTTP 状态码
        const statusCode = res.statusCode;

        // 尝试解析响应体
        const result = res.data as ApiResult<T>;

        // 处理 HTTP 状态码异常 (如 401, 404, 500 等)
        if (statusCode !== 200) {
          // 特殊处理 401 未授权
          if (statusCode === 401) {
            handleAuthError();
            reject({ code: statusCode, message: '未登录或Token过期', data: null });
            return;
          }

          wx.showToast({
            title: result.message || `请求错误 ${statusCode}`,
            icon: 'none',
          });
          reject({ code: statusCode, message: result.message || 'HTTP Error', data: null });
          return;
        }

        // 处理业务状态码 (code)
        // 假设后端约定 200 为成功，其他为失败
        if (result.code === ResultCode.SUCCESS) {
          resolve(result);
        } else {
          // 业务逻辑错误
          if (result.code === ResultCode.UNAUTHORIZED) {
            handleAuthError();
          } else {
            wx.showToast({
              title: result.message || '业务处理失败',
              icon: 'none',
            });
          }
          reject(result);
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none',
        });
        reject({ code: -1, message: err.errMsg, data: null });
      },
    });
  });
};

/**
 * 处理授权错误（401）
 */
const handleAuthError = () => {
  // 防止重复跳转或提示
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  // 假设登录页路径为 /pages/login/index (根据实际情况修改)
  // if (currentPage && currentPage.route !== 'pages/login/index') {
  removeToken();
  wx.showToast({
    title: '请重新登录',
    icon: 'none',
  });
  // 可以选择跳转到登录页
  // wx.redirectTo({ url: '/pages/login/index' });
  // }
};

/**
 * 封装 GET 请求
 */
export const get = <T = any>(url: string, data?: any): Promise<ApiResult<T>> => {
  return request<T>({ url, method: 'GET', data });
};

/**
 * 封装 POST 请求
 */
export const post = <T = any>(url: string, data?: any): Promise<ApiResult<T>> => {
  return request<T>({ url, method: 'POST', data });
};

/**
 * 封装 PUT 请求
 */
export const put = <T = any>(url: string, data?: any): Promise<ApiResult<T>> => {
  return request<T>({ url, method: 'PUT', data });
};

/**
 * 封装 DELETE 请求
 */
export const del = <T = any>(url: string, data?: any): Promise<ApiResult<T>> => {
  return request<T>({ url, method: 'DELETE', data });
};

export default {
  get,
  post,
  put,
  delete: del,
  getToken,
  setToken,
  removeToken,
};

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
  // const pages = getCurrentPages();
  // const currentPage = pages[pages.length - 1];
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

// ==================== 流式请求相关 ====================

/**
 * 流式进度事件接口
 */
export interface ProgressEvent {
  type: 'step_start' | 'step_progress' | 'step_complete' | 'complete' | 'error';
  step?: 'image_parse' | 'copy_rewrite' | 'file_generate';
  progress: number; // 0-100
  data?: any;
  chunk?: string; // AI 生成的文字片段（流式）
  error?: string;
}

/**
 * 流式请求配置接口
 */
export interface StreamRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  onProgress?: (event: ProgressEvent) => void; // 进度回调
}

/**
 * ArrayBuffer 转字符串的辅助函数（支持 UTF-8 编码）
 */
const arrayBufferToString = (buffer: ArrayBuffer): string => {
  // 使用 TextDecoder 正确解码 UTF-8 编码的内容
  try {
    // @ts-ignore - 微信小程序支持 TextDecoder，但类型定义可能不完整
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(buffer);
  } catch (error) {
    // 降级方案：如果 TextDecoder 不可用（虽然微信小程序应该支持）
    console.warn('TextDecoder 不可用，使用降级方案', error);
    const uint8Array = new Uint8Array(buffer);
    let result = '';
    for (let i = 0; i < uint8Array.length; i++) {
      result += String.fromCharCode(uint8Array[i]);
    }
    return result;
  }
};

/**
 * 流式请求方法
 * 支持 SSE (Server-Sent Events) 格式的流式响应
 * 
 * @param options 流式请求配置
 * @returns Promise，在请求完成时 resolve，返回最终结果
 */
export const streamRequest = <T = any>(options: StreamRequestOptions): Promise<ApiResult<T>> => {
  return new Promise((resolve, reject) => {
    const { url, method = 'POST', data, header = {}, onProgress } = options;

    // 拼接完整 URL
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

    // 获取并携带 Token
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-enable-stream': 'true', // 启用流式输出
      ...header,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // 创建请求任务
    // 注意：enableChunked 和 onChunkReceived 是微信小程序的实验性功能
    // 类型定义可能不完整，使用 any 类型断言
    const requestTask: any = wx.request({
      url: fullUrl,
      method,
      data,
      header: headers,
      enableChunked: true, // 启用分块传输
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        // 流式请求成功完成
        console.log('流式请求完成', res);
      },
      fail: (err: any) => {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none',
        });
        reject({ code: -1, message: err.errMsg, data: null });
      },
    } as any);

    let buffer = '';
    let finalResult: ApiResult<T> | null = null;

    // 监听数据分块接收
    requestTask.onChunkReceived((res: any) => {
      try {
        // 将 ArrayBuffer 转换为字符串
        const text = arrayBufferToString(res.data);
        buffer += text;

        // 按 SSE 格式分割数据（以 \n\n 分隔）
        const lines = buffer.split('\n\n');
        // 保留未完成的行
        buffer = lines.pop() || '';

        // 处理每一行数据
        lines.forEach((line) => {
          if (line.startsWith('data: ')) {
            try {
              // 解析 JSON 事件数据
              const event: ProgressEvent = JSON.parse(line.slice(6));
              
              // 保存最终结果
              if (event.type === 'complete' && event.data) {
                finalResult = {
                  code: ResultCode.SUCCESS,
                  message: 'success',
                  data: event.data,
                };
              }

              // 触发进度回调
              if (onProgress) {
                onProgress(event);
              }

              // 处理错误事件
              if (event.type === 'error') {
                reject({
                  code: ResultCode.ERROR,
                  message: event.error || '请求出错',
                  data: null,
                });
              }

              // 处理完成事件
              if (event.type === 'complete') {
                if (finalResult) {
                  resolve(finalResult);
                } else {
                  resolve({
                    code: ResultCode.SUCCESS,
                    message: 'success',
                    data: event.data,
                  });
                }
              }
            } catch (parseError) {
              console.error('解析事件数据失败:', line, parseError);
            }
          }
        });
      } catch (error) {
        console.error('处理分块数据失败:', error);
      }
    });
  });
};

/**
 * 封装流式 POST 请求
 * 
 * @param url 请求地址
 * @param data 请求数据
 * @param onProgress 进度回调函数
 * @returns Promise
 */
export const postStream = <T = any>(
  url: string,
  data?: any,
  onProgress?: (event: ProgressEvent) => void
): Promise<ApiResult<T>> => {
  return streamRequest<T>({ url, method: 'POST', data, onProgress });
};

export default {
  get,
  post,
  put,
  delete: del,
  getToken,
  setToken,
  removeToken,
  streamRequest,
  postStream,
};

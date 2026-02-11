import { post, setToken, ApiResult } from '../utils/request';

export interface LoginResult {
  token: string;
  userId: string;
  openid: string;
}

/**
 * 登录
 * @param code 微信登录 code
 */
export const login = (code: string): Promise<ApiResult<LoginResult>> => {
  return post<LoginResult>('/auth/login', { code });
};

/**
 * 执行登录并保存 Token
 */
export const loginAndSaveToken = async (): Promise<boolean> => {
  try {
    // 1. 获取微信登录 Code
    const { code } = await wx.login();
    
    // 2. 调用后端登录接口
    const res = await login(code);
    
    // 3. 保存 Token
    if (res.code === 200 && res.data) {
      setToken(res.data.token);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Login failed:', err);
    return false;
  }
};

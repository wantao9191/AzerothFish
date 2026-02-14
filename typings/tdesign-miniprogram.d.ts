declare module 'tdesign-miniprogram/toast' {
  interface ToastOptions {
    message: string;
    theme?: 'loading' | 'success' | 'error' | 'warning';
    duration?: number;
    direction?: 'row' | 'column';
    icon?: string;
    preventScrollThrough?: boolean;
    context?: any;
    selector?: string;
  }

  function Toast(options: ToastOptions | string): void;
  
  export function hideToast(options?: { context?: any; selector?: string }): void;
  export function showToast(options: ToastOptions): void;
  
  export default Toast;
}

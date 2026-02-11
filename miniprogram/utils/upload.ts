import { get } from './request';
// @ts-ignore
import COS from 'cos-wx-sdk-v5';

// 定义接口返回类型 (仅保留 STS 模式)
interface UploadAuthData {
    credentials?: {
        tmpSecretId: string;
        tmpSecretKey: string;
        sessionToken: string;
    };
    startTime?: number;
    expiredTime?: number;
    bucket?: string;
    region?: string;
    path?: string; // 上传路径/文件名
    fileUrl?: string; // 可选：后端返回的完整文件URL
    [key: string]: any; // 允许其他字段
}

/**
 * 上传文件到腾讯云 COS (STS 策略)
 * @param filePath 本地文件路径
 * @param onProgress 上传进度回调 (percent: 0-100)
 * @returns Promise<string> 返回上传后的文件 URL
 */
export const uploadFileToCos = (filePath: string, module: string, onProgress?: (percent: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {

        // 1. 请求后端获取 STS 凭证
        get<UploadAuthData>('/sts', { module })
            .then(res => {
                const data = res.data;
                if (!data) {
                    reject(new Error('获取上传凭证失败: 返回数据为空'));
                    return;
                }

                console.log('获取上传凭证成功', data);

                // 强制使用 STS 模式上传
                uploadWithSTS(filePath, data, onProgress).then(resolve).catch(reject);
            })
            .catch(err => {
                console.error('获取上传凭证接口失败', err);
                reject(err);
            });
    });
};

/**
 * 使用 STS 临时密钥上传 (依赖 cos-wx-sdk-v5)
 */
const uploadWithSTS = (filePath: string, data: UploadAuthData, onProgress?: (percent: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
        // 校验关键参数
        const missingParams = [];
        if (!data.credentials) missingParams.push('credentials');
        else {
            if (!data.credentials.tmpSecretId) missingParams.push('credentials.tmpSecretId');
            if (!data.credentials.tmpSecretKey) missingParams.push('credentials.tmpSecretKey');
            if (!data.credentials.sessionToken) missingParams.push('credentials.sessionToken');
        }

        // 如果后端没返回 bucket 或 region，尝试使用 data 根目录下的其他可能的字段名，或者报错
        // 这里我们严格校验，因为 COS SDK 需要这些
        if (!data.bucket) missingParams.push('bucket');
        if (!data.region) missingParams.push('region');

        if (missingParams.length > 0) {
            console.error('STS 上传缺少必要参数:', missingParams, '完整数据:', data);
            reject(new Error(`STS 上传缺少必要参数: ${missingParams.join(', ')}`));
            return;
        }

        // 初始化 COS 实例
        const cos = new COS({
            // 强制使用 putObject (简单上传)，避免高级功能的复杂性
            SimpleUploadMethod: 'putObject',
            getAuthorization: function (options: any, callback: any) {
                // 直接使用后端返回的临时密钥
                callback({
                    TmpSecretId: data.credentials!.tmpSecretId,
                    TmpSecretKey: data.credentials!.tmpSecretKey,
                    SecurityToken: data.credentials!.sessionToken,
                    StartTime: data.startTime, // 时间戳，单位秒
                    ExpiredTime: data.expiredTime,
                });
            }
        });

        // 确定上传的文件 Key (路径)
        // 优先使用后端指定的 path，如果没有则自动生成
        let key = data.path;
        if (!key) {
            const fileName = filePath.substr(filePath.lastIndexOf('/') + 1);
            key = `${data.dir}/${Date.now()}_${fileName}`;
        }

        // 确保 Key 不以 / 开头
        if (key.startsWith('/')) {
            key = key.substr(1);
        }

        cos.uploadFile({
            Bucket: data.bucket,
            Region: data.region,
            Key: key,
            FilePath: filePath,
            SliceSize: 1024 * 1024 * 5, // 5MB 分片
            onProgress: function (progressData: any) {
                // progressData.percent 是 0 到 1 之间的小数
                console.log('COS SDK 上传进度', progressData.percent);
                if (onProgress) {
                    const percent = Math.floor(progressData.percent * 100);
                    onProgress(percent);
                }
            },
        }, function (err: any, uploadRes: any) {
            if (err) {
                console.error('COS SDK 上传失败', err);
                reject(err);
            } else {
                // 上传成功，尝试获取带签名的访问 URL (用于私有 Bucket)
                // 注意：这要求 STS Token 同时也拥有 GetObject 权限
                cos.getObjectUrl({
                    Bucket: data.bucket,
                    Region: data.region,
                    Key: key,
                    Sign: true, // 获取带签名的 URL
                    expires: 1800, // 签名有效期10分钟
                }, function (urlErr: any, urlData: any) {
                    if (urlErr || !urlData || !urlData.Url) {
                        console.warn('获取签名 URL 失败，将返回普通 URL', urlErr);

                        // 降级：使用普通 URL
                        let fileUrl: string = data.fileUrl || '';
                        if (!fileUrl) {
                            const location = uploadRes.Location || '';
                            if (location) {
                                fileUrl = location.startsWith('http') ? location : `https://${location}`;
                            } else {
                                fileUrl = `https://${data.bucket}.cos.${data.region}.myqcloud.com/${key}`;
                            }
                        }
                        resolve(fileUrl);
                    } else {
                        console.log('获取带签名 URL 成功', urlData);
                        resolve(urlData.Url);
                    }
                });
            }
        });
    });
};

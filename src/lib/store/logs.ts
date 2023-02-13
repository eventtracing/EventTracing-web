import { ILog } from '../static/types';
import { isFunction } from '../static/helper';

const logs: Array<ILog> = [];

/**
 * 入队一条日志
 * @param log
 * @param callback
 */
export const pushLog = (log: ILog, callback?: any): void => {
    logs.push(log);

    if (isFunction(callback)) callback(log);
};

/**
 * 出队指定数量日志
 * @param len
 */
export const shiftLog = (len: number): Array<ILog> => {
    if (typeof len === 'number' && len > 0) return logs.splice(0, len);

    return [];
};

/**
 * 获取日志队列长度
 */
export const getLogsLength = (): number => logs.length || 0;

import { IHookConsoleParamType, IHookConsoleParamOptions } from './static/types';
import {
    getBody,
    isObject,
    isString,
    consoleLog,
    isInSearch,
    assignObject,
    consoleError,
    consoleWarn,
    isFunction,
    getWindow,
} from './static/helper';

let config: any = {
    root: getBody(), // 根节点，可配置
    sessId: '', // 不可配置
    io: null,
    globalParams: {
        _url: getWindow('location')?.href || '',
    }, // 公参，可配置

    isDefaultReportEd: false, // 是否全部上报元素结束曝光事件，可配置

    isUseHeartbeat: false, // 是否开启心跳，可配置
    heartbeatInterval: 10000, // 心跳间隔

    reportLogs: null, // 日志上报通道，可配置
    HookConsole: null,
    reportLogsCallbackList: [], // 上报日志时，callback队列
};

export const callHook = (type: IHookConsoleParamType, message: string, options: IHookConsoleParamOptions): void => {
    const { force = false, ...otherOptions }: any = options || {};
    const { code } = options || {};
    const consoleParams = isInSearch('console') ? [otherOptions] : [];

    if (!code) return;

    if (type === 'error') {
        consoleError(message, ...consoleParams);
    } else if (type === 'warn') {
        consoleWarn(message, ...consoleParams);
    } else {
        if (type === 'log' && force) {
            consoleLog(message, ...consoleParams);
        } else if (isInSearch('console') && code === 'report') {
            consoleLog(message, otherOptions?.reportLogs);
        } else if (isInSearch('console', code) && code === 'beforeReport') {
            consoleLog(message, otherOptions?.reportLogs);
        } else if (isInSearch('console', code)) {
            consoleLog(message, otherOptions);
        }
    }

    const { HookConsole } = getConfig();

    if (isFunction(HookConsole)) {
        try {
            HookConsole?.(type, message, otherOptions);
        } catch (error) {
            consoleWarn('钩子执行：出错', { ...otherOptions, error });
        }
    }
};

export const setConfig = (keyOrConfig: string | any, value?: any): void => {
    if (isObject(keyOrConfig)) config = assignObject(config, keyOrConfig);
    if (isString(keyOrConfig)) {
        if (keyOrConfig === 'reportLogsCallbackList') {
            config.reportLogsCallbackList?.push?.(value);
        } else if (keyOrConfig === 'globalParams') {
            config.globalParams = assignObject(config.globalParams, value);
        } else {
            config[keyOrConfig] = value;
        }
    }

    if (isInSearch('console', 'config')) {
        consoleLog('配置更新', { key: keyOrConfig, value, config });
    }
};

export const getConfig = (key?: string): any => {
    if (typeof key === 'string') return config[key];

    return config;
};

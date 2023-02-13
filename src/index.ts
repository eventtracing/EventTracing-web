import 'intersection-observer';
import { startHeartbeat, pauseHeartbeat } from './lib/heartbeat';
import { setConfig, getConfig, callHook } from './lib/config';
import { IDawnInitParamsOptions } from './lib/static/types';
import {
    isNumber,
    isFunction,
    isBoolean,
    isWindow,
    getWindow,
    setWindow,
    isObject,
} from './lib/static/helper';
import * as CONST from './lib/static/const';
import {
    getSessId,
    getIntersectionObserver,
    startMutationObserver,
    triggerBatchExpose,
    triggerCustomLogger,
    listeningClickEvent,
} from './lib/core';

// 监听页面进入前台
const listeningPageShow = (onPageShow): void => {
    if (isFunction(onPageShow)) {
        try {
            onPageShow(() => {
                startHeartbeat();
                triggerBatchExpose(true);
            });
        } catch (error) {
            callHook('error', '注册客户端事件：失败，APP 进入前台事件', {
                code: 'init', error, initConfig: getConfig(),
            });
        }
    } else {
        callHook('warn', '注册客户端事件：失败，未设置 APP 进入前台事件，如不需要页面进入前台时自动上报开始曝光日志可忽略', {
            code: 'init', error: null, initConfig: getConfig(),
        });
    }
};

// 监听页面进入后台
const listeningPageHide = (onPageHide): void => {
    if (isFunction(onPageHide)) {
        try {
            onPageHide(() => {
                pauseHeartbeat();
                triggerBatchExpose(false);
            });
        } catch (error) {
            callHook('error', '注册客户端事件：失败，APP 进入后台事件', {
                code: 'init', error, initConfig: getConfig(),
            });
        }
    } else {
        callHook('warn', '注册客户端事件：失败，未设置 APP 进入后台事件，如不需要页面进入后台时自动上报结束曝光日志可忽略', {
            code: 'init', error: null, initConfig: getConfig(),
        });
    }
};

// 埋点初始化方法
const init = (options: IDawnInitParamsOptions): boolean => {
    const {
        reportLogs,
        root,
        globalParams,
        isDefaultReportEd,
        isUseHeartbeat,
        heartbeatInterval,
        onPageShow,
        onPageHide,

        HookConsole,
    } = options || {};
    const {
        WINDOW_DAWN,
        WINDOW_DAWN_TRIGGER,
        WINDOW_DAWN_INITIALIZED,
        WINDOW_DAWN_REPORTING_STOPPED,
        WINDOW_DAWN_CONST,
        WINDOW_DAWN_TOOL,
        WINDOW_DAWN_TOOL_INSTANCE,
    } = CONST;

    if (!isWindow()) {
        callHook('error', '曙光初始化：失败，不在浏览器环境', {
            code: 'init', error: null, initConfig: getConfig(),
        });
        return false;
    }
    if (getWindow(WINDOW_DAWN)?.[WINDOW_DAWN_INITIALIZED] === true) {
        callHook('warn', '曙光初始化：重复初始化，本次跳过', {
            code: 'init', error: null, initConfig: getConfig(),
        });
        return false;
    }

    if (isFunction(reportLogs)) setConfig('reportLogs', reportLogs);
    if (root) setConfig('root', root);
    if (isObject(globalParams)) setConfig('globalParams', globalParams);
    if (isBoolean(isDefaultReportEd)) setConfig('isDefaultReportEd', isDefaultReportEd);
    if (isBoolean(isUseHeartbeat)) setConfig('isUseHeartbeat', isUseHeartbeat);
    if (isNumber(heartbeatInterval) && heartbeatInterval >= 2000) setConfig('heartbeatInterval', heartbeatInterval);
    if (isFunction(HookConsole)) setConfig('HookConsole', HookConsole);

    setConfig('sessId', getSessId());
    setConfig('io', getIntersectionObserver());

    setWindow(WINDOW_DAWN, {
        [WINDOW_DAWN_TRIGGER]: triggerCustomLogger,
        [WINDOW_DAWN_INITIALIZED]: true,
        [WINDOW_DAWN_REPORTING_STOPPED]: false,
        [WINDOW_DAWN_CONST]: CONST,
        [WINDOW_DAWN_TOOL]: null,
        [WINDOW_DAWN_TOOL_INSTANCE]: null,
    });

    try {
        startMutationObserver();
    } catch (error) {
        callHook('error', '曙光初始化：失败', {
            code: 'init', error, initConfig: getConfig(),
        });
        return false;
    }

    listeningClickEvent();
    listeningPageShow(onPageShow);
    listeningPageHide(onPageHide);
    startHeartbeat();

    callHook('log', '曙光初始化：完成', {
        code: 'init', force: true, initConfig: getConfig(),
    });
    return true;
};

export { CONST, init };
export default { CONST, init };

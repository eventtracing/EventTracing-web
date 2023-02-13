/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
    IHtmlNode,
    IDataLog,
    ILog,
    IObject,
    IFindKeyNodeParamsOptions,
    IReferOptions,
    ICreateAndPushLogParamsOptions,
    ICreateAndPushLogResult,
    ITriggerCustomLoggerParamsOptions,
    ITriggerCustomLoggerResult,
} from './static/types';
import { getConfig, callHook } from './config';
import {
    OBJ_PARAMS_KEY,
    OBJ_RECORD_KEY,
    OBJ_ANCESTORS_KEY,
    
    NODE_ANCESTORS, NODE_SPM, NODE_GET_SPM,

    EVENT_NAME_MAP,
    ATTRIBUTE_KEY,
    OBJ_CHILDREN_KEY,
    WINDOW_DAWN,
    WINDOW_DAWN_REPORTING_STOPPED,
} from './static/const';
import {
    isArray,
    isNumber,
    isObject,
    isString,
    isBoolean,
    isFunction,
    getWindow,
    getBody,
    getElement,
    getElements,
    postponeCallback,
    getQuery,
    getRandomString,
    assignObject,
} from './static/helper';
import { getObject, getObjectById, getObjects, setObject } from './store/objects';
import { getLogsLength, pushLog, shiftLog } from './store/logs';
import { getBufferSize, pushBuffer, shiftBuffer } from './store/buffer';

const DEFAULT_LOG_PARAMS = {
    oid: '',
    isPage: false,
    events: [],
    params: {},
};

let objectIndex: number = 100000;

// 默认日志上报方法 
const defaultReportLogs = ({ logs = [] } = { logs: [] }): void => {
    if (!logs.length) return;

    callHook('error', '日志上报：失败，未设置日志上报通道', {
        code: 'report', error: null, reportLogs: logs,
    });

    logs.map((log) => {
        const { event, params, useForRefer } = log || {};
        const { _spm } = params || {};

        callHook('error', '日志上报：失败，未设置日志上报通道', {
            code: 'report', error: null, reportSpm: _spm, reportLog: log, reportEvent: event, reportUseForRefer: useForRefer,
        });
    });
};

// 上报日志
const reportLog = (logs: ILog[]): void => {
    const { reportLogs, reportLogsCallbackList } = getConfig();

    if (!isFunction(reportLogs)) {
        defaultReportLogs({ logs });
        return;
    }

    callHook('log', '日志上报：上报前', {
        code: 'beforeReport', beforeReportLogs: logs,
    });

    try {
        if (reportLogsCallbackList?.length) {
            reportLogsCallbackList.map((reportLogsCallback: any) => {
                reportLogsCallback?.({ logs });
            });
        }
    } catch (error) {
        callHook('error', '日志上报：回调队列执行出错', {
            code: 'report', error, reportLogs: logs,
        });
    }

    try {
        reportLogs({ logs });
    } catch (error) {
        callHook('error', '日志上报：失败，执行出错', {
            code: 'report', error, reportLogs: logs,
        });
    }
};

// 上报指定数量日志
const reportAllLogs = (): void => {
    if (!getLogsLength()) return;

    const logs = shiftLog(10);

    reportLog(logs);
    if (getLogsLength()) reportAllLogs();
};

// 获取埋点事件
const formatEvents = (events: string[], isPage: boolean): string[] => {
    const { isDefaultReportEd } = getConfig();
    const defaultEvents = isPage
        ? [EVENT_NAME_MAP.pv, EVENT_NAME_MAP.pd]
        : (isDefaultReportEd ? [EVENT_NAME_MAP.ev, EVENT_NAME_MAP.ed] : [EVENT_NAME_MAP.ev]);

    return isArray(events) ? events : defaultEvents;
};

// 是否已开启心跳、且事件为_pd
const isHeartbeatPd = (eventName: string): boolean => {
    const { isUseHeartbeat } = getConfig();

    return isUseHeartbeat && eventName === EVENT_NAME_MAP.pd;
};

// 转义埋点参数
const formatDataLog = (stringParams: string): IDataLog => {
    if (!stringParams) return DEFAULT_LOG_PARAMS;

    let objectParams = null;

    if (isObject(stringParams)) {
        objectParams = stringParams;
    } else {
        try {
            objectParams = JSON.parse(stringParams);
        } catch (error) {
            callHook('error', '埋点参数：反序列化失败出错', {
                code: 'dataLog', error, dataLogType: 'parse', dataLog: stringParams,
            });
        }
    }

    if (!isObject(objectParams)) return DEFAULT_LOG_PARAMS;
    if (objectParams?.oid) return objectParams;

    const { pageId, elementId } = objectParams || {};

    if (pageId || elementId) {
        return {
            oid: pageId || elementId,
            isPage: !!pageId,
            ...objectParams,
        };
    }

    return DEFAULT_LOG_PARAMS;
};

// 获取节点上的埋点参数（object）
const getDataLog = (target: IHtmlNode, isUpdate?: boolean): IDataLog => {
    if (!target) return DEFAULT_LOG_PARAMS;

    let logParams: IDataLog = target?.[OBJ_PARAMS_KEY];

    if (isUpdate === true) {
        const stringParams: string = target?.attributes?.[ATTRIBUTE_KEY]?.value;

        if (stringParams) {
            logParams = formatDataLog(stringParams);
        }
    }
    
    if (!logParams?.oid) {
        const stringParams: string = target?.attributes?.[ATTRIBUTE_KEY]?.value;

        if (!stringParams) return DEFAULT_LOG_PARAMS;

        logParams = formatDataLog(stringParams);
    }

    const { isPage, events, params } = logParams;
    const currentIsPage = isBoolean(isPage) ? isPage : false;

    return {
        ...logParams,
        isPage: currentIsPage,
        events: formatEvents(events, currentIsPage),
        params: isObject(params) ? params : {},
    };
};

// 当前节点是否关键节点
const isKeyNode = (target: IHtmlNode): boolean => {
    const { oid } = getDataLog(target) || {};

    return isString(oid) && !!oid;
};

// 查找父级关键节点
const findParentKeyNode = (target: IHtmlNode): IHtmlNode => {
    const parent = target?.parentNode;

    if (parent && isKeyNode(parent)) return parent;
    if (!parent) return null;

    return findParentKeyNode(parent);
};

// 查找所有祖先关键节点，直到根节点结束
const collectAncestors = (terget: IHtmlNode, ancestors?: Array<IHtmlNode>): any => {
    ancestors = isArray(ancestors) ? ancestors : isKeyNode(terget) ? [terget] : [];

    const parent = findParentKeyNode(terget);

    if (parent) {
        ancestors.push(parent);
        return collectAncestors(parent, ancestors);
    } else {
        return ancestors;
    }
};

// 查找支持指定事件、指定类型的关键节点
const findKeyNode = (target: IHtmlNode, options?: IFindKeyNodeParamsOptions): IHtmlNode => {
    const { eventName, objectType } = options || {};
    let objectTypeList = [true, false]; // 节点类型，[true]表示仅页面、[false]表示仅元素、[true, false]表示页面及元素

    if (objectType === 'page') {
        objectTypeList = [true];
    } else if (objectType === 'element') {
        objectTypeList = [false];
    }

    while (target) {
        if (isKeyNode(target)) {
            const { events, isPage } = getDataLog(target);

            if (objectTypeList.includes(isPage) && (!eventName || events.includes(eventName))) {
                return target;
            }
        }

        target = findParentKeyNode(target);
    }

    return null;
};

// 获取指定节点的祖先节点栈，根据埋点配置选择
const getAncestors = (target: IHtmlNode): Array<IHtmlNode> => {
    if (!isKeyNode(target)) return [];

    return target?.[OBJ_ANCESTORS_KEY] || [];
};

// 获取指定节点的子节点队列，根据埋点配置选择
const getChildren = (target: IHtmlNode): Array<IHtmlNode> => {
    if (!isKeyNode(target)) return [];

    return target?.[OBJ_CHILDREN_KEY] || [];
};

// 获取spm
const getSpm = (spm: string, oid: string, s_position: string | number): string => `${spm}${spm ? '|' : ''}${oid}${s_position ? ':' + s_position : ''}`;

// 获取scm
const getScm = (scm: string, s_cid: string | number, s_ctype: string, s_ctraceid: string, s_ctrp: string): string => `${scm}${scm ? '|' : ''}${s_cid || ''}:${s_ctype || ''}:${s_ctraceid || ''}:${s_ctrp || ''}`;

// 获取链接中携带的JumpRefer
const getJumpRefer = (): IReferOptions => {
    const { jumprefer: jumpReferStr } = getQuery();

    if (!jumpReferStr) return {};

    let jumpReferObj = {};

    try {
        jumpReferObj = JSON.parse(jumpReferStr);
    } catch (error) {
        callHook('error', 'DpRefer生成：失败，JumpRefer 反序列化出错', {
            code: 'refer', error, refer: jumpReferStr,
        });
    }

    return jumpReferObj;
};

const getReferItem = (val) => (val ? '[' + val + ']' : '');

// 获取Refer
const getRefer = (options: IReferOptions = {}): string => {
    const { sessId, type, actSeq, pgStep, spm, scm } = options || {};
    const currentSessId = sessId || getConfig()?.sessId;
    const currentType = ['e', 'p', 's'].includes(type) ? type : '';
    const currentSpm = spm ? encodeURIComponent(spm) : '';
    const currentScm = scm ? encodeURIComponent(scm) : '';
    const currentActSeq = isNumber(actSeq) || isString(actSeq) ? `${actSeq}` : '';
    const currentPgStep = isNumber(pgStep) || isString(pgStep) ? `${pgStep}` : '';
    let option = 0;

    if (currentSessId) option += 1;
    if (currentType) option += 10;
    if (currentActSeq) option += 100;
    if (currentPgStep) option += 1000;
    if (currentSpm) option += 10000;
    if (currentScm) option += 100000;
    if (currentSpm || currentScm) option += 10000000000; // er

    return [
        `[F:${option}]`,
        getReferItem(currentSessId),
        getReferItem(currentType),
        getReferItem(currentActSeq),
        getReferItem(currentPgStep),
        getReferItem(currentSpm),
        getReferItem(currentScm),
    ].join('');
};

// 获取dprefer
const getDpRefer = (): string => getRefer(getJumpRefer());

// 获取埋点参数
const getLog = (target: IHtmlNode, options?: any): ILog => {
    const { eventName, publicParams, useForRefer } = options || {};
    const globalParams = getConfig('globalParams');
    let ancestors = getAncestors(target);

    if (!ancestors?.length) {
        ancestors = collectAncestors(target)?.slice?.(1) || [];
    }

    const peList = [target, ...ancestors];
    const peListLen = peList?.length || 0;
    const { startTime, endTime }: IObject = getObject(target);
    const duration = (endTime - startTime) || 0;
    const dpRefer = getDpRefer();
    const { sessId } = getConfig();
    const pList = [];
    const eList = [];
    let spm = '';
    let scm = '';
    let currentUseForRefer = null;

    for (let i = 0; i < peListLen; i++) {
        const item = peList[i];
        const { oid, params, isPage } = getDataLog(item, true);
        const { s_position, s_ctraceid, s_ctrp, s_cid, s_ctype } = params || {};
        const commonParams = {
            ...(isObject(params) ? params : {}),
        };

        if (oid) {
            spm = getSpm(spm, oid, s_position);
            scm = getScm(scm, s_cid, s_ctype, s_ctraceid, s_ctrp);

            if (isPage) {
                pList.push({ _oid: oid, ...commonParams });
            } else {
                eList.push({ _oid: oid, ...commonParams });
            }
        }
    }

    const spmLength = spm?.split('|')?.length || 0;

    if (isBoolean(useForRefer)) {
        currentUseForRefer = useForRefer;
    } else if (isArray(useForRefer)) {
        currentUseForRefer = useForRefer?.includes?.(eventName);
    }
    
    if ([EVENT_NAME_MAP?.ec].includes(eventName)) {
        currentUseForRefer = currentUseForRefer !== false;
    } else if ([EVENT_NAME_MAP?.pv].includes(eventName)) {
        currentUseForRefer = currentUseForRefer !== false && spmLength <= 1;
    } else {
        currentUseForRefer = !!currentUseForRefer;
    }

    return {
        event: eventName || '',
        useForRefer: isBoolean(currentUseForRefer) ? currentUseForRefer : false,
        _plist: pList,
        _elist: eList,
        _spm: spm,
        _scm: scm,
        params: assignObject(
            {
                _eventtime: Date.now(),
                _sessid: sessId,
                g_dprefer: dpRefer,
            },
            [EVENT_NAME_MAP.pd, EVENT_NAME_MAP.ed].includes(eventName) ? { _duration: duration } : {},
            publicParams,
            globalParams
        ),
    };
};

// 构建并将埋点日志push至日志队列
const createAndPushLog = ($object: any, eventName: string, options?: ICreateAndPushLogParamsOptions): ICreateAndPushLogResult | any => {
    const defaultResult = { isPrevent: true };

    if (!($object && isString(eventName))) return defaultResult;

    const formattedDataLog = getDataLog($object);
    const { oid, events, useForRefer: privateUseForRefer } = formattedDataLog || {};
    const { publicUseForRefer, publicParams, isForce, isBatch, isHeartbeat } = options || {};
    const currentUseForRefer: any = isBoolean(publicUseForRefer) ? publicUseForRefer : (isArray(publicUseForRefer) ? publicUseForRefer : privateUseForRefer);

    if (!(isString(oid) && oid)) {
        callHook('error', '埋点参数：参数校验不通过', {
            code: 'dataLog', error: null, dataLogType: 'check', dataLogTarget: $object, dataLog: formattedDataLog,
        });
        return defaultResult;
    }
    if ([EVENT_NAME_MAP.pv, EVENT_NAME_MAP.pd].includes(eventName)) {
        // events中存在pv或pd，或者options.isForce为true才可进行下一步
        if (!(events.includes(EVENT_NAME_MAP.pv) || events.includes(EVENT_NAME_MAP.pd) || isForce === true)) return defaultResult;
    } else if ([EVENT_NAME_MAP.ed].includes(eventName)) {
        // events中存在ev且ed，或者options.isForce为true才可进行下一步
        if (!(events.includes(EVENT_NAME_MAP.ev) && events.includes(EVENT_NAME_MAP.ed) || isForce === true)) return defaultResult;
    } else {
        if (!(events.includes(eventName) || isForce === true)) return defaultResult;
    }

    const log = getLog($object, { eventName, publicParams, useForRefer: currentUseForRefer });

    if (!log?._plist?.length) {
        callHook('error', '日志构建：失败，没有页面节点', {
            code: 'buildLog', error: null, buildLogPe: $object, buildLogOptions: options, buildLogResult: log,
        });
        return defaultResult;
    }

    if (!(getWindow(WINDOW_DAWN)?.[WINDOW_DAWN_REPORTING_STOPPED] === true)) {
        const { _spm, _scm, ...rest }: any = log || {};
        pushLog(rest, () => {
            if (isHeartbeat) {
                setObject($object, { startTime: Date.now() });
            }

            if (isBatch === true) {
                postponeCallback(() => {
                    reportAllLogs();
                }, { isIdle: false });
            } else {
                reportAllLogs();
            }
        });
    }

    return assignObject(log, { isPrevent: false });
};

// 获取事件名
const getExposeEventName = (target: IHtmlNode, isGoExpose: boolean): string => {
    const { isPage } = getDataLog(target);

    if (isGoExpose) {
        return isPage ? EVENT_NAME_MAP.pv : EVENT_NAME_MAP.ev;
    } else {
        return isPage ? EVENT_NAME_MAP.pd : EVENT_NAME_MAP.ed;
    }
};

// 更新埋点对象、准备曝光
const updateObjectAndExpose = (entry: any, isGoExpose: boolean): void => {
    const { target: $object } = entry || {};
    const eventName = getExposeEventName($object, isGoExpose);
    const { virtualParent } = getObject($object);

    if (isGoExpose) {
        const extraData = { startTime: Date.now() };

        // 虚拟父节点只在所有子节点中的第一个曝光时曝光
        if (virtualParent?.[OBJ_RECORD_KEY]) {
            const virtualParentObject = getObject(virtualParent);

            if (!virtualParentObject?.isExpose) {
                const virtualParentEventName = getExposeEventName(virtualParent, isGoExpose);

                setObject(virtualParent, { isExpose: isGoExpose, target: virtualParent, ...extraData });
                postponeCallback(() => {
                    createAndPushLog(virtualParent, virtualParentEventName, { isBatch: true });
                }, { isIdle: false });
            }
        }

        setObject($object, { isExpose: isGoExpose, target: $object, ...extraData });
        postponeCallback(() => {
            createAndPushLog($object, eventName, { isBatch: true });
        }, { isIdle: false });
    } else {
        const extraData = { endTime: Date.now() };

        // 虚拟父节点在所有子节点曝光结束后再曝光结束
        if (virtualParent?.[OBJ_RECORD_KEY]) {
            const { target: $virtualParent } = getObject(virtualParent);
            const $virtualParentChildren = getChildren($virtualParent);
            const virtualParentChildrenLen = $virtualParentChildren?.length || 0;
            let hasShowChildren = false;

            if (virtualParentChildrenLen) {
                for (let i = 0; i < virtualParentChildrenLen; i++) {
                    const childrenItem = $virtualParentChildren[i];
                    const childrenItemObject = getObject(childrenItem);

                    if (childrenItemObject?.isExpose) {
                        hasShowChildren = true;
                        break;
                    }
                }

                if (!hasShowChildren) {
                    const virtualParentEventName = getExposeEventName(virtualParent, isGoExpose);

                    // 心跳开启时，要屏蔽正常的_pd
                    if (!isHeartbeatPd(virtualParentEventName)) {
                        setObject(virtualParent, { isExpose: isGoExpose, target: virtualParent, ...extraData });
                        postponeCallback(() => {
                            createAndPushLog(virtualParent, virtualParentEventName, { isBatch: true });
                        }, { isIdle: false });
                    }
                }
            }
        }

        setObject($object, { isExpose: isGoExpose, target: $object, ...extraData });

        if (isHeartbeatPd(eventName)) {
            postponeCallback(() => {
                createAndPushLog($object, eventName, {
                    publicParams: { is_beat: 1 },
                    isBatch: true,
                });
            }, { isIdle: false });
        } else {
            postponeCallback(() => {
                createAndPushLog($object, eventName, { isBatch: true });
            }, { isIdle: false });
        }
    }
};

// 更新关键节点树、监听曝光
const updateTreeAndListeningExpose = ($object: IHtmlNode): void => {
    if (!$object) return;
    if ($object?.[OBJ_RECORD_KEY]) {
        $object[OBJ_PARAMS_KEY] = getDataLog($object, true);
        return;
    }

    const logParams = getDataLog($object, true);
    let mountParentNode = null;

    if (!logParams?.oid) return;
    if (logParams?.mountParentSelector) {
        mountParentNode = getElement(logParams.mountParentSelector);
    }

    const $parent = mountParentNode || findParentKeyNode($object);
    const $ancestors = $parent ? [$parent, ...getAncestors($parent)] : [];
    const virtualParentLogParams = logParams?.virtualParentNode || {};
    const virtualParentKey = virtualParentLogParams?.key;
    const {
        oid: virtualParentOid,
        isPage: virtualParentIsPage,
        params: virtualParentParams,
        events: virtualParentEvents,
        ...otherParams
    } = formatDataLog(virtualParentLogParams);
    let $currentParent = null;
    let $currentAncestors = null;
    let currentObjectInfo = {};

    // 虚拟父节点
    if (virtualParentOid && virtualParentKey) {
        const virtualParentNodeId = `virtual_node_${virtualParentKey}`;
        const virtualParentObject = getObjectById(virtualParentNodeId);
        const $virtualParent = virtualParentObject?.target || {};

        $virtualParent[OBJ_ANCESTORS_KEY] = $ancestors;
        $virtualParent[NODE_ANCESTORS] = $ancestors;
        $virtualParent[NODE_SPM]  ='';
        $virtualParent[NODE_GET_SPM] = () => getLog($virtualParent)?._spm;
        $virtualParent[OBJ_PARAMS_KEY] = {
            oid: virtualParentOid,
            isPage: virtualParentIsPage,
            params: isObject(virtualParentParams) ? virtualParentParams : {},
            events: formatEvents(virtualParentEvents, virtualParentIsPage),
            ...(otherParams || {}),
        };
        $virtualParent[OBJ_RECORD_KEY] = { target: $virtualParent, observe: true, nodeId: virtualParentNodeId };
        setObject($virtualParent);

        if ($parent) {
            $parent[OBJ_CHILDREN_KEY] = getChildren($parent);
            $parent[OBJ_CHILDREN_KEY].push($virtualParent);
        }

        $currentParent = $virtualParent;
        $currentAncestors = [$virtualParent, ...$ancestors];
        currentObjectInfo = { virtualParent: $virtualParent };
    }

    $currentParent = $currentParent || $parent;
    $currentAncestors = $currentAncestors || $ancestors;

    if ($currentParent) {
        $currentParent[OBJ_CHILDREN_KEY] = getChildren($currentParent);
        $currentParent[OBJ_CHILDREN_KEY].push($object);
    }

    $object[OBJ_ANCESTORS_KEY] = $currentAncestors;
    $object[NODE_ANCESTORS] = $currentAncestors;
    $object[NODE_SPM]  ='';
    $object[NODE_GET_SPM] = () => getLog($object)?._spm;
    $object[OBJ_PARAMS_KEY] = logParams;
    $object[OBJ_RECORD_KEY] = { target: $object, observe: true, nodeId: `node_${objectIndex}`, ...currentObjectInfo };

    setObject($object);
    getConfig('io')?.observe?.($object);

    ++objectIndex;
};

// 开始观察
const taskProcessing = (): void => {
    postponeCallback(() => {
        if (!getBufferSize()) return;

        const $target: IHtmlNode = shiftBuffer();
        const $sonObjects: Array<IHtmlNode> = $target ? getElements(`[${ATTRIBUTE_KEY}]`, $target) : [];
        const $objects: Array<IHtmlNode> = isKeyNode($target) ? [$target, ...$sonObjects] : $sonObjects;
        const objectsLen = $objects?.length || 0;

        if (objectsLen) {
            for (let i = 0; i < objectsLen; i++) {
                const $object = $objects[i];

                updateTreeAndListeningExpose($object);
            }
        }

        if (getBufferSize()) taskProcessing();
    }, { isIdle: false });
};

// 观察根节点的子孙节点新增和删除
export const startMutationObserver = (): void => {
    const root = getConfig()?.root || getBody();

    if (!root) return;

    const mutationObserver: any = new MutationObserver((recordList) => {
        const recordListLen = recordList?.length;

        if (!recordListLen) return;

        for (let i = 0; i < recordListLen; i++) {
            const { addedNodes = [], attributeName = '', type: moType = '' }: any = recordList?.[i] || {};

            if (moType === 'attributes') {
                // 属性变化时如果埋点属性更新，则格式化
                if (attributeName === ATTRIBUTE_KEY) {
                    pushBuffer(recordList?.[i]?.target);
                }
            } else {
                // 有新增节点时，将发生变化的节点推入缓冲区
                if (addedNodes?.length) {
                    for (let idx = 0; idx < addedNodes.length; idx++) {
                        pushBuffer(addedNodes[idx]);
                    }
                }
            }
        }

        taskProcessing();
    });

    pushBuffer(root, taskProcessing);
    mutationObserver.observe(root, {
        childList: true, // 观察目标节点的子节点的新增和删除
        attributes: true, // 观察目标节点的属性节点（新增或删除了某个属性，以及某个属性的属性值发生了变化）
        subtree: true, // 观察目标节点的所有后代节点（观察目标节点所包含的整棵 DOM 树上的上述三种节点变化）
    });
};

// 获取当前所有已曝光节点，批量打开始或结束曝光（用于页面被遮盖或进入后台前后的时机）
export const triggerBatchExpose = (isGoExpose: boolean): void => {
    const objects = getObjects();

    for (const key in objects) {
        const { isExpose, target: $object } = objects?.[key] || {};

        if (!(isExpose && $object)) continue;

        const eventName = getExposeEventName($object, isGoExpose);
        const nowTime = Date.now();

        // 心跳开启时，要屏蔽正常的_pd
        if (!isGoExpose && isHeartbeatPd(eventName)) continue;

        setObject($object, isGoExpose ? { startTime: nowTime } : { endTime: nowTime });
        postponeCallback(() => {
            createAndPushLog($object, eventName, { isBatch: true });
        }, { isIdle: false });
    }
};

export const triggerHeartbeatLogger = () => {
    const objects = getObjects();

    for (const key in objects) {
        const { isUseHeartbeat } = getConfig();
        const { isExpose, target: $object } = objects?.[key] || {};

        if (!(isUseHeartbeat && isExpose && $object)) continue;

        const { isPage } = getDataLog($object);
        const nowTime = Date.now();

        if (!isPage) continue;

        setObject($object, { endTime: nowTime });
        postponeCallback(() => {
            createAndPushLog($object, EVENT_NAME_MAP.pd, {
                publicParams: { is_beat: 1 },
                isBatch: true,
                isHeartbeat: true,
            });
        }, { isIdle: false });
    }
};

// 自定义埋点方法
export const triggerCustomLogger = ($object: IHtmlNode, options: ITriggerCustomLoggerParamsOptions): Promise<ITriggerCustomLoggerResult | any> => {
    if (!($object && isKeyNode($object) && options?.event)) return Promise.resolve({});

    const { event: eventName, params, isForce, useForRefer }: any = isObject(options) ? options : {};

    // 心跳开启时，要屏蔽正常的_pd
    if (isHeartbeatPd(eventName)) return Promise.resolve({});

    // 手动打开始曝光、结束曝光时要更新时间
    if ([EVENT_NAME_MAP.pv, EVENT_NAME_MAP.pd, EVENT_NAME_MAP.ev, EVENT_NAME_MAP.ed].includes(eventName)) {
        // 更新开始曝光、结束曝光时间
        const isGoExpose = [EVENT_NAME_MAP.pv, EVENT_NAME_MAP.ev].includes(eventName);
        const nowTime = Date.now();

        setObject($object, isGoExpose ? { startTime: nowTime } : { endTime: nowTime });
    }

    const { isPrevent, _plist, _elist, _spm, _scm, params: logParams } = createAndPushLog($object, eventName, {
        publicUseForRefer: useForRefer,
        publicParams: params,
        isForce: isForce !== false,
    });
    const { g_dprefer, _sessid } = logParams || {};
    const jumprefer = JSON.stringify({
        spm: isString(_spm) ? _spm : '',
        scm: isString(_scm) ? _scm : '',
    });

    if (isBoolean(isPrevent) && isPrevent) return Promise.resolve({});

    return Promise.resolve({
        _plist,
        _elist,
        _spm,
        _scm,
        _sessid,
        g_dprefer,
        jumprefer,
    });
};

// 获取曝光观察者对象
export const getIntersectionObserver = (): any => {
    const EXPOSE_THRESHOLD = 0;

    return new IntersectionObserver((entries?: any[]) => {
        if (!isArray(entries)) return;
    
        const entriesLen = entries?.length || 0;
    
        for (let i = 0; i < entriesLen; i++) {
            const entry = entries[i];
    
            const { target: $object, isIntersecting, intersectionRatio } = entry || {};
            const { nodeId, isExpose } = getObject($object);

            if (nodeId) {
                // 对象记录已曝光，当前未曝光、或当前已曝光但未达曝光阈值，打结束曝光
                if (isExpose && ((isIntersecting && intersectionRatio < EXPOSE_THRESHOLD) || !isIntersecting)) {
                    updateObjectAndExpose(entry, false);
                }
    
                // 对象记录未曝光，当前未已曝光且已达曝光阈值，打开始曝光
                if (!isExpose && isIntersecting && intersectionRatio >= EXPOSE_THRESHOLD) {
                    updateObjectAndExpose(entry, true);
                }
            }
        }
    }, {
        threshold: EXPOSE_THRESHOLD,
    });
};

// 获取sessId
export const getSessId = (): string => `${Date.now()}#${getRandomString(3, true)}`;

// 监听点击事件
export const listeningClickEvent = (): void => {
    try {
        getWindow('document')?.addEventListener?.('click', (e: any) => {
            const eventName = EVENT_NAME_MAP.ec;
            const target = e?.nativeEvent?.target || e?.target;
            const $object = findKeyNode(target, { eventName, objectType: 'element' });

            triggerCustomLogger($object, { event: eventName, isForce: false }).catch(() => {});
        }, false);
    } catch (error) {
        callHook('error', '代理点击事件：失败', {
            code: 'init', error, initConfig: getConfig(),
        });
    }
};

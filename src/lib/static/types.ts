export interface IHtmlNode {
    [key: string]: any;
}

export interface IObject {
    target?: IHtmlNode;
    observe?: boolean;

    nodeId?: string;

    // 当前节点的虚拟父节点
    virtualParent?: any;

    isExpose?: boolean;
    startTime?: number;
    endTime?: number;
}

export interface IObjects {
    [objectId: string]: IObject;
}

export interface IDataLog {
    oid: string;

    isPage?: boolean;
    events?: string[];
    params?: any;
    virtualParentNode?: any;
    mountParentSelector?: string;
    useForRefer?: string[] | boolean;

    // RN参数兼容
    pageId?: string;
    elementId?: string;
    rootpage?: boolean;
    key?: string;
}

interface IHookConsole {
    (
        type: IHookConsoleParamType,
        message: string,
        options: IHookConsoleParamOptions
    ): void;
}

export interface IDawnInitParamsOptions {
    reportLogs?: (options: any) => void; // 日志上报方法
    root?: IHtmlNode; // 根节点
    globalParams?: any; // 公参

    isDefaultReportEd?: boolean; // 是否默认上报元素结束曝光事件
    isUseHeartbeat?: boolean; // 是否开启心跳，默认关闭

    heartbeatInterval?: number; // 心跳间隔

    onPageShow?: (callback: () => void) => void;
    onPageHide?: (callback: () => void) => void;

    HookConsole?: IHookConsole;
}

export interface IReferOptions {
    sessId?: string;
    type?: string;
    actSeq?: number | string;
    pgStep?: number | string;
    spm?: string;
    scm?: string;
}

export interface IFindKeyNodeParamsOptions {
    eventName: string; // 指定事件名，不传则代表支持所有事件
    objectType: string; // 指定节点类型，page表示页面、element表示元素、不传或其他表示所有
}

interface ILogParams {
    _eventtime: number;
    _sessid: string;
    _duration?: number;
    g_dprefer: string;
    [key: string]: any;
}

export interface ILog {
    event: string;
    useForRefer: boolean;
    _plist: any[];
    _elist: any[];
    _spm?: string;
    _scm?: string;
    params: ILogParams;
}

export interface ICreateAndPushLogParamsOptions {
    publicUseForRefer?: boolean | string[]; // 是否追踪refer
    publicParams?: any; // 埋点额外参数、事件公参
    isForce?: boolean; // 是否强制埋点
    isBatch?: boolean; // 是否在下个时间循环批量打点
    isHeartbeat?: boolean; // 是否心跳埋点
}

export interface ICreateAndPushLogResult extends ILog {
    isPrevent: boolean;
}

export interface ITriggerCustomLoggerParamsOptions {
    event: string; // 自定义埋点事件名
    params?: any; // 自定义埋点公参
    useForRefer?: boolean;
    isForce?: boolean; // 是否强制埋点
}

export interface ITriggerCustomLoggerResult {
    _plist: any[];
    _elist: any[];
    _spm: string;
    _scm: string;
    _sessid: string;
    g_dprefer: string;
    jumprefer: string;
}

export type IHookConsoleParamType = 'log' | 'warn' | 'error';

export type IHookConsoleParamOptions = {
    code: 'init' | 'report' | 'beforeReport' | 'plugin' | 'buildLog' | 'refer' | 'trigger' | 'checkLog'
        | 'dataLog' | 'io' | 'mo' | 'node' | 'dawnNode',
    force?: boolean;
    error?: any; // type 为 error、warn 时必传

    // code init
    initConfig?: any;

    // code report
    reportLogs?: ILog[];
    reportSpm?: string;
    reportLog?: any;
    reportEvent?: string;
    reportUseForRefer?: boolean;

    // code beforeReport
    beforeReportLogs?: ILog[];

    // code plugin
    plugin?: any;
    pluginDependencies?: any;

    // code buildLog
    buildLogPe?: any;
    buildLogOptions?: any;
    buildLogResult?: any;

    // code refer
    refer?: string;

    // code trigger

    // code dataLog
    dataLogType?: 'parse' | 'check';
    dataLogTarget?: any;
    dataLog?: any;

    // code io
    ioObserver?: any;
    ioEntries?: any[];

    // code mo
    moObserver?: any;
    moList?: any[];

    // code node
    nodeType?: 'add' | 'remove' | 'update';
    nodeList?: any[];

    // code dawnNode
    dawnNodeType?: 'add' | 'remove' | 'update';
    dawnNodeList?: any[];

    // code checkLog
    checkLogMessage?: any;
    checkLogAction?: 'connect' | 'basicInfo' | 'log';
};

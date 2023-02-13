const sdkName = 'NE_DAWN';

// SDK在window上挂载的属性名
export const WINDOW_DAWN = sdkName;
// 自定义埋点方法名
export const WINDOW_DAWN_TRIGGER = 'trigger';
// 是否已初始化埋点参数名
export const WINDOW_DAWN_INITIALIZED = 'initialized';
// 是否停止埋点参数名（预留，曙光工具中使用）
export const WINDOW_DAWN_REPORTING_STOPPED = 'reportingStopped';
// 曙光常量
export const WINDOW_DAWN_CONST = 'CONST';
// 曙光工具对象名（预留，曙光工具中使用）
export const WINDOW_DAWN_TOOL = 'Tool';
// 曙光工具对象实例名（预留，曙光工具中使用）
export const WINDOW_DAWN_TOOL_INSTANCE = 'toolInstance';

export const ATTRIBUTE_KEY = 'data-log';

// 记录数据参数名（节点对象上）
export const OBJ_RECORD_KEY = `${sdkName}_RECORD`;
// JSON.parse的埋点参数名（节点对象上）
export const OBJ_PARAMS_KEY = `${sdkName}_PARAMS`;
// 祖先栈参数名（节点对象上）
export const OBJ_ANCESTORS_KEY = `${sdkName}_ANCESTORS`;
export const NODE_ANCESTORS = '__dawnNodeAncestors';
export const NODE_SPM = '__dawnNodeSpm';
export const NODE_GET_SPM = '__dawnNodeGetSpm';
// 子节点队列参数名（节点对象上）
export const OBJ_CHILDREN_KEY = `${sdkName}_CHILDREN`;

export const EVENT_NAME_MAP = {
    pv: '_pv', // 页面开始曝光
    pd: '_pd', // 页面结束曝光
    ev: '_ev', // 元素开始曝光
    ed: '_ed', // 元素结束曝光
    ec: '_ec', // 元素点击
    es: '_es', // 元素滑动
    plv: '_plv', // 开始播放
    pld: '_pld', // 结束播放
};

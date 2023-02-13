export const isObject = data => Object.prototype.toString.call(data) === '[object Object]';
export const isArray = data => Object.prototype.toString.call(data) === '[object Array]';
export const isString = data => typeof data === 'string';
export const isNumber = data => typeof data === 'number';
export const isBoolean = data => typeof data === 'boolean';
export const isFunction = data => typeof data === 'function';

// 合并对象
export const assignObject = (...args: any[]): any => {
    let object = {};

    for (let i = 0; i < args.length; i++) {
        const item = args[i];
        const currentObject = isObject(item) ? item : {};

        object = {
            ...object,
            ...currentObject,
        };
    }

    return object;
};

// 合并数组
export const assignArray = (...args: any[]): any[] => {
    let array = [];

    for (let i = 0; i < args.length; i++) {
        const item = args[i];
        const currentArray = isArray(item) ? item : [];

        array = [...array, ...currentArray];
    }

    return array;
};

// 是否存在window对象
export const isWindow = () => typeof window !== 'undefined' && window;

// 获取window或window上的属性和方法
export const getWindow = (name?: string): any => {
    if (!isWindow()) return null;
    if (name) return window?.[name];

    return window;
};

// 给window上添加属性
export const setWindow = (name: string, value: any): void => {
    if (!(isWindow() && name)) return null;

    if (isObject(window[name]) && isObject(value)) {
        window[name] = { ...window[name], ...value };
    } else {
        window[name] = value;
    }
};

export const isInSearch = (key: string, value?: string): boolean => {
    if (value) {
        const currentValue = getQuery()?.[key];
        const currentValueArr = currentValue?.split?.(',') || [];

        return currentValueArr?.includes?.(value);
    }

    return new RegExp(key, 'i')?.test?.(getWindow('document')?.location?.search || '');
};

// 浏览器日志打印
export const consoleLog = (title: string, ...args): void => {
    if (!isInSearch('console')) return;

    console.log(`[曙光]: ${title}`, ...args);
};

// 浏览器警告日志打印
export const consoleWarn = (title: string, ...args): void => {
    console.warn(`[曙光]: ${title}`, ...args);
};

// 浏览器错误日志打印
export const consoleError = (title: string, ...args): void => {
    if (args?.length === 1 && isString(args?.[0])) {
        console.error(`[曙光]: ${title}`, new Error(args[0]));
    } else {
        console.error(`[曙光]: ${title}`, ...args);
    }
};

// 获取单个DOM对象
export const getElement = (selector: string, node?: any) => {
    if (!selector) return null;

    return (node || getWindow('document'))?.querySelector?.(selector);
};

// 获取多个DOM对象
export const getElements = (selector: string, node?: any) => {
    if (!selector) return null;

    return (node || getWindow('document'))?.querySelectorAll?.(selector) || [];
};

// 获取body节点
export const getBody = () => getElement('body');

// 获取链接参数
export const getQuery = (): any => {
    const searchStr = (getWindow('location')?.search || '').slice(1,);
    const searchArr = searchStr ? searchStr.split('&') : [];
    const searchArrLen = searchArr?.length || 0;
    const query = {};

    if (searchArrLen) {
        for (let i = 0; i < searchArrLen; i++) {
            const item = searchArr[i];
            const itemArr = item.split('=');

            if (itemArr?.[0]) {
                try {
                    query[itemArr[0]] = decodeURIComponent(itemArr?.[1] || '');
                } catch (e) {
                    query[itemArr[0]] = '';
                }
            }
        }
    }

    return query;
};

// 延迟或线程空闲时执行
export const postponeCallback = (callback: () => void, options?: any) => {
    const { isIdle, timeout } = options || {};
    const requestIdleCallbackFunc = getWindow('requestIdleCallback');

    if (isFunction(requestIdleCallbackFunc) && isIdle) {
        requestIdleCallbackFunc?.(() => {
            callback?.();
        }, { timeout: isNumber(timeout) ? timeout : 200 });
        return;
    }

    const timer = setTimeout(() => {
        clearTimeout(timer);
        callback?.();
    }, isNumber(timeout) ? timeout : 0);
};

// 获取指定长度的随机字符串
export const getRandomString = (length: number, isNum?: boolean): string => {
    let text = '';
    const possibleNumber = '0123456789';
    const possibleAll = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const possible = isNum ? possibleNumber : possibleAll;

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
};

export const isObject = (data: any) => Object.prototype.toString.call(data) === '[object Object]';
export const isArray = (data: any) => Object.prototype.toString.call(data) === '[object Array]';
export const isString = (data: any) => typeof data === 'string';
export const isNumber = (data: any) => typeof data === 'number';
export const isBoolean = (data: any) => typeof data === 'boolean';
export const isFunction = (data: any) => typeof data === 'function';

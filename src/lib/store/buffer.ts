import { IHtmlNode } from '../static/types';
import { isFunction } from '../static/helper';

const buffer = new Set([]);
const supportBuffer = buffer?.values?.() && buffer?.add && buffer?.delete;
const array: any[] = [];

/**
 * 给缓冲队列队尾推入一个元素
 * @param $object
 * @param callback
 */
export const pushBuffer = ($object: IHtmlNode, callback?: any): void => {
    if (supportBuffer) {
        buffer.add($object);
    } else {
        array.push($object);
    }

    if (isFunction(callback)) callback();
};

/**
 * 从缓冲队列对头出队一个缓冲元素
 */
export const shiftBuffer = (): Array<IHtmlNode> => {
    if (supportBuffer) {
        const value = buffer.values()?.next?.()?.value;

        buffer.delete(value);

        return value;
    }

    return array.shift();
};

/**
 * 获取缓冲队列长度
 */
export const getBufferSize = () => {
    if (supportBuffer) {
        return buffer.size;
    }

    return array.length;
};

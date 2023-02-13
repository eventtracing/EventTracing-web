import { IHtmlNode, IObject, IObjects } from '../static/types';
import { OBJ_RECORD_KEY } from '../static/const';
import { isObject } from '../static/helper';

const objects: IObjects = {};

/**
 * 添加/更新埋点对象
 * @param $object
 * @param objectInfo
 */
export const setObject = ($object: IHtmlNode, objectInfo?: IObject): void => {
    if (!$object) return;

    const { nodeId } = $object?.[OBJ_RECORD_KEY] || {};

    if (!nodeId) return;

    const oldObjectInfo = objects[nodeId] || {};
    const currentObjectInfo = isObject(objectInfo) ? objectInfo : ($object?.[OBJ_RECORD_KEY] || {});
    const currentObject = { ...oldObjectInfo, ...currentObjectInfo };

    objects[nodeId] = currentObject;
};

export const deleteObject = ($object: IHtmlNode): void => {
    if (!$object) return;

    const { nodeId } = $object?.[OBJ_RECORD_KEY] || {};

    delete objects[nodeId];
};

/**
 * 获取指定的埋点对象
 * @param $object
 */
export const getObject = ($object?: IHtmlNode): IObject => {
    if (!$object) return null;

    const { nodeId } = $object?.[OBJ_RECORD_KEY] || {};

    return objects?.[nodeId] || {};
};

/**
 * 获取指定ID的埋点对象
 * @param nodeId
 */
export const getObjectById = (nodeId?: string): IObject => {
    if (!nodeId) return null;

    return objects?.[nodeId] || {};
};

/**
 * 获取全部埋点对象
 */
export const getObjects = (): IObjects => objects;

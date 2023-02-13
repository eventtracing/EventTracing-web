import { postponeCallback } from './static/helper';
import { triggerHeartbeatLogger } from './core';
import { getConfig } from './config';

const BEGIN_INTERVAL = 2000;
const BEGIN_COUNT = 5;
let heartbeatStatus: boolean = false;
let count = 0;

const heartbeat = (isFirst: boolean = false) => {
    const { heartbeatInterval } = getConfig();

    if (!heartbeatStatus) return;

    if (!isFirst) {
        triggerHeartbeatLogger();
    }

    count++;
    postponeCallback(() => {
        heartbeat();
    }, { isIdle: false, timeout: count > BEGIN_COUNT ? heartbeatInterval : BEGIN_INTERVAL });
};

export const startHeartbeat = () => {
    const { isUseHeartbeat } = getConfig();

    if (!isUseHeartbeat) return;
    if (heartbeatStatus) return;

    heartbeatStatus = true;
    heartbeat(true);
};

export const pauseHeartbeat = () => {
    heartbeatStatus = false;
    triggerHeartbeatLogger();
};
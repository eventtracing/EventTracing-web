import { useState, useMemo, useEffect, useCallback } from 'react';
import EventEmitter from 'eventemitter3';
import EventTracing from '@eventtracing/web';
import styles from './index.less';

const ee = new EventEmitter();
const isInApp = false; // 是否在客户端内，这里只是个例子，具体根据自己客户端对应方法使用

const Index = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        EventTracing.init({
            globalParams: { __test_global_param: 'test' }, // 全局公参，这里只是个例子，具体根据自己需要传参
            // isUseHeartbeat: true, // 心跳 _pd
            onPageShow: (exposeStart: any) => {
                // 模拟客户端进入到前台事件，这里只是个例子，具体根据自己客户端对应方法使用
                ee.on('onPageShow', () => {
                    exposeStart();
                });
            },
            onPageHide: (exposeEnd: any) => {
                // 模拟客户端退出到后台事件，这里只是个例子，具体根据自己客户端对应方法使用
                ee.on('onPageHide', () => {
                    exposeEnd();
                });
            },
            reportLogs: ({ logs }: any) => {
                if (isInApp) {
                    console.log(`[曙光日志上报]:`, '客户端协议', logs);

                    // 客户端日志上报方式，这里只是个简单的例子，具体根据自己客户端对应方法使用
                    try {
                        window.bridge.call('eventTracing', 'reportBatch', { logs }, function (error: any, result: any, context: any) {
                            console.log('Call eventTracing reportBatch', error, result, context);
                        });
                    } catch (error) {
                        console.error(`[曙光]:`, '客户端协议出错，请检查是否在客户端内、客户端是否已接入曙光 SDK', error);
                    }
                } else {
                    console.log(`[曙光日志上报]:`, '网络请求', logs);

                    // 浏览器端日志上报方式，通过发送网络请求上报
                    // fetch...
                }
            },
        });
    }, []);

    const getRefers = useCallback(() => {
        if (isInApp) {
            try {
                // 客户端 refers 获取方式，这里只是个简单的例子，具体根据自己客户端对应方法使用
                window.bridge.call('eventTracing', 'refers', { key: 'all' }, function (error: any, result: any, context: any) {
                    console.log('Call eventTracing refers', error, result, context);
                });
            } catch (error) {
                console.error(`[曙光]:`, '客户端协议出错，请检查是否在客户端内、客户端是否已接入曙光 SDK', error);
            }
        } else {
            console.warn(`[曙光]:`, '当前不在客户端内或客户端没有接入曙光 SDK');
        }
    }, []);

    const modalMemo = useMemo(() => {
        if (!visible) return null;

        return (
            <div className={styles.modal}>
                <div
                    className={styles.modalContent}
                    data-log={JSON.stringify({
                        oid: 'page_web_modal',
                        isPage: true,
                        events: ['_pv', '_pd'],
                        mountParentSelector: '#mount-parent-id',
                    })}
                >
                    <div className={styles.modalClose}>
                        <div className={styles.modalTitle}>逻辑挂载</div>
                        <div
                            className={styles.button}
                            data-log={JSON.stringify({
                                oid: 'btn_web_goto',
                                events: ['_ev', '_ec'],
                                params: {
                                    s_position: 1,
                                    s_ctype: 'spm',
                                    s_cid: '100002',
                                },
                            })}
                            onClick={() => setVisible(false)}
                        >关闭</div>
                    </div>
                </div>
            </div>
        );
    }, [visible]);

    return (
        <>
            <div
                id="mount-parent-id"
                className={styles.container}
                data-log={JSON.stringify({
                    oid: 'page_web_home',
                    isPage: true,
                    events: ['_pv', '_pd'],
                })}
            >
                <div
                    className={styles.button}
                    onClick={() => {
                        if (isInApp) {
                            try {
                                // 客户端相关协议有效性判断方式，这里只是个简单的例子，具体根据自己客户端对应方法使用
                                window.bridge.isBridgeAvaiable('eventTracing', 'refers', (avaiable: any, content: any) => {
                                    console.log('JS checkout bridge avaiable', avaiable, content);
                                });
                                window.bridge.isBridgeAvaiable('eventTracing', 'report', (avaiable: any, content: any) => {
                                    console.log('JS checkout bridge avaiable', avaiable, content);
                                });
                                window.bridge.isBridgeAvaiable('eventTracing', 'reportBatch', (avaiable: any, content: any) => {
                                    console.log('JS checkout bridge avaiable', avaiable, content);
                                });
                            } catch (error) {
                                console.error(`[曙光]:`, '客户端协议出错，请检查是否在客户端内、客户端是否已接入曙光 SDK', error);
                            }
                        } else {
                            console.warn(`[曙光]:`, '当前不在客户端内或客户端没有接入曙光 SDK');
                        }
                    }}
                >Check Avaiable</div>

                <div
                    className={styles.button}
                    onClick={() => {
                        ee.emit('onPageShow');
                    }}
                >模拟 APP 进入到前台</div>

                <div
                    className={styles.button}
                    onClick={() => {
                        ee.emit('onPageHide');
                    }}
                >模拟 APP 退出到后台</div>

                <div
                    className={styles.button}
                    onClick={getRefers}
                >获取 Refers</div>

                <div
                    className={styles.button}
                    data-log={JSON.stringify({
                        oid: 'btn_web_goto',
                        events: ['_ev'],
                        params: {
                            s_position: 1,
                            s_ctype: 'spm',
                            s_cid: '100001',
                        },
                    })}
                    onClick={(e) => {
                        window.NE_DAWN.trigger(e.currentTarget, {
                            event: '_ec', // 事件名
                            params: { __test_event_param: 'test' }, // 事件公参
                        });
                    }}
                >手动触发点击事件</div>

                <div
                    className={styles.button}
                    data-log={JSON.stringify({
                        oid: 'btn_web_goto',
                        events: ['_ev', '_ec'],
                        params: {
                            s_position: 2,
                            s_ctype: 'spm',
                            s_cid: '100002',
                        },
                    })}
                    onClick={() => setVisible(true)}
                >弹窗（逻辑挂载）</div>

                <div
                    className={styles.button}
                    data-log={JSON.stringify({
                        oid: 'btn_web_goto',
                        events: ['_ev', '_ec'],
                        params: {
                            s_position: 3,
                            s_ctype: 'spm',
                            s_cid: '100003',
                        },
                        virtualParentNode: {
                            key: 'test_key_1',
                            oid: 'mod_web_virtual_parent',
                            events: ['_ev', '_ed'],
                            params: {
                                s_position: 1,
                            },
                        },
                    })}
                >虚拟父节点1</div>
                <div
                    className={styles.button}
                    data-log={JSON.stringify({
                        oid: 'btn_web_goto',
                        events: ['_ev', '_ec'],
                        params: {
                            s_position: 4,
                            s_ctype: 'spm',
                            s_cid: '100004',
                        },
                        virtualParentNode: {
                            key: 'test_key_1',
                            oid: 'mod_web_virtual_parent',
                            events: ['_ev', '_ed'],
                            params: {
                                s_position: 1,
                            },
                        },
                    })}
                >虚拟父节点2</div>
                <div
                    className={styles.button}
                    data-log={JSON.stringify({
                        oid: 'btn_web_goto',
                        events: ['_ev', '_ec'],
                        params: {
                            s_position: 5,
                            s_ctype: 'spm',
                            s_cid: '100005',
                        },
                        virtualParentNode: {
                            key: 'test_key_2',
                            oid: 'mod_web_virtual_parent',
                            events: ['_ev', '_ed'],
                            params: {
                                s_position: 2,
                            },
                        },
                    })}
                >虚拟父节点3</div>
            </div>

            {modalMemo}
        </>
    );
};

export default Index;

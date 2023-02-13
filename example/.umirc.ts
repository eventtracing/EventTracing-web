import { defineConfig } from 'umi';

export default defineConfig({
    nodeModulesTransform: {
        type: 'none',
    },
    publicPath: '/',
    routes: [
        {
            path: '/',
            component: '@/pages/index',
        },
    ],
    theme: {
        '@primary-color': '#FE5D64',
    },
    alias: {
        '@sdk': '/eventtracing',
    },
    extraPostCSSPlugins: [],
    metas: [
        {
            name: 'format-detection',
            content: 'telephone=no',
        },
    ],
    fastRefresh: {},
});

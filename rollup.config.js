import babel from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import {uglify} from 'rollup-plugin-uglify';
import { visualizer } from 'rollup-plugin-visualizer';
import packageJson from './package.json';
import path from 'path';

const extensions = ['.ts', '.js', '.json'];
const resolve = (...args) => path.resolve(__dirname, ...args);

export default [
    {
        input: resolve('src/index.ts'),
        output: [
            {
                file: `dist/public/js/eventtracing-web-jssdk${packageJson?.version ? '-' + packageJson.version : ''}.js`,
                format: 'umd',
                name: 'eventtracing-web',
            },
        ],
        plugins: [
            nodeResolve({
                extensions,
                jsnext: true,
                main: true,
                browser: true,
            }),
            commonjs(),
            babel({
                babelHelpers: 'bundled',
                exclude: 'node_modules/**',
                extensions,
            }),
            uglify({
                sourcemap: true,
            }),
            // visualizer({ open: true }),
        ],
        external: [''],
    },
];

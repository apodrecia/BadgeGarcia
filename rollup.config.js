import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/DiscordOrbVideoBypass.js',
    format: 'cjs',
    exports: 'auto',
  },
  plugins: [
    json(),
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
    }),
  ],
  external: ['enmity/managers/plugins', 'enmity/metro/common', 'enmity/metro', 'enmity/patcher', 'enmity/components'],
};

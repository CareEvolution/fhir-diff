import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';

export default {
	input: './src/index.ts',
	output: [
		{
			dir: "dist/esm",
			format: "esm",
			exports: "named",
			sourcemap: true,
		},
		{
			file: "dist/cjs/index.cjs",
			format: "cjs",
			exports: "named",
			sourcemap: true,
		},
	],
	plugins: [
		typescript(),
		copy({
			targets: [
				{ src: ['package.json', 'README.md'], dest: ['dist'] }
			]
		})
	]
};
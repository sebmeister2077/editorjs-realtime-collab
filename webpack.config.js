const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')

const baseConfig = {
    entry: './src/index.ts',
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.css'],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
}

module.exports = [
    // ESM build for modern bundlers
    {
        ...baseConfig,
        mode: 'production',
        output: {
            filename: 'index.js',
            path: path.join(__dirname, '/dist'),
            library: {
                type: 'module',
            },
            module: true,
        },
        experiments: {
            outputModule: true,
        },
        optimization: {
            minimize: false,
        },
    },
    // CommonJS build for Node.js
    {
        ...baseConfig,
        mode: 'production',
        output: {
            filename: 'index.cjs',
            path: path.join(__dirname, '/dist'),
            library: {
                name: 'RealtimeCollabPlugin',
                type: 'commonjs2',
                export: 'default',
            },
        },
    },
    // Minified UMD build for browsers
    {
        ...baseConfig,
        mode: 'production',
        output: {
            filename: 'index.min.js',
            path: path.join(__dirname, '/dist'),
            library: {
                name: 'RealtimeCollabPlugin',
                type: 'umd',
                export: 'default',
            },
            globalObject: 'this',
        },
        optimization: {
            minimize: true,
            minimizer: [new TerserPlugin()],
        },
    },
]

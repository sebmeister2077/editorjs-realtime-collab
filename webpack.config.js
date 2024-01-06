const path = require('path')

module.exports = {
    mode: 'development', // Change to 'production' for production build
    entry: './src/index.ts', // Entry file for your TypeScript code
    output: {
        filename: 'bundle.js', // Output bundle file name
        path: path.join(__dirname, '/dist'),
        library: 'IndentPlugin',
        libraryTarget: 'umd',
        libraryExport: 'default',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.css'], // File extensions to resolve
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader', // Use ts-loader for TypeScript files
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
}

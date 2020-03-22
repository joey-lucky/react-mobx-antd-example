'use strict';
const path = require('path');
const fs = require('fs');
const webpack = require("webpack");
const express = require("express");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const {BundleAnalyzerPlugin} = require("webpack-bundle-analyzer");
const CompressionPlugin = require("compression-webpack-plugin");
const TerserJSPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const merge = require("webpack-merge");

const isEnvDevelopment = process.env.NODE_ENV === 'development';
const isEnvProduction = !isEnvDevelopment;

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

const packageJson = require(resolveApp("package.json"));
const {homepage, cdnHost, proxy, resolveAlias} = packageJson;

const utils = {
    getPort(url) {
        return url.replace(/(\S)+\:/g, "").replace(/\/(\S)+/g, "");
    },

    getPath(url) {
        return url.replace(/(\S)+\:(\d)+/g, "");
    },

    getHost(url) {
        return url.replace(this.getPath(url), "");
    },

    getApiProxy(proxy = {}) {
        let result = {};
        Object.keys(proxy).forEach((key) => {
            let value = proxy[key] || "";
            if (value.startsWith("http")) {
                result[key] = {
                    target: value,
                    secure: false,
                    changeOrigin: true,
                };
            }
        });
        return result;
    },

    getStaticProxy(proxy = {}) {
        let result = {};
        Object.keys(proxy).forEach((key) => {
            let value = proxy[key];
            if (!value.startsWith("http")) {
                result[key] = {
                    target: value,
                    secure: false,
                    changeOrigin: true,
                };
            }
        });
        return result;
    },

    getAllowedHosts(proxy = {}) {
        let set = new Set();
        Object.keys(proxy).forEach((key) => {
            let value = proxy[key];
            if (value.startsWith("http")) {
                set.add(value);
            }
        });
        return Array.from(set);
    },

    getResolveAlias(resolveAlias = {}) {
        let result = {};
        for (let key of Object.keys(resolveAlias)) {
            let value = resolveAlias[key];
            result[key] = resolveApp(value)
        }
        return result;
    },
};

const srcPath = resolveApp("src");
const buildPath = resolveApp("build");
let publicPath = !!cdnHost ? cdnHost : utils.getPath(homepage);
const alias = utils.getResolveAlias(resolveAlias);
const devServer = {
    host: utils.getHost(homepage),
    port: utils.getPort(homepage),
    apiProxy: utils.getApiProxy(proxy),
    staticProxy: utils.getStaticProxy(proxy),
    allowedHosts: utils.getAllowedHosts(proxy),
    useLocalIp: utils.getHost(homepage) === "0.0.0.0"
};
publicPath = !!cdnHost ? (cdnHost + publicPath) : publicPath;// 开启cdn

let config = {
    mode: isEnvProduction ? "production" : "development",
    devtool: isEnvProduction ? false : "source-map",
    bail: isEnvProduction,
    context: __dirname,
    target: "web",
    entry: resolveApp("src/index.jsx"),
    resolve: {
        alias: alias,
        modules: [resolveApp("node_modules")],
    },
    output: {
        path: isEnvProduction ? buildPath : undefined,
        pathinfo: isEnvDevelopment,
        filename: isEnvProduction ? 'static/js/[name].[hash].js' : 'static/js/[name].bundle.js',
        chunkFilename: isEnvProduction ? 'static/js/[name].[contenthash].js' : 'static/js/[name].bundle.js',
        publicPath: publicPath
    },
    module: {
        rules: [
            {
                test: /.js(x)?$/,
                include: srcPath,
                loader: "babel-loader",
                options: {
                    presets: ["@babel/preset-env", "@babel/preset-react"],
                    plugins: [
                        ["@babel/plugin-proposal-decorators", {"legacy": true}],
                        ["@babel/plugin-proposal-class-properties"],
                        ["@babel/plugin-transform-runtime"],
                        [require.resolve("babel-plugin-import"),
                            {
                                "libraryName": "antd",
                                "libraryDirectory": "es",
                            }
                        ],
                    ]
                },
            },
            {
                oneOf: [
                    // loader的执行顺序是至上而下，因此这里的顺序不能换
                    {
                        test: /\.module\.(less|css)$/,
                        // include: srcPath,
                        use: [
                            {
                                loader: MiniCssExtractPlugin.loader,
                                // options: {
                                //     hmr: isEnvDevelopment
                                // },
                            },
                            {loader: "css-loader", options:{modules: true}},
                            {loader: "less-loader", options: {javascriptEnabled: true}},
                        ],
                    },
                    {
                        test: /\.(less|css)$/,
                        // include: srcPath,
                        use: [
                            {
                                loader: MiniCssExtractPlugin.loader,
                                options: {
                                    hmr: isEnvDevelopment
                                },
                            },
                            {loader: "css-loader"},
                            {loader: "less-loader", options: {javascriptEnabled: true}},
                        ],
                    },
                ]
            },
            {
                test: /.(jpe?g|png|gif|svg)$/,
                include: srcPath,
                use: {
                    loader: "file-loader",
                    options: {
                        name: 'static/media/[name].[hash].[ext]'
                    }
                }
            },
        ]
    },
    optimization: {
        minimize: isEnvProduction,
        namedModules: isEnvDevelopment,
    },
    performance: false,
    plugins: [
        isEnvProduction && new CleanWebpackPlugin(),
        isEnvProduction && new BundleAnalyzerPlugin(),
        isEnvDevelopment && new webpack.HotModuleReplacementPlugin(),
        new MiniCssExtractPlugin({ // contenthash 支持持久缓存
            chunkFilename: isEnvDevelopment ? "static/css/[name].[id].css" : "static/css/[name].[id].[contenthash].css",
            filename: isEnvDevelopment ? "static/css/[name].[id].css" : "static/css/[name].[id].[contenthash].css",
        }),
        new HtmlWebpackPlugin(Object.assign(
            {
                PUBLIC_PATH: publicPath,
                inject: true,
                filename: "index.html",
                template: resolveApp("public/index.html"),
            },
            isEnvProduction && {
                minify: {
                    removeComments: true,
                    collapseWhitespace: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true,
                    removeEmptyAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    keepClosingSlash: true,
                    minifyJS: true,
                    minifyCSS: true,
                    minifyURLs: true,
                },
            }
        )),
        isEnvProduction && new CompressionPlugin(),
    ].filter(Boolean),
    watchOptions: {
        ignored: /node_modules/
    }
};

if (isEnvDevelopment) {
    config = merge(config, {
        devServer: {
            host: "0.0.0.0",
            port: devServer.port,
            publicPath: publicPath,
            hot: true,
            contentBase: buildPath,
            historyApiFallback: {
                verbose: true,
                rewrites: [
                    {
                        from: new RegExp("^" + publicPath),
                        to: publicPath + "index.html"
                    },
                ]
            },
            disableHostCheck: true,
            open: true,
            openPage: publicPath.substr(1),
            allowedHosts: devServer.allowedHosts,
            before(app) {
                Object.keys(devServer.staticProxy).forEach(key => {
                    app.use(key, express.static(devServer.staticProxy[key]));
                })
            },
            proxy: devServer.apiProxy,
            useLocalIp: true,
            index: "/index.html",
        }
    });
} else {
    config = merge(config, {
        optimization: {
            // CSS压缩需要用到OptimizeCSSAssetsPlugin，被迫替换minimizer成TerserJSPlugin，
            minimizer: [
                new TerserJSPlugin({
                    extractComments: false,
                    sourceMap: false,
                }),
                new OptimizeCSSAssetsPlugin({})
            ],
            splitChunks: {
                chunks: 'all',
                maxSize: 250000,
                cacheGroups: {
                    react: {
                        test: /[\\/]node_modules[\\/]react/,
                        name: 'react',
                        chunks: 'all',
                        enforce: true
                    },
                    mobx: {
                        test: /[\\/]node_modules[\\/]mobx/,
                        name: 'mobx',
                        chunks: 'all',
                        enforce: true
                    },
                    ant: {
                        test: /[\\/]node_modules[\\/]@?ant/,
                        name: 'ant',
                        chunks: 'all',
                        enforce: true
                    },
                    src: {
                        test: /[\\/]src[\\/]/,
                        name: 'src',
                        chunks: 'all',
                        enforce: true
                    }
                }
            },
        },
    });
}

module.exports = config;
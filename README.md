# react-mobx-antd-example
The example for quickly build react web project.

# Getting Started 
```
git clone https://github.com/joey-lucky/react-mobx-antd-example.git
yarn install
yarn start
```

# Configuration

```
// package.json configuration
{
    "homepage": "http://localhost:8080/open/admin",
    "cdnHost": "http://cdn.hjoey.com",
    "resolveAlias": {
        "@components": "src/components",
    },
    "proxy": {
        "/open/api": "http://localhost:3000",
        "/open/file": "D:/file"
    }
}
```

* homepage 必填，首页地址。
* proxy，可选，代理配置，支持http和文件路径格式。
* resolveAlias,可选，别名配置。
* cdnHost,可选，cdn配置

# 黑科技

- Less/Css 兼容局部引入和全局引入
    - 局部写法 import * as styles from "./index.css"
    - 全局写法 import "./index.module.css"
- Css/Js 压缩技术
- Compress，Gzip压缩，优化加速。
- SplitChunk,分包技术，解决长效缓存问题。
- cdn支持

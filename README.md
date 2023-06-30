# thindb

基于 Nodejs 的通用数据库访问和操作组件，如 mysql、redis 等

# Install

```console
npm install thindb
```

# Usage

实例化引用

```console
const Thindb = require("thindb");
const thindb = new Thindb([...config]);

```

## mysql

```console
let ddd=thindb.mysql.ddd();
ddd.exePromise({sp:"",token:"",data:""});
或者
global.ddd_mysql.exePromise({sp:"",token:"",data:""});

```

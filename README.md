# thindb

基于 Nodejs 的通用数据库访问和操作组件，如 mysql、redis 等

# Install

```console
npm install thindb
```

# Usage

实例化

```console
const Thindb = require("thindb");
const thindb = new Thindb([...config]);

```

## mysql

### 单数据库引用

```console
let ddd=thindb.mysql.ddd();
ddd.execPromise({sp:"",token:"",data:""});
```

### 多数据库引用

```console
let ddd=thindb.mysql.ddd();
ddd.execPromise({sp:"",token:"",data:""});

let ddd2=thindb.mysql.ddd("[poolName2]");
ddd2.execPromise({sp:"",token:"",data:""});

// 注：一般来说poolName值等于配置文件里面的database值
```

### global 变量引用

```console
// 当有多个数据库时候，该方式会选择配置里第一顺位数据库连接
global.ddd_mysql.exePromise({sp:"",token:"",data:""});
```

### 配置文件样例

```json
{
	"dbconfig": [
		{
			"mysql": {
				"host": "[host]",
				"port": "[port]",
				"database": "[database]",
				"user": "[user]",
				"password": "[password]"
			}
		},
		{
			"mysql": {
				"host": "[host2]",
				"port": "[port2]",
				"database": "[database2]",
				"user": "[user2]",
				"password": "[password2]"
			}
		}
	]
}
```

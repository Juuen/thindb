const db_mysql = require("mysql2");

class thindb {
	/**
	 * 数据库链接配置
	 * @param {Array} connections 数据库连接配置列表
	 */
	constructor(connections) {
		this.connections = connections || [];
	}

	// mysql
	mysql = {
		DEFAULT_CONFIGS: { multipleStatements: true },
		DEFAULT_CMD: "select ? into @jdata;call ??(?,@jdata);select @jdata as jdata;",
		connect: () => {
			if (!global.ddd_mysql_pool) global.ddd_mysql_pool = {};
			let mysqlConfigs = this.__getDbConfig(this.dbTypes.mysql);
			mysqlConfigs?.forEach((cfg) => {
				let connName = cfg.database;
				if (!global.ddd_mysql_pool[connName]) global.ddd_mysql_pool[connName] = db_mysql.createPool({ ...this.mysql.DEFAULT_CONFIGS, ...cfg });
			});
		},
		ddd: (poolName) => {
			!global.ddd_mysql_pool && this.mysql.connect();
			poolName ||= Object.getOwnPropertyNames(global.ddd_mysql_pool)[0];
			let pool = global.ddd_mysql_pool[poolName];
			let ddd_mysql = {
				exePromise: (p, dddMode = true) => {
					return new Promise((resolve, reject) => {
						let cmd = dddMode ? this.mysql.DEFAULT_CMD : p.sp,
							data = dddMode ? [JSON.stringify(p.data), p.sp, JSON.stringify(p.token)] : p.data;
						pool.query(cmd, data, (err, rows, fields) => {
							if (err) reject({ err_code: err.errno, err_message: err.sqlMessage });
							else {
								if (dddMode) {
									let res = rows.pop();
									resolve(res[0]?.jdata || {});
								} else {
									resolve(rows);
								}
							}
						});
					});
				}
			};
			global.ddd_mysql ??= ddd_mysql;
			return ddd_mysql;
		}
	};

	// redis
	redis() {}

	// 获取数据连接配置
	__getDbConfig(dbType) {
		let dbConfig = [];
		Array.isArray(this.connections) &&
			this.connections.forEach((conn) => {
				let _dbType = Object.keys(conn)[0]?.toLowerCase();
				_dbType === dbType && dbConfig.push(conn[_dbType]);
			});
		return dbConfig;
	}

	// 数据库类型（枚举对象）
	dbTypes = {
		mysql: "mysql",
		redis: "redis"
	};
}

module.exports = thindb;

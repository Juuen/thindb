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
		DEFAULT_CONFIGS: { multipleStatements: true, connectionLimit: 10 },
		DEFAULT_CMD: "select ? into @jdata;call ??(?,@jdata);select @jdata as jdata;",
		/**
		 * 建立数据访问连接池
		 */
		connect: () => {
			if (!global.ddd_mysql_pool) global.ddd_mysql_pool = {};
			let mysqlConfigs = this.__getDbConfig(this.dbTypes.mysql);
			mysqlConfigs?.forEach((cfg) => {
				let connName = cfg.database;
				if (!global.ddd_mysql_pool[connName]) global.ddd_mysql_pool[connName] = db_mysql.createPool({ ...this.mysql.DEFAULT_CONFIGS, ...cfg });
			});
		},
		/**
		 * DDD数据访问对象
		 *
		 * @param {String} poolName 具体访问数据库连接池名称
		 * @param {Object} options 自定义配置项
		 * @returns
		 */
		ddd: (poolName, options = {}) => {
			!global.ddd_mysql_pool && this.mysql.connect();
			poolName ||= Object.getOwnPropertyNames(global.ddd_mysql_pool)[0];
			let pool = global.ddd_mysql_pool[poolName];
			let ddd_mysql = {
				exePromise: (p, dddMode) => {
					return new Promise((resolve, reject) => {
						let _dddMode = dddMode ?? options.dddMode ?? true,
							cmd = _dddMode ? this.mysql.DEFAULT_CMD : p.sp,
							data = _dddMode ? [JSON.stringify(p.data), p.sp, JSON.stringify(p.token)] : p.data;

						if (pool)
							pool.query(cmd, data, (err, rows, fields) => {
								if (err) reject({ err_code: err.errno, err_message: err.sqlMessage });
								else if (_dddMode) {
									let res = rows.pop();
									resolve(res[0]?.jdata || {});
								} else {
									resolve(rows);
								}
							});
						else reject({ err_code: 999, err_message: "未匹配到数据库连接配置,请检查配置文件！" });
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
		let dbConfig =
			Array.isArray(this.connections) &&
			this.connections.reduce((accumulator, item) => {
				let conn = item[dbType];
				conn && accumulator.push(conn);
				return accumulator;
			}, []);

		return dbConfig;
	}

	// 数据库类型（枚举对象）
	dbTypes = {
		mysql: "mysql",
		redis: "redis"
	};
}

module.exports = thindb;

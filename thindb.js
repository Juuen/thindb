const db_mysql = require("mysql2");
const db_redis = require("redis");

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
			if (!global.ddd_mysql_pool) {
				global.ddd_mysql_pool = {};
				let mysqlConfigs = this.__getDbConfig(this.dbTypes.mysql);
				mysqlConfigs?.forEach((cfg) => {
					let connName = cfg.database;
					if (!global.ddd_mysql_pool[connName]) global.ddd_mysql_pool[connName] = db_mysql.createPool({ ...this.mysql.DEFAULT_CONFIGS, ...cfg });
				});
			}
		},
		/**
		 * DDD数据访问对象
		 *
		 * @param {String} poolName 具体访问数据库连接池名称
		 * @param {Object} options 自定义配置项
		 * @returns
		 */
		ddd: (poolName, options = {}) => {
			this.mysql.connect();
			poolName ||= Object.getOwnPropertyNames(global.ddd_mysql_pool)[0];
			let pool = global.ddd_mysql_pool[poolName];
			let ddd_mysql = {
				execPromise: (p, dddMode) => {
					return new Promise((resolve, reject) => {
						let _dddMode = dddMode ?? options.dddMode ?? true,
							cmd = _dddMode ? this.mysql.DEFAULT_CMD : p.sp,
							data = _dddMode ? [JSON.stringify(p.data), p.sp, JSON.stringify(p.token)] : p.data;

						if (pool)
							pool.query(cmd, data, (err, rows, fields) => {
								if (err) reject({ err_code: err.errno, err_message: err.sqlMessage });
								else {
									let result = rows;
									try {
										if (_dddMode) {
											result = rows.pop();
											result = JSON.parse(result[0]?.jdata || {});
										}
										resolve(result);
									} catch (e) {
										console.error("[JSON PARSE]: ", e.message, " \r\n[MYSQL RESULT]: ", result);
										reject({ err_code: 500, err_message: e.message });
									}
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
	redis = {
		/**
		 * 建立数据访问连接
		 */
		connect: () => {
			if (!global.ddd_redis) {
				global.ddd_redis = {};
				let redisConfigs = this.__getDbConfig(this.dbTypes.redis);
				redisConfigs?.forEach((cfg) => {
					let connName = cfg.host;
					if (!global.ddd_redis[connName]) {
						global.ddd_redis[connName] = db_redis.createClient(cfg);
						global.ddd_redis[connName].on("error", (err) => console.log("Redis Client Error", err));
						global.ddd_redis[connName].on("connect", () => console.log("Redis Connected!"));
					}
				});
			}
		},
		set: (key, value, connName) => {
			return new Promise(async (resolve, reject) => {
				try {
					this.redis.connect();
					connName ||= Object.getOwnPropertyNames(global.ddd_redis)[0];
					await global.ddd_redis[connName].connect();
					await global.ddd_redis[connName].set(key, value);
					await global.ddd_redis[connName].disconnect();
					resolve();
				} catch (err) {
					reject(err);
				}
			});
		},
		get: (key, connName) => {
			return new Promise(async (resolve, reject) => {
				try {
					this.redis.connect();
					let value;
					connName ||= Object.getOwnPropertyNames(global.ddd_redis)[0];
					await global.ddd_redis[connName].connect();
					value = await global.ddd_redis[connName].get(key);
					await global.ddd_redis[connName].disconnect();
					resolve(value);
				} catch (err) {
					reject(err);
				}
			});
		},
		del: (key, connName) => {
			return new Promise(async (resolve, reject) => {
				try {
					this.redis.connect();
					let value;
					connName ||= Object.getOwnPropertyNames(global.ddd_redis)[0];
					await global.ddd_redis[connName].connect();
					value = await global.ddd_redis[connName].del(key);
					await global.ddd_redis[connName].disconnect();
					resolve(value);
				} catch (err) {
					reject(err);
				}
			});
		}
	};

	// 获取数据连接配置
	__getDbConfig(dbType) {
		let dbConfig = [];
		dbConfig =
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

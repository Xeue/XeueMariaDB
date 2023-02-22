const mariadb = require('mariadb');

class SQLSession {
	constructor(host, port, user, password, database, logger) {
		this.logger = logger;
		this.host = host;
		this.port = port;
		this.user = user;
		this.password = password;
		this.database = database;
		try {
			this.pool = mariadb.createPool({
				host: host,
				user: user,
				port: port,
				password: password,
				connectionLimit: 5
			});
		} catch (error) {
			this.logger.error('Could not make connection to SQL server', error);
		}
	}

	async init(tables) {
		this.logger.log('Initialising SQL database', 'S');
		try {
			await this.query(`CREATE DATABASE IF NOT EXISTS ${this.database};`);
			this.pool = mariadb.createPool({
				host: this.host,
				user: this.user,
				port: this.port,
				password: this.password,
				database: this.database,
				connectionLimit: 5
			});
		} catch (error) {
			this.logger.log(`Could not check for or create the required database: ${this.database}`, 'E');
		}
		try {
			for (let index = 0; index < tables.length; index++) {
				const table = tables[index];
				await this.tableCheck(table.name, table.definition, table.PK);
			}
		} catch (error) {
			this.logger.log('Could not check for or create the required tables', 'E');
		}
		this.logger.log('Tables initialised', 'S');
	}

	async tableCheck(table, tableDef, pk) {
		try {
			const rows = await this.query(`SELECT count(*) as count
				FROM information_schema.TABLES
				WHERE (TABLE_SCHEMA = '${this.database}') AND (TABLE_NAME = '${table}')
			`);
			if (rows[0].count == 0) {
				this.logger.log(`Table: ${table} is being created`, 'S');
				await this.query(tableDef);
				await this.query(`ALTER TABLE \`${table}\` ADD PRIMARY KEY (\`${pk}\`);`)
				await this.query(`ALTER TABLE \`${table}\` MODIFY \`${pk}\` int(11) NOT NULL AUTO_INCREMENT;`);
			}
		} catch (error) {
			this.logger.error('SQL Error', error);
		}
	}

	async query(query) {
		try {
			const conn = await this.pool.getConnection();
			const rows = await conn.query(query);
			conn.end();
			return rows;
		} catch (error) {
			this.logger.error('SQL Error', error);
		}
	}

	async insert(_values, table) { // { affectedRows: 1, insertId: 1, warningStatus: 0 }
		try {
			const convertedValues = Object.values(_values).map(value => typeof value === 'string' ? `'${value}'` : value)
			const query = `INSERT INTO ${table}(${Object.keys(_values).join(',')}) values (${convertedValues.join(',')})`;
			const result = await this.query(query);
			return result;
		} catch (error) {
			this.logger.error('SQL Error', error);
		}
	}

	async get(_conditions, table) {
		try {
			let where = '';
			if (_conditions === '') _conditions = undefined;
			switch (typeof _conditions) {
			case 'undefined':
				where = '';
				break;
			case 'string':
				where = 'WHERE '+_conditions;
				break;
			case 'object':
				if (!Array.isArray(_conditions)) {	
					let whereArr = [];
					for (const key in _conditions) {
						if (Object.hasOwnProperty.call(_conditions, key)) {
							whereArr.push(`\`${key}\` = '${_conditions[key]}'`)
						}
					}
					_conditions = whereArr;
				}
				where = 'WHERE '+_conditions.join(' and ');
				break;
			}
			const query = `SELECT * FROM ${table} ${where}`;
			const result = await this.query(query);
			return result;
		} catch (error) {
			this.logger.error('SQL Error', error);
		}
	}

	async getN(_conditions, sortColumn, limit, table) {
		try {
			let where = '';
			if (_conditions === '') _conditions = undefined;
			switch (typeof _conditions) {
			case 'undefined':
				where = '';
				break;
			case 'string':
				where = 'WHERE '+_conditions;
				break;
			case 'object':
				if (!Array.isArray(_conditions)) {	
					let whereArr = [];
					for (const key in _conditions) {
						if (Object.hasOwnProperty.call(_conditions, key)) {
							whereArr.push(`\`${key}\` = '${_conditions[key]}'`)
						}
					}
					_conditions = whereArr;
				}
				where = 'WHERE '+_conditions.join(' and ');
				break;
			}
			const query = `SELECT * FROM ${table} ${where} ORDER BY ${sortColumn} DESC LIMIT ${limit}`;
			return await this.query(query);
		} catch (error) {
			this.logger.error('SQL Error', error);
		}
	}

	async getLast(_conditions, sortColumn, table) {
		const [result] = await getN(_conditions, sortColumn, 1, table);
		return result;
	}

	async update(_values, _conditions, table) {
		try {
			let where = '';
			switch (typeof _conditions) {
			case 'undefined':
				where = '';
				break;
			case 'string':
				where = 'WHERE '+_conditions;
				break;
			case 'object':
				if (!Array.isArray(_conditions)) {	
					let whereArr = [];
					for (const key in _conditions) {
						if (Object.hasOwnProperty.call(_conditions, key)) {
							whereArr.push(`\`${key}\` = '${_conditions[key]}'`)
						}
					}
					_conditions = whereArr;
				}
				where = 'WHERE '+_conditions.join(' and ');
				break;
			default:
				break;
			}
			const values = Object.keys(_values).map(key => `\`${key}\` = ${_values[key]}`).join(',');
			const query = `UPDATE ${table} SET ${values} ${where}`;
			const result = await this.query(query);
			return result;
		} catch (error) {
			this.logger.error('SQL Error', error);
		}
	}

	async updateTime(timeColumn, _conditions, table) {
		try {
			let where = '';
			switch (typeof _conditions) {
			case 'undefined':
				where = '';
				break;
			case 'string':
				where = 'WHERE '+_conditions;
				break;
			case 'object':
				if (!Array.isArray(_conditions)) {	
					let whereArr = [];
					for (const key in _conditions) {
						if (Object.hasOwnProperty.call(_conditions, key)) {
							whereArr.push(`\`${key}\` = '${_conditions[key]}'`)
						}
					}
					_conditions = whereArr;
				}
				where = 'WHERE '+_conditions.join(' and ');
				break;
			default:
				break;
			}
			const query = `UPDATE ${table} SET \`${timeColumn}\` = NOW() ${where}`;
			const result = await this.query(query);
			return result;
		} catch (error) {
			this.logger.error('SQL Error', error);
		}
	}
}

module.exports.SQLSession = SQLSession;
const mysql = require("mysql2/promise");

class MySQLDatabase {
    constructor(config, log) {
        this.config = config;
        this.log = log;
        this.pool = this.createPool();
    }

    createPool() {
        return mysql.createPool({
            host: this.config.host,
            user: this.config.user,
            password: this.config.password,
            database: this.config.database,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }

    async query(sql, params = []) {
        try {
            const [rows] = await this.pool.execute(sql, params);
            return rows;
        } catch (error) {
            this.log.error(`❌ Erreur MySQL : ${error.message}`);
            throw error;
        }
    }

    async insert(table, data) {
        const keys = Object.keys(data).join(", ");
        const values = Object.values(data);
        const placeholders = values.map(() => "?").join(", ");
        const sql = `INSERT INTO ${table} (${keys}) VALUES (${placeholders})`;
        return this.query(sql, values);
    }

    async select(table, conditions = {}) {
        let sql = `SELECT * FROM ${table}`;
        let params = [];

        if (Object.keys(conditions).length) {
            sql += " WHERE " + Object.keys(conditions).map(key => `${key} = ?`).join(" AND ");
            params = Object.values(conditions);
        }

        return this.query(sql, params);
    }
}

module.exports = { MySQLDatabase };

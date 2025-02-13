const Database = require("./DataBase");
const config = require("../../config/main.json");

let instance = null;

class DatabaseManagerSingleton {
    constructor() {
        if (!instance) {
            instance = new Database(config.database);
        }
        return instance;
    }
}

module.exports = new DatabaseManagerSingleton();
const { JsonDatabase } = require("wio.db");

const dbDefault = new JsonDatabase({ databasePath: "./src/databases/dbDefault.json" });

module.exports.dbDefault = dbDefault;

const mysql = require('promise-mysql');
require('dotenv').config();

/**
 * Configuración del pool de conexiones para la base de datos
 */
var connectionPool = null;

async function getConnection(){
  return await connectionPool.getConnection();
}


async function createConnectionPool() {
  if (!connectionPool){
    connectionPool = await mysql.createPool({
      maxConnections: 50,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DATABASE,
      charset: 'utf8mb4',
      timeout: 60000,
      ssl: {
        rejectUnauthorized: false
      },
      typeCast: function castField(field, useDefaultTypeCasting) {
        if ((field.type === "BIT") && (field.length === 1)) {
          var bytes = field.buffer();
          if (bytes !== null) {
            return (bytes[0] === 1);
          }
          return bytes;
        }
        return (useDefaultTypeCasting());
      }
    })
  }
}

module.exports = {createConnectionPool, getConnection};
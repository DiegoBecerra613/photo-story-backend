const {getConnection} = require('../config/db');
const { hashPassword, checkPassword } = require('../utilities/encrypt');
require('dotenv').config();
const secretKey = process.env.API_KEY
const jwt = require('jsonwebtoken');

async function createUser(params) {
  try {
    const connection = await getConnection();
    await connection.beginTransaction();

    // Validación para asegurar que al menos uno de los campos esté presente
    if (!params.email && !params.phoneNumber) {
      throw new Error('Debe proporcionar un correo electrónico o un número de teléfono');
    }

    const hashedPassword = await hashPassword(params.password);
    const query = `INSERT INTO users (name, lastName, email, phoneNumber, password) VALUES (?, ?, ?, ?, ?);`;
    let results;

    try {
      results = await connection.query(query, [
        params.name,
        params.lastName,
        params.email || null,
        params.phoneNumber || null,
        hashedPassword
      ]);
    } catch (err) {
      await connection.rollback();
      await connection.release();
      throw err;
    }

    await connection.commit();
    await connection.release();
    return { success: true, data: results };
  } catch (error) {
    return { success: false, error: `${error}` };
  }
}

async function login(request) {
  try {
    const connection = await getConnection();
    let query;
    let identifier = request.identifier; // Cambio a `identifier` para aceptar email o teléfono

    // Determina si el `identifier` es un correo electrónico o un teléfono
    if (identifier.includes('@')) {
      query = `SELECT id, name, lastName, password FROM users WHERE email = ? COLLATE utf8mb4_0900_as_cs;`;
    } else {
      query = `SELECT id, name, lastName, password FROM users WHERE phoneNumber = ? COLLATE utf8mb4_0900_as_cs;`;
    }

    let results;
    try {
      results = await connection.query(query, [identifier]);
    } catch (err) {
      await connection.release();
      throw err;
    }

    if (!results[0]) {
      await connection.release();
      throw new Error('USER NOT FOUND');
    }

    const hashedPassword = results[0].password;
    const isMatch = await checkPassword(request.password, hashedPassword);
    if (!isMatch) {
      await connection.release();
      throw new Error('WRONG PASSWORD');
    }

    const userToken = { id: results[0].id, username: identifier };
    const token = jwt.sign(userToken, secretKey);
    const response = {
      token: `Bearer ${token}`,
      name: results[0].name,
      lastName: results[0].lastName
    };

    await connection.release();
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: `${error}` };
  }
}



/**
 * 
 * @param {{name: string, lastName: string}} request 
 * @param {number} userId 
 */
async function changePersonalInfo(request, userId){
  try {
    const connection = await getConnection();
    await connection.beginTransaction();
    const query = 'update users set name = ?, lastName = ? where id = ?';
    let results;
    try {
      results = await connection.query(query, [request.name, request.lastName, userId]);
    } catch (error) {
      await connection.rollback();
      await connection.release();
      throw error;
    }

    await connection.commit();
    await connection.release();
    return {success: true, data: results};
  } catch (error) {
    return {success: false, error: error};
  }
}


/**
 * 
 * @param {{oldPassword: string, newPassword: string}} passwords
 * @param {number} userId 
 */
async function changePassword(passwords, userId){
  try {
    const connection = await getConnection();
    const userQuery = 'select password from users where id = ?;';
    const userResults = await connection.query(userQuery, [userId]);

    const storedPassword = userResults[0].password;
    const isMatch = await checkPassword(passwords.oldPassword, storedPassword);
    if (!isMatch){
      await connection.release();
      throw new Error('Contraseña equivocada');
    }

    const updatePasswordQuery = 'update users set password = ? where id = ?;';
    const hashedPassword = await hashPassword(passwords.newPassword);
    const updateResults = await connection.query(updatePasswordQuery, [hashedPassword, userId]);

    await connection.commit();
    await connection.release();
    return {success: true, data: updateResults};
  } catch (error) {
    console.log(error);
    return {success: false, error: `${error}`};
  }
}


module.exports = { createUser, login, changePassword, changePersonalInfo};
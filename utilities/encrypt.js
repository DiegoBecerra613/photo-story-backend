const bcrypt = require('bcrypt');
const saltRounds = 12;

const hashPassword = async (plainPassword) => {
	try {
		const salt = await bcrypt.genSalt(saltRounds);
		const hashedPassword = await bcrypt.hash(plainPassword, salt);
		return hashedPassword;
	} catch (error) {
		throw error;
	}
};

/**
 * Función que retorna el chequeo de las contraseñas
 * @param {string} plainPassword Contraseña en texto plano
 * @param {string} hashedPassword Contraseña cifrada
 * @returns Retorna una promesa que será validada en la lógica del login
 */
const checkPassword = async (plainPassword, hashedPassword) => {
	try {
		const match = await bcrypt.compare(plainPassword, hashedPassword);
		return match;
	} catch (error) {
		throw error;
	}
};



module.exports = {
	hashPassword,
	checkPassword,
}
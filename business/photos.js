const {getConnection} = require('../config/db');
const fs = require('fs');
const path = require('path');


async function getPhotos(userId) {
  const connection = await getConnection();
  try {
    const query = `
      SELECT
        p.id,
        p.route,
        p.title,
        p.description,
        p.userId,
        u.name AS userName,
        u.lastName AS userLastName,
        u.profilePhotoPath,
        (SELECT COUNT(*) FROM likes l WHERE l.photoId = p.id) AS likesCount,
        (SELECT COUNT(*) > 0 FROM likes l WHERE l.photoId = p.id AND l.userId = ?) AS likedByUser
      FROM photos p
      LEFT JOIN users u ON p.userId = u.id
      ORDER BY p.id DESC;
    `;
    const results = await connection.query(query, [userId]);
    await connection.release();
    return { success: true, data: results };
  } catch (error) {
    await connection.release();
    console.error("Error fetching photos:", error);
    return { success: false, error: `${error}` };
  }
}


async function toggleLike(userId, photoId, like) {
  const connection = await getConnection();
  try {
    if (like) {
      const query = `INSERT INTO likes (userId, photoId) VALUES (?, ?) ON DUPLICATE KEY UPDATE createdAt = NOW()`;
      await connection.query(query, [userId, photoId]);
    } else {
      const query = `DELETE FROM likes WHERE userId = ? AND photoId = ?`;
      await connection.query(query, [userId, photoId]);
    }
    await connection.release();
    return { success: true };
  } catch (error) {
    await connection.release();
    return { success: false, error: `${error}` };
  }
}

async function savePhotos(data){
  const connection = await getConnection();
  try {
    const query = `INSERT INTO photos (name, route, title, description, userId) VALUES (?, ?, ?, ?, ?)`;
    const results = await connection.query(query, [data.name, data.route, data.title, data.description, data.userId]);
    await connection.release();
    return { success: true, data: results };
  } catch (error) {
    await connection.release();
    return { success: false, error: `${error}` };
  }
}

/**
 *
 * @param {number} userId
 */
async function savePhotoPerfil(data, userId) {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const query = `UPDATE users SET profilePhotoPath = ? WHERE id = ?`;
    const results = await connection.query(query, [data.profilePhotoPath, userId]);

    await connection.commit();
    await connection.release();
    return { success: true, data: results };
  } catch (error) {
    if (connection) await connection.rollback(); 
    await connection.release()
    return { success: false, error: `${error}` };
  }
}

/**
 * Obtiene todas las fotos subidas por un usuario específico.
 * @param {number} userId
 */
async function getUserPhotos(userId) {
  const connection = await getConnection();
  try {
    const query = `
      SELECT
        p.id,
        p.route,
        p.title,
        p.description,
        p.userId,
        u.name AS userName,
        u.lastName AS userLastName,
        u.profilePhotoPath,
        (SELECT COUNT(*) FROM likes l WHERE l.photoId = p.id) AS likesCount,
        (SELECT COUNT(*) > 0 FROM likes l WHERE l.photoId = p.id AND l.userId = ?) AS likedByUser
      FROM photos p
      LEFT JOIN users u ON p.userId = u.id
      WHERE p.userId = ?
      ORDER BY p.id DESC
    `;

    const results = await connection.query(query, [userId, userId]);
    await connection.release();
    return { success: true, data: results };
  } catch (error) {
    console.error("Error fetching user's photos:", error);
    await connection.release();
    return { success: false, error: `${error}` };
  }
}
async function deletePhoto(photoId, userId) {
  let connection;
  connection = await getConnection();
  try {
    console.log("Attempting to delete photo with ID:", photoId, "for user ID:", userId);

    await connection.beginTransaction();

    const [rows] = await connection.query(
        'SELECT route FROM photos WHERE id = ? AND userId = ?',
        [photoId, userId]
    );

    console.log("Query result:", rows);

    const photoData = Array.isArray(rows) ? rows[0] : rows; // Manejo flexible
    if (!photoData || !photoData.route) {
      throw new Error('Photo not found or user not authorized.');
    }

    const photoPath = `public/${photoData.route}`;
    console.log("Photo path to delete:", photoPath);

    await connection.query('DELETE FROM likes WHERE photoId = ?', [photoId]);

    await connection.query('DELETE FROM photos WHERE id = ?', [photoId]);

    await connection.commit();

    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
      console.log(`File deleted: ${photoPath}`);
    } else {
      console.warn(`File not found: ${photoPath}`);
    }
    if (connection) await connection.release();
    return { success: true };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error deleting photo:', error.message);
    return { success: false, error: error.message };
  } 
}

async function getUserProfile(userId, loggedUserId) {
  const connection = await getConnection();
  try {
    const user = await connection.query('SELECT id, name, lastName, profilePhotoPath FROM users WHERE id = ?', [userId]);
    const photos = await connection.query(
      `SELECT
          p.id,
          p.route,
          p.title,
          p.description,
          (SELECT COUNT(*) FROM likes l WHERE l.photoId = p.id) AS likesCount,
          (SELECT COUNT(*) > 0 FROM likes l WHERE l.photoId = p.id AND l.userId = ?) AS likedByUser
       FROM photos p
       WHERE p.userId = ?
       ORDER BY p.id DESC`,
      [loggedUserId, userId]
    );
    if (!user.length) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    await connection.release();
    return { success: true, user: user[0], photos };
  } catch (error) {
      console.error("Error fetching user's profile:", error);
      return { success: false, error: `${error}` };
  }
}


module.exports = {
  getPhotos,
  savePhotos,
  toggleLike,
  savePhotoPerfil,
  getUserPhotos,
  getUserProfile,
  deletePhoto
}

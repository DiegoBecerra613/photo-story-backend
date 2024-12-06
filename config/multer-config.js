const multer = require('multer');

const fileStorage = () => multer.diskStorage({
    destination: (req, file, cb) => {
      let directory = `public/images`;
      return cb(null, directory);
    },
    filename: (req, file, cb) => {
      cb(null, `${file.originalname.trim().replaceAll(' ', '-')}`)
    }
})

const upload = () => multer({
  storage: fileStorage(),
  limits: { fieldSize: 5 * 1024 * 1024 }
})

module.exports = upload;
var express = require('express');
var router = express.Router();
const {getPhotos, savePhotos, getUserProfile, toggleLike, savePhotoPerfil, getUserPhotos, deletePhoto} = require('../business/photos');
const upload = require('../config/multer-config');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/getPhotos', async function (req, res){
  const response = await getPhotos(req.userId);
  res.send(response);
});

router.post('/likePhoto', async (req, res) => {
  const { photoId, like } = req.body;
  const response = await toggleLike(req.userId, photoId, like);
  res.send(response);
});


router.post('/uploadPhotos', upload().single('photo'), async function (req, res) {
  try {
    const userId = req.userId; 
    const photo = {
      route: `${req.file.destination.replace('public/', '')}/${req.file.filename}`,
      name: req.file.filename,
      title: req.body.title,
      description: req.body.description,
      userId: req.userId
    };
    const response = await savePhotos(photo);
    res.send(response);
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

router.post('/uploadPorfilePhoto', upload().single('photo'), async function (req, res) {
  try {
    const userId = req.userId;
    const photo = {
      profilePhotoPath: `${req.file.destination.replace('public/', '')}/${req.file.filename}`,
    };

    const response = await savePhotoPerfil(photo, userId);
    res.send(response);
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

router.get('/getUserPhotos', async function (req, res) {
  try {
    const userId = req.userId; 
    if (!userId) {
      return res.status(401).send({ success: false, error: "Usuario no autenticado" });
    }

    const response = await getUserPhotos(userId);
    res.send(response);
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

router.delete('/deletePhoto/:photoId', async function (req, res) {
  try {
    const userId = req.userId;
    const photoId = parseInt(req.params.photoId, 10);

    if (!photoId || isNaN(photoId) || !userId) {
      return res.status(400).send({ success: false, error: 'Invalid photoId or userId' });
    }

    console.log("Received request to delete photoId:", photoId, "by userId:", userId);

    const response = await deletePhoto(photoId, userId);
    res.status(200).send(response);
  } catch (error) {
    console.error("Error in DELETE /deletePhoto/:photoId:", error);
    res.status(500).send({ success: false, error: error.message });
  }
});



router.get('/getUserProfile/:userId', async (req, res) => {
  const { userId } = req.params;
  const loggedUserId  = req.userId; 
  const response = await getUserProfile(userId, loggedUserId);
  res.send(response);
});

module.exports = router;

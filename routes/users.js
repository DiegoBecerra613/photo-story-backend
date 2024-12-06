var express = require('express');
var router = express.Router();
const { createUser, login, changePersonalInfo, changePassword } = require('../business/users')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/login', async function(req, res, next) {
  const request = req.body;
  const response = await login(request);
  res.send(response);
});

router.post('/createUser', async function(req, res, next) {
  const request = req.body;
  const response = await createUser(request);
  res.send(response);
});

router.post('/changePersonalInfo', async function(req, res, next) {
  const request = req.body;
  console.log(request);
  const response = await changePersonalInfo(request, req.userId);
  res.send(response);
});

router.post('/changePassword', async function(req, res, next) {
  const request = req.body;
  const response = await changePassword(request, req.userId);
  res.send(response);
});



module.exports = router;

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const secretKey = process.env.API_KEY
const cors = require('cors');
// var dotenv = require('dotenv')


const {createConnectionPool} = require('./config/db');

const whiteList = [/\/users\/createUser/, /\/users\/login/];

const authenticationMiddleware = async (req, res, next) => {
  const isPathInWhiteList = whiteList.some(pattern => pattern.test(req.path));

  if (isPathInWhiteList) {
    next();
  } else {
    const authorization = req.headers.authorization;
    const token = authorization && authorization.split(' ')[1];
    if (!token) {
      return res.status(403).json({ success: false, message: 'TOKEN NOT PROVIDED' });
    }
    
    jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ success: false, message: 'INVALID TOKEN' });
      }
      const userId = decoded.id;
      req.userId = userId;
      next();
    });
  }
}



var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const {googleLogin} = require("./business/users");

var app = express();
app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


createConnectionPool();

app.use(authenticationMiddleware);

app.use('/', indexRouter);
app.use('/users', usersRouter);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

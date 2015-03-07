var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var swig = require('swig');
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.engine('html', swig.renderFile);
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
var model = require('./model/model');
var Repository = model.Repository;

var router = express.Router();
/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/api/repository',function(req,res){
	Repository.find(function(err,repositories){
			res.send(repositories);	
	})
});

router.param('repositoryID',function(req,res,next,id){
	req.repositoryID=id;
	next();
});
router.delete('/api/repository/:repositoryID',function(req,res){
	Repository.remove({_id: req.repositoryID},function(err){
	 	if(err){
	 		res.send({result:'err',message:err});
	 	}else{
	 		res.send({result:'success',message:"The repository ["+req.repositoryID+"] has been removed"})
	 	}
	 });
});


app.use('/', router);

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
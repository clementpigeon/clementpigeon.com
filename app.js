
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var fs = require('fs');
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.logger('dev'));
app.use(express.favicon(__dirname + '/public/images/favicon.ico'));

app.use(express.json());
app.use(express.urlencoded());
app.use(express.multipart());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


app.post('/upload_img', upload_img);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


function upload_img(req, res, next){
	var img = req.files.photo;
	var photo_name = img.name;

	fs.readFile(img.path, function (err, data) {
		var newPath = __dirname + '/public/uploads/' + photo_name;
		fs.writeFile(newPath, data, function (err) {
			if (err) return next(err);
			res.end(JSON.stringify({
				photo_path: '/uploads/' + photo_name,
				photo_name: photo_name
			}));
		});
	});
}







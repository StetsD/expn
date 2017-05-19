var express = require('express');
var handlebars = require('express-handlebars')
	.create({defaultLayout: 'main'});

var app = express();
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(express.static(__dirname + '/public'));

app.set('port', process.env.PORT || 3000);


app.use(function(req, res, next){
	res.locals.showTest = app.get('env') !== 'production' && req.query.test === '1';
	next();
});


app.get('/', function(req, res){
	res.render('home');
});

app.get('/api/lala', function(req, res){
	var tours = [
		{id: 0, name: 'Река Худ', price: 99},
		{id: 1, name: 'Орегон Коуст', price: 149}
	];
	res.json(tours);
})

app.get('/tours/hood-river', function(req, res){
	res.render('tours/hood-river');
});

app.get('/tours/request-group-rate', function(req, res){
	res.render('tours/request-group-rate');
});

app.get('/about', function(req, res) {
	res.render('about', {
		pageTestScript: '/qa/tests-about.js'
	});
});

app.use(function(req, res, next){
	res.status(404);
	res.render('404');
});

app.use(function(err, req, res, next){
	console.log(err.stack);
	res.status(500);
	res.render('500');
});

app.listen(app.get('port'), function(){
	console.log('Express запущен на http://localhost:' + app.get('port'));
});

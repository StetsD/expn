var express = require('express');
var handlebars = require('express-handlebars').create({
	defaultLayout: 'main',
	helpers: {
		section: function(name, options){
			if(!this._sections) this._sections = {};
			this._sections[name] = options.fn(this);
			return null;
		}
	}
});
var formidable = require('formidable');
var credentials = require('./credentials');
var cartValidation = require('./lib/cartValidation');

var app = express();
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(express.static(__dirname + '/public'));

app.use(require('body-parser').urlencoded({extended: true}));
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
	resave: false,
	saveUninitialized: false,
	secret: credentials.cookieSecret
}));

app.use(require('./lib/tourRequiresWaiver'));
app.use(cartValidation.checkWaivers);
app.use(cartValidation.checkGuestCounts);

app.set('port', process.env.PORT || 3000);

app.use(function(req, res, next){
	res.locals.flash = req.session.flash;
	delete req.session.flash;
	next();
});

app.use(function(req, res, next){
	res.locals.showTest = app.get('env') !== 'production' && req.query.test === '1';
	next();
});

app.use(function(req, res, next){
	if(!res.locals.partials) res.locals.partials = {};
	res.locals.partials.weatherContext = getWeatherData();
	next();
});

app.get('/contest/vacation-photo', function(req, res){
	var now = new Date();
	res.render('contest/vacation-photo', {
		year: now.getFullYear().month
	});
});

app.post('/contest/vacation-photo/:year/:month', function(req, res){
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files){
		if(err) return res.redirect(303, '/error');
		console.log(fields);
		console.log(files);
		res.redirect(303, 'thank-you');
	})
});

var VALID_EMAIL_REGEX = new RegExp('^[a-zA-Z0-9.!#$%&\'*+\/=?^_`{|}~-]+@' +
'[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?' +
'(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$');

app.get('/newsletter', function(req, res){
	res.render('newsletter', {csrf: 'csrf token goes here'});
});

app.post('/process', function(req, res){
	console.log('Form ' + req.query.form);
	console.log(req.body._csrf);
	console.log(req.body.name);
	console.log(req.body.email);
	res.redirect(303, '/thank-you');
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

function getWeatherData() {
    return {
        location: [
			{
				name: 'Портленд',
				forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
				iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
				weather: 'Облачность',
				temp: '55'
			},
            {
                name: 'Бенд',
                forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
                weather: 'Малооблачно',
                temp: '55.0 F (12.8 C)'
            }, {
                name: 'Манзанита',
                forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
                weather: 'Небольшой дождь',
                temp: '20'
            }
        ]
    }
}

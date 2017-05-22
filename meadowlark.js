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
switch (app.get('env')) {
	case 'development':
		app.use(require('morgan')('dev'));
		break;
	case 'production':
		app.use(require('express-logger'))({
			path: __dirname + '/log/requests.log'
		});
		break;
	default:
	break;
}

app.use(function(req, res, next){
	var domain = require('domain').create();
	domain.on('error', function(err){
		console.error('Перехвачена ошибка\n', err.stack);
		try{
			setTimeout(function(){
				console.error('Отказобезопасный останов');
				process.exit(1)
			}, 5000);

			var worker = require('cluster').worker;
			if(worker) worker.disconnect();
			server.close();

			try{
				next(err);
			}catch(err){
				console.error('Сбой механизма обработки ошибок', err.stack);
				res.statusCode = 500;
				res.setHeader('content-type', 'text/plain');
				res.end('Ошибка сервера');
			}

		}catch(err){
			console.error('Не могу отправить ответ 500', err.stack);
		}
	});

	domain.add(req);
	domain.add(res);
	domain.run(next);
});

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

app.get('/epic-fail', function(req, res){
	process.nextTick(function(){
		throw new Error('Allahu Akbar');
	});
})

app.use(function(req, res, next){
	res.status(404);
	res.render('404');
});

app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500).render('500');
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

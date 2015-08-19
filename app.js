var path = require('path');
var koa = require('koa');
var Router = require('koa-router');
var bodyParser = require('koa-bodyparser');
var views = require('koa-views');
var serve = require('koa-static');
var session = require('koa-session');
var passport = require('koa-passport');

// React
var React = require('react');
var ReactApp = require('./public/assets/server.js');

// Libraries
var Passport = require('./lib/passport');

// Loading settings
var settings = require('./lib/config.js');
if (!settings) {
	console.error('Failed to load settings');
	process.exit(1);
}

var app = koa();

// Static file path
app.use(serve(path.join(__dirname, 'public')));

// Enabling BODY
app.use(bodyParser());

// Create render
app.use(views(__dirname + '/views', {
	ext: 'jade',
	map: {
		html: 'jade'
	}
}));

// Initializing session mechanism
app.keys = settings.general.session.keys || [];
app.use(session(app));

// Initializing passport
Passport.init(passport);
Passport.local(passport);
app.use(passport.initialize());
app.use(passport.session());

// Initializing locals to make template be able to get
app.use(function *(next) {
	this.state.user = this.req.user || undefined;
	yield next;
});

// Get content which is rendered by react
function getContent(routePath, query) {

	return function(done) {
		var content = React.renderToString(React.createElement(ReactApp.main, { path: routePath }));

		done(null, content);
	};
}

// Routes
app.use(require('./routes/user').middleware());

// Initializing routes for front-end rendering
var router = new Router();
for (var index in ReactApp.routes) {
	var route = ReactApp.routes[index];

	router.get(route.path, function *() {
		var content = yield getContent(this.request.path, this.query);
		yield this.render('index', { content: content });
	});
}
app.use(router.middleware());

app.listen(settings.general.server.port, function() {
	console.log('server is ready');
});

var users = {
	'janzen': {
		username: 'janzen',
		password: 'pizza',
		id: 1
	}, 
	'cheng': {
		username: 'cheng',
		password: 'hatch',
		id: 2
	}
}

var Express = require('express');
var app = Express();
var BodyParser = require('body-parser');
var Passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;

var JSONWebToken = require('jsonwebtoken'),
	Crypto = require('crypto');

app.use(BodyParser.urlencoded({
	extended: false
}));

app.use(BodyParser.json());
app.use(Passport.initialize());

// Token generation
var generateToken = function(request, response) {
	// The payload just contains the id of the user
	// and their username, we can verify whether the claim
	// is correct using JSONWebToken.verify

	var payload = {
		id: user.id,
		username: user.username
	}

	// Generate a random string
	// Usually this would be an app wide constant
	// But can be done both ways
	var secret = Crypto.randomBytes(128).toString('base64');

	// Create the token with a payload and secret
	var token = JSONWebToken.sign(payload, secret);

	// The user is still referencing the same object
	// in users, so no need to set it again
	// If we were using a database, we would save it herre
	request.user.secret = secret;

	return token;
}

var generateTokenHandler = function(request, response) {
	console.log(request.user);
	var user = request.user;
	// Generate our token
	var token = generateToken(request, response);
	// Return the user a token to use
	response.end(token);
}

/** Authentication Strategies **/
var localStrategy = new LocalStrategy({
	usernameField: 'username',
	passwordField: 'password'
}, function(username, password, done) {
	user = users[username];

	if (user == null) {
		return done(null, false, { message: 'Invalid user'});
	}

	if (user.password !== password) {
		return done(null, false, { message: 'Invalid password'});
	}

	done(null, user);
});

Passport.use('local', localStrategy);

// Authentication based on token
var verifyToken = function(token, done) {
	var payload = JSONWebToken.decode(token);
	var user = users[payload.username];

	// If we can't find a user, or the information
	// doesn't match then return false

	if (user == null ||
		user.id !== payload.id ||
		user.username !== payload.username ) {
		return done(null, false);
	}

	// Ensure the token is valid now we have a user
	JSONWebToken.verify(token, user.secret, function(error, decoded) {
		if (error || decoded == null) {
			return done(error, false);
		}
		return done(null, user);
	});
}

var bearerStrategy = new BearerStrategy(verifyToken);

Passport.use('bearer', bearerStrategy);

// Routes
app.post(
	'/login',
	Passport.authenticate('local', {session: false}),
	generateTokenHandler
	// function (request, response) {
	// 	response.send('User Id ' + request.user.id);
	// }
);

app.get('/userinfo',
		Passport.authenticate('bearer', {session: false}),
		function(request, response) {
			var user = request.user;
			response.send({
				id: user.id,
				username: user.username
			})
		}
);

app.listen(3000, function() {
	console.log('Listening on port 3000');
});

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
		id: request.user.id,
		username: request.user.username
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

var validateOAuth = function(accessToken, refreshToken, profile, done) {
	var keys = Object.keys(users), user = null;
	console.log(keys);

	for (var iKey = 0; iKey < keys.length; iKey += 1) {
		user = users[keys[iKey]];

		if (user.thirdPartyId !== profile.user_id) {
			continue;
		}

		return done(null, user);
	}

	users[profile.name] = user = {
		username: profile.name,
		id: keys.length,
		thirdPartyId: profile.user_id
	}

	done(null, user);
}

var oAuthOptions = {
	authorizationURL: 'https://janzen.auth0.com/authorize',
	tokenURL: 'https://janzen.auth0.com/oauth/token',
	clientID: 'oY7e57ac5axSrlCy4btpPSQ681CdPMHY',
	clientSecret: 'z5S7JwO0Enm5gTG8rCetFZkDuMGpDU2M5jZkZ4Skr7ikiDf7r_mg7PKPn02rcKV1',
	callbackURL: 'http://localhost:3000/oauth/callback'
}

var OAuth2Strategy = require('passport-oauth2').Strategy;

var oAuthStrategy = new OAuth2Strategy(oAuthOptions, validateOAuth);

var parseUserProfile = function(done, error, body) {
	if (error) {
		return done(new Error('Failed to fetch user profile'));
	}

	var json;

	try {
		json = JSON.parse(body);
	} catch(error) {
		return done(error);
	}

	done(null, json);
}

var getUserProfile = function(accessToken, done) {
	oAuthStrategy._oauth2.get(
			'https://janzen.auth0.com/userinfo',
			accessToken,
			parseUserProfile.bind(null, done)
		)
}

oAuthStrategy.userProfile = getUserProfile;

Passport.use('oauth', oAuthStrategy);

app.get('/oauth', Passport.authenticate('oauth', {session: false}));

app.get('/oauth/callback', Passport.authenticate('oauth', {session: false}), generateTokenHandler);

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

// Web Server
app.listen(3000, function() {
	console.log('Listening on port 3000');
});

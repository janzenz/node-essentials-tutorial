var Http = require('http'),
	Router = require('router'),
	BodyParser = require('body-parser'),
	server,
	router;

router = new Router();

server = Http.createServer(function(request, response) {
	router(request, response, function(error) {
		if (!error) {
			response.writeHead(404);
		} else {
			// Handle errors
			console.log(error.message, error.stack)
			response.writeHead(404);
		}
		response.end('\n');
	})
})

server.listen(3000, function() {
	console.log('Listening on port 3000');
});

// Router
var counter = 0, messages = {};

// Middleware Checking if the message is found or not.
router.use(function(request, response, next) {
	var id = request.params.id,
		message = messages[id];

	if ((request.method === 'GET' && 
			request.url !== '/message') ||
		request.method === 'DELETE') {
		if (typeof message !== 'string') {
			console.log('Message not found', id, request.url);

			response.writeHead(404);
			response.end('\n');
			// next(error);
		}
	}
	// Null as there were no errors
	// If there was an error then we could call `next(error)`
	next(null);
});

router.use(BodyParser.text());

function createMessage(request, response) {
	var id = counter += 1,
		message = request.body;
	console.log('Create message', id, message);
	messages[id] = message;
	response.writeHead(201, {
		'Content-Type': 'text/plain',
		'Location': '/message/' + id
	});
	response.end(message);
}

router.post('/message', createMessage);

function readMessage(request, response) {
	var id = request.params.id,
		message = messages[id];
	console.log('Read message', id, message);

	response.writeHead(200, {
		'Content-Type': 'text/plain'
	});

	response.end(message);
}

router.get('/message/:id', readMessage);

function deleteMessage(request, response) {
	var id = request.params.id;
		delete messages[id];
	console.log('Deleted message', id);

	response.writeHead(204, {});

	response.end('');
}

router.delete('/message/:id', deleteMessage);

function getAllMessage(req, res) {
	var display = '';

	for (id in messages) {
		display += messages[id] + '\n';
	}

	res.writeHead(200, {
		'Content-Type': 'text/plain'
	})

	res.end(display);
}

router.get('/message', getAllMessage);

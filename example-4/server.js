var Http = require('http');

var count = 0;
function requestHandle(req, res) {
	var message, status = 200;
	count += 1;
	
	switch(req.url) {
		case '/count':
			message = count.toString();
			break;
		case '/hello':
			message = 'World';
			break;
		default:
			status = 404;
			message = 'Not Found';
			break;
	}

	res.writeHead(201, {
		'Content-Type': 'text/plan'
	});
	console.log(req.url, status, message);
	res.end(message);
}

var server = Http.createServer(requestHandle);
server.listen(3000, function() {
	console.log('Listening on port 3000');
})

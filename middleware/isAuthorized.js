const jwt = require('jsonwebtoken');

function isAuthorized(request, response, next) {
    if ( request.headers.authorization !== undefined ) {

        let token = request.headers.authorization.split(" ")[1];

        try {
            let user = jwt.verify(token, 'commentestvotreblanquette', { algorithm: 'HS256'});

            response.locals.user = user;
            next();
        } catch(err) {
            response.statusCode = 401;
            response.send({"message": "Unauthorized"});
            return;
        }
    } else {
        response.statusCode = 401;
        response.send({"message": "Unauthorized"});
        return;
    }
}

module.exports = isAuthorized;

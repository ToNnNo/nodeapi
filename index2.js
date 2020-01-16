const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');

// https://hackernoon.com/set-up-ssl-in-nodejs-and-express-using-openssl-f2529eab5bb
// https://github.com/sagardere/set-up-SSL-in-nodejs
// https://www.digitalocean.com/community/tutorials/how-to-create-a-self-signed-ssl-certificate-for-apache-in-ubuntu-16-04
// openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365
// passphrase: serverhttps

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ product: [
    { id: 1, name: 'Pomme', price: 12.99 },
    { id: 2, name: 'Poire', price: 2.99 },
    { id: 3, name: 'Cerise', price: 0.99 },], count: 4 })
    .write();

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use( (request, response, next) => {
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Access-Control-Allow-Origin', '*'); // autorise toutes provenances
    response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    response.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
    next();
});

app.get('/', (request, response) => {

    let html = `<!doctype html>
<html>
<head>
    <title>Server</title>
    <meta charset="utf-8" />
</head>
<body>
    <h1>Server API</h1>
    <hr />
    <ul>
        <li><a href="/product">Liste des produits</a></li>
    </ul>
</body>
</html>`;

    response.setHeader('Content-Type', 'text/html');
    response.send(html);
});

app.get('/product', (request, response) => {

    response.send(db.get('product').value());
});

app.get('/product/:id', (request, response) => {
    const _id = +request.params.id;

    const product = db.get('product')
        .find({ id: _id })
        .value();

    if (!product) {
        response.statusCode = 404;
        response.send({message: 'Not Found'});
        return;
    }

    response.send(product);
});

app.post('/product', (request, response) => {

    if( !request.body.name ) {
        response.statusCode = 400;
        response.send({"message": "Bad Request"});
        return;
    }

    db.get('product')
        .push(request.body)
        .last()
        .assign({ id: db.get('count').value() })
        .write();

    db.update('count', n => n + 1)
        .write();

    let product = db.get('product').last().value();

    response.statusCode = 201;
    response.send(product);
});

app.put('/product/:id', (request, response) => {

    const _id = +request.params.id;

    let product = db.get('product')
        .find({ id: _id });

    if (!product) {
        response.statusCode = 404;
        response.send({message: 'Not Found'});
        return;
    }

    product.assign(request.body)
        .write();

    response.statusCode = 204;
    response.send({message: 'No Content'});
});

app.delete('/product/:id', (request, response) => {
    const _id = +request.params.id;

    let product = db.get('product')
        .find({ id: _id }).value();

    if (!product) {
        response.statusCode = 404;
        response.send({message: 'Not Found'});
        return;
    }

    db.get('product').remove({ id: _id })
        .write();

    response.statusCode = 204;
    response.send({message: 'No Content'});
});

app.listen(3200, () => {
    console.log('Api Server listening at http://localhost:3200');
});

https.createServer({
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem'),
    passphrase: 'serverhttps'
}, app).listen(32443, () => {
    console.log('Api Server listening at https://localhost:32443');
});

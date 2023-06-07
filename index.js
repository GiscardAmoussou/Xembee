const { log } = require('console');

const express = require('express');

const multer = require('multer');

require('dotenv').config();




const app = express();

const upload = multer({ dest: 'uploads/' });

const xembee = process.env.XEMBEE;




app.use(express.json());

app.use(express.urlencoded({ extended: true }));




const { Client } = require('pg');




const client = new Client({

    host: 'dumbo.db.elephantsql.com',

    port: 5432,

    database: 'glcskjue',

    user: 'glcskjue',

    password: 'NxjjWYG_ZLjWlNHpVu8LiH0kZrNrf7JJ'

});

client.connect()

    .then(() => {

        console.log('Connected to PostgreSQL');

    })

    .catch((err) => {

        console.error('Error connecting to PostgreSQL:', err);

    });




// Test affichage données dans la BD

app.get(`/${xembee}/viewSensor`, (req, res) => {

    console.log('view sensors');

    client.query('SELECT * FROM sensor')

        .then((result) => {

            console.log('Query Result:', result.rows);

            res.status(200).send(result.rows);

        })

        .catch((err) => {

            console.error('Error executing query:', err);

            res.status(500).send(err);

        });

})




app.get(`/${xembee}/sensor`, (req, res) => {

    console.log('hello sensor');

    res.status(200).send('hello sensor');

})




// Insertion d'un capteur

app.post(`/${xembee}/addSensor`, (req, res) => {

    console.log(req.body);

    res.status(200).send(req.body);

})




// Modification d'un capteur (changer le post par put)

app.post(`/${xembee}/updateSensor/:serial`, (req, res) => {

    console.log(req.body);

    console.log(req.params);

    res.status(200).send(req.params);

})




// Suppression d'un capteur (changer le post par delete)

app.post(`/${xembee}/deleteSensor/:serial`, (req, res) => {

    console.log(req.params);

    res.status(200).send(req.params);

})




// Endpoint pour recevoir le fichier texte

app.post(`/${xembee}/upload`, upload.single('file'), (req, res) => {

    if (req.file) {

        console.log('Fichier reçu :', req.file.originalname);

        res.status(200).send('Fichier reçu avec succès !');

    } else {

        res.status(400).send('Aucun fichier n\'a été envoyé.');

    }

});






// Démarrer le serveur

app.listen(3001, () => {

    console.log('Serveur démarré sur le port 3001');

});


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

const connectionString = 'postgres://admin:2g1ss18h7NhQsK3Lzp2bfjSS1iXYPNE2@gnwp8d.stackhero-network.com:5432/xembee?sslmode=require';

const client = new Client({
    connectionString: connectionString,
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

// selection d'un capteur
app.get(`/${xembee}/getSensors/:userId`, (req, res) => {
    const userId = req.params.userId;
    console.log(userId);

    client.query('SELECT module.* FROM module WHERE module.userid = $1', [userId], (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des capteurs :', error);
            res.status(500).send('Erreur lors de la récupération des capteurs');
        } else {
            console.log(results.rows);
            const modules = results.rows.map(async (row) => {
                try {
                    const composantResult = await client.query('SELECT composant.* from composant WHERE composant."idModule" = $1', [row.id]);
                    console.log(composantResult.rows);
                    const composants = composantResult.rows.map(async (compo) => {
                        try {
                            const statistiqueResult = await client.query('SELECT statistiques.* from statistiques WHERE statistiques."idComposant" = $1', [compo.id]);
                            const typeResult = await client.query('SELECT type.* from type WHERE type.id = $1', [compo.typeid]);
                            console.log(statistiqueResult.rows);

                            const composant = {
                                id: compo.id,
                                typeid: compo.typeid,
                                numserie: compo.numserie,
                                type: typeResult.rows.map((t) => ({
                                    name: t.label
                                })),
                                statistiques: statistiqueResult.rows.map((stat) => ({
                                    id: stat.id,
                                    date: stat.date,
                                    valeur: stat.valeur
                                    // Ajoutez les autres propriétés de la statistique selon votre schéma de base de données
                                })),
                            };



                            return composant;
                        } catch (error) {
                            console.error('Erreur lors de la récupération des statistiques :', error);
                            res.status(500).send('Erreur lors de la récupération des statistiques');
                        }
                    });



                    const module = {
                        id: row.id,
                        numserie: row.numserie,
                        reference: row.reference,
                        composants: await Promise.all(composants),
                    };



                    return module;
                } catch (error) {
                    console.error('Erreur lors de la récupération des capteurs :', error);
                    res.status(500).send('Erreur lors de la récupération des capteurs');
                }
            });



            Promise.all(modules)
                .then((moduleData) => {
                    res.status(200).json(moduleData);
                })
                .catch((error) => {
                    console.error('Erreur lors de la récupération des capteurs :', error);
                    res.status(500).send('Erreur lors de la récupération des capteurs');
                });
        }
    });
});

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

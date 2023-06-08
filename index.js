const { log } = require('console');
const express = require('express');
const multer = require('multer');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });
const xembee = process.env.XEMBEE;
const connectionString = process.env.connectionString;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { Client } = require('pg');

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

// selection de tous les modules
app.get(`/${xembee}/getAllModules`, (req, res) => {

    client.query('SELECT module.* FROM module', (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des modules :', error);
            res.status(500).send('Erreur lors de la récupération des modules');
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
})

// selection des modules d'un utilisateur
app.get(`/${xembee}/getModules/:userId`, (req, res) => {
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


// Afficher les KPI des modules dans la base de données
app.get(`/${xembee}/viewModuleKPI`, (req, res) => {
    console.log('View module KPIs');
    client.query('SELECT * FROM statistics')
        .then((result) => {
            console.log('Query Result:', result.rows);
            res.status(200).send(result.rows);
        })
        .catch((err) => {
            console.error('Error executing query:', err);
            res.status(500).send(err);
        });
});

const readline = require('readline');
const fs = require('fs');

// Endpoint pour recevoir le fichier texte
app.post(`/${xembee}/upload`, upload.single('file'), (req, res) => {
    if (req.file) {
        console.log('Fichier reçu :', req.file.originalname);

        // Créer un stream de lecture pour le fichier
        const readStream = fs.createReadStream(req.file.path);

        // Utiliser readline pour lire le fichier ligne par ligne
        const rl = readline.createInterface({
            input: readStream,
            output: process.stdout,
            terminal: false
        });

        rl.on('line', (line) => {
            // Supposons que chaque ligne est un tuple : (ID_COMPOSANT,DATE,VALEUR)
            const values = line.split(',');

            // Insérer les valeurs dans la table 'statistiques'
            // Modifiez cette requête en fonction de la structure de votre table 'statistiques'
            client.query('INSERT INTO statistiques(idComposant, date, value) VALUES($1, $2, $3)', values)
                .then(() => console.log('Values added successfully'))
                .catch((err) => console.error('Error while adding values:', err));
        });

        rl.on('close', () => {
            res.status(200).send('Fichier traité avec succès !');
        });

    } else {
        res.status(400).send('Aucun fichier n\'a été envoyé.');
    }
});

// app.get(`/${xembee}/sensor`, (req, res) => {
//     console.log('hello sensor');
//     res.status(200).send('hello sensor');
// })

// // Insertion d'un capteur
// app.post(`/${xembee}/addSensor`, (req, res) => {
//     console.log(req.body);
//     res.status(200).send(req.body);
// })

// // Modification d'un capteur (changer le post par put)
// app.post(`/${xembee}/updateSensor/:serial`, (req, res) => {
//     console.log(req.body);
//     console.log(req.params);
//     res.status(200).send(req.params);
// })

// // Suppression d'un capteur (changer le post par delete)
// app.post(`/${xembee}/deleteSensor/:serial`, (req, res) => {
//     console.log(req.params);
//     res.status(200).send(req.params);
// })

// Démarrer le serveur
app.listen(3001, () => {
    console.log('Serveur démarré sur le port 3001');
});

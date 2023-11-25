const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const auth = require('basic-auth');
const fs = require('fs');

const app = express();
const port = 3001;

// Lire les informations depuis le fichier de configuration
const configFile = fs.readFileSync('config.json');
const config = JSON.parse(configFile);
const credentials = config.credentials;
const serverConfig = config.server;

// Middleware d'authentification de base
const basicAuth = (req, res, next) => {
    const user = auth(req);

    if (!user || !credentials || user.name !== credentials.username || user.pass !== credentials.password) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.status(401).send('Unauthorized');
    }

    return next();
};

app.use(express.static('public'));
app.use(bodyParser.json());

// Utiliser l'authentification de base pour toutes les routes
app.use(basicAuth);

app.get('/', (req, res) => {
    // Vous pouvez envoyer une page d'accueil ou rediriger vers une autre page ici
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/runRcon', (req, res) => {
    const rconCommand = `rcon.exe -a ${serverConfig.ip}:${serverConfig.port} -p ${serverConfig.rconPassword} "${req.body.command}"`;

    exec(rconCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erreur lors de l'exécution de rcon.exe : ${error}`);
            return res.status(500).send('Erreur lors de l\'exécution de rcon.exe');
        }

        console.log(`Sortie de rcon.exe : ${stdout}`);
        
        // Si la commande est 'players', renvoyer la sortie au client
        if (req.body.command.toLowerCase() === 'players') {
            return res.send(stdout);
        } else {
            res.send('Commande RCON exécutée avec succès !');
        }
    });
});

// Ajouter une nouvelle route pour la commande 'banid'
app.post('/runRconBanId', (req, res) => {
    const banIdCommand = `rcon.exe -a ${serverConfig.ip}:${serverConfig.port} -p ${serverConfig.rconPassword} banid ${req.body.banIdValue}`;

    exec(banIdCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erreur lors de l'exécution de rcon.exe (banid) : ${error}`);
            return res.status(500).send('Erreur lors de l\'exécution de rcon.exe (banid)');
        }

        console.log(`Sortie de rcon.exe (banid) : ${stdout}`);
        res.send('Commande RCON (banid) exécutée avec succès !');
    });
});

app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
});

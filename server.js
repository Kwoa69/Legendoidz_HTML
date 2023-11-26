const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const auth = require('basic-auth');
const fs = require('fs');
const morgan = require('morgan');

const app = express();
const port = 3001;

const configFile = fs.readFileSync('config.json');
const config = JSON.parse(configFile);
const credentials = config.credentials;
const serverConfig = config.server;

const basicAuth = (req, res, next) => {
    const user = auth(req);

    if (!user || !credentials || user.name !== credentials.username || user.pass !== credentials.password) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.status(401).send('Unauthorized');
    }

    return next();
};

const accessLogStream = fs.createWriteStream('access.log', { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

app.use(express.static('public'));
app.use(bodyParser.json());

app.use(basicAuth);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/buttonClick', (req, res) => {
    const { button, username } = req.body;
    const logMessage = `L'utilisateur ${username} a cliqué sur le bouton : ${button}`;
    console.log(logMessage);
    accessLogStream.write(logMessage + '\n');
    res.send(`Clic sur le bouton enregistré : ${button}`);
});

app.post('/runRcon', (req, res) => {
    const rconCommand = `rcon.exe -a ${serverConfig.ip}:${serverConfig.port} -p ${serverConfig.rconPassword} "${req.body.command}"`;

    exec(rconCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erreur lors de l'exécution de rcon.exe : ${error}`);
            return res.status(500).send('Erreur lors de l\'exécution de rcon.exe');
        }

        console.log(`Sortie de rcon.exe : ${stdout}`);

        if (req.body.command.toLowerCase() === 'players') {
            return res.send(stdout);
        } else {
            res.send('Commande RCON exécutée avec succès !');
        }
    });
});

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
		app.post('/runRconAddUser', (req, res) => {
    const { newUsername, newPassword } = req.body;
    const addUserCommand = `rcon.exe -a ${serverConfig.ip}:${serverConfig.port} -p ${serverConfig.rconPassword} "adduser ${newUsername} ${newPassword}"`;

    exec(addUserCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erreur lors de l'exécution de la commande adduser : ${error}`);
            return res.status(500).send('Erreur lors de l\'exécution de la commande adduser');
        }

        console.log(`Sortie de la commande adduser : ${stdout}`);
        res.send('Commande adduser exécutée avec succès !');
    });
});

app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
});

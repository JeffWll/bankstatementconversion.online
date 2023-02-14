const config = require('config');
const serverConfig = config.get('server');

const express = require('express');
const session = require('express-session');
var multer = require("multer");
var bodyParser = require('body-parser');
const fs = require('fs');
const cors = require("cors");
const crypto = require('crypto');

const serverHost = serverConfig.host;
const serverPort_3000 = serverConfig.port_3000;

const secret = crypto.randomBytes(32).toString('hex');
console.log(secret);

var app = express();
const path = './uploads';

app.use(function (request, response, next) {
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(cors());// evita erros de politica CORS

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
}

try {
    var app = express();
    var storage = multer.diskStorage({
        destination: function (request, file, cb) {
            cb(null, "files/uploads/");
        },
        filename: function (request, file, cb) {
            cb(null, file.originalname);
        }
    });

    app.use(function (request, response, next) {
        response.header("Access-Control-Allow-Origin", "*");
        response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    //app.post('/upload', function (request, response) {
    //    console.log(request.body);
    //    console.log("Arquivo enviado com sucesso");
    //    response.send('Arquivo enviado com sucesso!');
    //});

    app.get('/employee/csv', (request, response) => {
        fs.readFile('employee.csv', 'utf-8', (err, data) => {
            if (err) {
                response.status(500).send('Ocorreu um erro ao ler o arquivo employee CSV.');
            } else {
                response.status(200).send(data);
            }
        });
    });

    app.get('/excel/statement/csv', (request, response) => {
        fs.readFile('files/excel/statement-2023-01-25.csv', 'utf-8', (err, data) => {
            if (err) {
                response.status(500).send('Ocorreu um erro ao ler o arquivo statement CSV.');
            } else {
                response.status(200).send(data);
            }
        });
    });

    var upload = multer({ storage: storage });

    app.post("/upload", upload.single("file"), function (request, response) {
        console.log("antes de receber o pdf");
        console.log("Arquivo recebido:", request.file);

        console.log("antes de processar o pdf");

        ReadAndProcessFile();
        console.log("depoisss");

    });

    //app.listen(3000, function () {
    //    console.log('Servidor rodando na porta 3000!');
    //});
} catch (error) {
    console.error(error);
    return response.status(500).send({ message: "Ocorreu um erro ao processar sua requisição." });
}

function ReadAndProcessFile() {

    console.log("script: dentro da função");
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
    const fs = require("fs");
    var path = require('path');

    var id = 'statement-2023-01-25';//filename;//'statement-2023-01-25';
    const filePath = path.join(__dirname, 'files/uploads', id.concat(".pdf"));
    const csvFile = path.join(__dirname, 'files/excel', id.concat(".csv"));
    //const uploadFolderPath = './files/pdfs/uploads/';

    console.log(filePath);

    // Carregar o arquivo PDF
    pdfjsLib.getDocument(filePath).promise.then(pdf => {
        // Pega a primeira página do PDF
        pdf.getPage(1).then(page => {
            // Extrai o texto da página
            page.getTextContent().then(textContent => {
                let text = '';
                let header = '';
                let substring = 'DAILY ACCOUNT ACTIVITY';

                for (let i = 0; i < textContent.items.length; i++) {

                    //console.log("======================================================");
                    //console.log(textContent.items[i].str);

                    if (textContent.items[i].str.includes(substring)) {
                        header = textContent.items[i + 4].str + ',' + textContent.items[i + 6].str + ',' + textContent.items[i + 8].str + '\n';
                        i = i + 10;
                    }
                    if (header != '') {
                        text += textContent.items[i].str.replace(",", " ") + ',' + textContent.items[i + 2].str.replace(",", " ") + ' ' + textContent.items[i + 4].str.replace(",", " ") + ',' + textContent.items[i + 6].str.replace(",", " ") + '\n';
                        //console.log("======================================================")
                        //console.log(textContent.items[i+6].str);
                        i = i + 6;
                    }

                }
                // Dividir o texto em linhas
                header += text;
                const lines = header.split('\n');

                console.log(lines)
                // Dividir cada linha em colunas
                const rows = [];
                for (const line of lines) {
                    const row = line.split(',');
                    rows.push(row);
                }
                // Escrever os dados em um arquivo CSV
                let csv = '';
                for (const row of rows) {
                    csv += row.join(',') + '\n';
                }
                // Salvar o arquivo CSV
                fs.writeFileSync(csvFile, csv);
            });
        });
    });

}

// Session Setup
app.use(session({
  
    // It holds the secret key for session
    secret: secret,
  
    // Forces the session to be saved
    // back to the session store
    resave: true,
  
    // Forces a session that is "uninitialized"
    // to be saved to the store
    saveUninitialized: true
}));


app.get('/', (request, response) => {
    console.log("Welcome endpoint called...")
    try {
        console.log("request.session.user:");
        console.log(request.session.user);
        console.log("request.session:");
        console.log(request.session);
        
      if (request.session.user) {
        console.log("we have username is: ", request.session.user);
        response.send(`
          <h1>Welcome, ${request.session.user}!</h1>
          <form action="/logout" method="post">
            <button type="submit">Logout</button>
          </form>
        `);
      } else {
        console.log("we dont have username");
        response.send(`
          <h1>Welcome, Guest!</h1>
          <form action="/login" method="post">
            <input type="text" name="username" placeholder="Enter username">
            <button type="submit">Login</button>
          </form>
        `);
      }
    } catch (error) {
      console.error(error);
      response.send(`
        <h1>An error occurred</h1>
        <p>${error.message}</p>
      `);
    }
  });  

app.post('/login', (request, response) => {
    console.log("login endpoint called")
    try {
        request.session.user = "jeffttttt";//request.body.username;
        console.log("request.body:");
        console.log(request.body);
        console.log("request.session.user:");
        console.log(request.session.user);
        response.redirect('/');
    } catch (err) {
        console.error(err);
        response.status(500).send('An error occurred while logging in');
    }
}); 

app.post('/logout', (request, response) => {
    try {
        request.session.destroy();
        response.redirect('/');
    } catch (err) {
        console.error(err);
        response.status(500).send('An error occurred while logging out');
    }
});
console.log(serverPort_3000);
console.log(`Servidor iniciado em http://${serverHost}:${serverPort_3000}`);
app.listen(serverPort_3000, () => console.log('Server running on port: ' + serverPort_3000));

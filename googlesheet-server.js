const config = require('config');
const serverConfig = config.get('server');

const express = require("express");
const req = require("express/lib/request");
const { google } = require("googleapis");
const cors = require("cors");
const moment = require("moment");
const fs = require("fs");
const { get } = require('config');

const serverHost = serverConfig.host;
const serverPort_3001 = serverConfig.port_3001;

const app = express();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(cors());// evita erros de politica CORS

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

var message = '';

function writeLog(message) {
  message = `${moment().format("DD/MM/YYYY HH:mm:ss")} ${message}`;
  fs.appendFile("logs.txt", `${message}\n`, (err) => {
    if (err) throw err;
  });
}

async function getAuthSheets() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "credentials.json",
      scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    const client = await auth.getClient();

    const googleSheets = google.sheets({
      version: "v4",
      auth: client,
    });

    const spreadsheetId = "1YmbdxLa_NMwN_7KK10ZX8kD7LFhfA-p1kyoqzEnM-Bk";

    console.log("Credentials and client obtained successfully.");
    writeLog("Credentials and client obtained successfully.");

    return {
      auth,
      client,
      googleSheets,
      spreadsheetId,
    };
  } catch (error) {
    console.log("Error obtaining credentials and client: ${ error }");
    writeLog("Error obtaining credentials and client: ${ error }");
    return null;
  }
}


app.get("/metadata", async (req, res) => {
  const { googleSheets, auth, spreadsheetId } = await getAuthSheets();
  if (!googleSheets || !auth || !spreadsheetId) {
    writeLog("Error obtaining credentials and client");
    return res.status(500).send("Error obtaining credentials and client");
  }
  try {
    const metadata = await googleSheets.spreadsheets.get({
      auth,
      spreadsheetId,
    });

    console.log("Metadata obtained successfully:", metadata.data);
    writeLog("Metadata obtained successfully:");

    res.send(metadata.data);
  } catch (error) {
    console.log("Error obtaining metadata: ${ error }");
    writeLog("Error obtaining metadata: ${ error }");
    res.status(500).send("Error obtaining metadata");
  }
});

app.get("/getRows", async (req, res) => {
  const { googleSheets, auth, spreadsheetId } = await getAuthSheets();
  if (!googleSheets || !auth || !spreadsheetId) {
    writeLog("Error obtaining credentials and client");
    return res.status(500).send("Error obtaining credentials and client");
  }

  try {
    const getRows = await googleSheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: "users",
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "FORMATTED_STRING",
    });
    console.log("Rows obtained successfully:", getRows.data);
    writeLog("Rows obtained successfully:" + getRows.data);
    res.send(getRows.data);
  } catch (error) {
    console.log("Error obtaining rows: ${ error }");
    writeLog("Error obtaining rows: ${ error }");
    res.status(500).send("Error obtaining rows");
  }
});

app.post("/addRow", async (req, res) => {
  try {
    const { googleSheets, auth, spreadsheetId } = await getAuthSheets();
    console.log("Google Sheets and Auth: ")//, googleSheets, auth);
    const { email, password } = req.body;

    //const currentDateTime = moment().format("YYYY-MM-DD HH:mm:ss");

    //const { values } = req.body;
    const { values } = JSON.stringify([[email, password, '1']]);

    console.log("Values req.body: ", req.body);
    console.log("Values values: ", values);

    const row = await googleSheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: "users",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: values,
      },
    });

    console.log("Data returned: ", row.data);

    res.send(row.data);
  } catch (error) {
    //console.error("Error adding row: ", error);
    res.status(500).send({ error: "Error adding row to spreadsheet" });
  }
});

app.post("/updateValue", async (req, res) => {
  try {
    const { googleSheets, auth, spreadsheetId } = await getAuthSheets();
    console.log("Dados recebidos:", req.body);
    const { values } = req.body;

    const updateValue = await googleSheets.spreadsheets.values.update({
      spreadsheetId,
      range: "users!A2:C2",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: values,
      },
    });

    console.log("Dados retornados:", updateValue.data);
    res.send(updateValue.data);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.get("/getRowByEmail/:email", async (req, res) => {
  try {
    const { email } = req.params;
    console.log("Email recebido:", email);
    const { googleSheets, auth, spreadsheetId } = await getAuthSheets();
    const getRows = await googleSheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: "users",
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "FORMATTED_STRING",
    });

    const filteredRows = getRows.data.values.filter((row) => row[0] == email);
    console.log("Linhas retornadas:", filteredRows);
    res.send(filteredRows);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.get("/getRowById/:id", async (req, res) => {
  const { id } = req.params;
  const { googleSheets, auth, spreadsheetId } = await getAuthSheets();

  const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: "users",
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });

  const filteredRows = getRows.data.values.filter((row) => row[0] == id);

  res.send(filteredRows);
});

app.get("/getRowByEmailPsw/:email/:password", async (req, res) => {
  const { email, password } = req.params;
  const { googleSheets, auth, spreadsheetId } = await getAuthSheets();

  const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: "users",
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });

  const filteredRows = getRows.data.values.filter((row) => row[0] == email && row[1] == password);

  res.send(filteredRows);
});

app.post("/login", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const { googleSheets, auth, spreadsheetId } = await getAuthSheets();
    console.log(`Dados recebidos: email = ${email} password = ${password}`);

    const getRows = await googleSheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: "users",
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "FORMATTED_STRING",
    });

    console.log(`Resultado da busca na planilha: ${JSON.stringify(getRows.data)}`);
    //writeLog(`Resultado da busca na planilha: ${JSON.stringify(getRows.data)}`);

    const filteredRows = getRows.data.values.filter((row) => row[0] == email && row[1] == password);

    console.log(`Linhas filtradas: ${JSON.stringify(filteredRows)}`);

    res.status(200).send(filteredRows);

  } catch (error) {
    console.error("Erro ao realizar login: ${ error }");
    res.send(error);
  }
});



app.listen(serverPort_3001, () => console.log("Rodando na porta: ", serverPort_3001));
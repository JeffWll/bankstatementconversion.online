const { GoogleSpreadsheet } = require("google-spreadsheet");

const sheetID = '1O8sZDBd8bT3RyTyK2zFvUedhjx7PxfJoXqr-3AN3FuA';
const clientmail = "conta01servico@api-p-375220.iam.gserviceaccount.com";
const privatekey = "AIzaSyCLwuvAT3_VTdPrTeTzO1l0NpWWCfoqUdQ";
const doc = new GoogleSpreadsheet(sheetID);

const express = require("express");
//nomconst { addUser, login } = require("./google-sheets");

const cors = require("cors");
//app.use(cors({ origin: "http://localhost:5500" }));// serve para limitar as origens que podem chamar a API

const app = express();

app.use(cors());

async function addUser(email, password) {
  await doc.useServiceAccountAuth({
    client_email: clientmail,
    private_key: privatekey,
  });

  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  await sheet.addRow({ email, password });
}

async function login(email, password) {
  console.log("vai validar...");
  await doc.useServiceAccountAuth({
    client_email: clientmail,
    private_key: privatekey,
});
console.log("validou!!")
await doc.loadInfo();
const sheet = doc.sheetsByIndex[0];
const rows = await sheet.getRows();
console.log("carregou")

for (const row of rows) {
  if (row.email === email && row.password === password) {
    return true;
  }
}

return false;
}

app.use(express.json());

app.post("/cadastro", async (req, res) => {
  const { email, password } = req.body;
  try {
    await addUser(email, password);
    res.status(200).send({ message: "Usuário cadastrado com sucesso!" });
  } catch (error) {
    res.status(500).send({ message: "Erro ao cadastrar usuário." });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await login(email, password);
    if (result) {
      res.status(200).send({ message: "Login realizado com sucesso!" });
    } else {
      res.status(401).send({ message: "Email ou senha incorretos." });
    }
  } catch (error) {
    res.status(500).send({ message: "Erro ao realizar login." });
  }
});

app.listen(3000, () => {
  console.log("Servidor iniciado na porta 3000");
});


module.exports = { addUser, login };

login("jeff@gmail.com", "asdasdasd");
const express = require('express'); // Importação do Express 
const app = express(); // Inicialização do Express
const path = require('path'); // Importação do Path 
const port = process.env.PORT || 9000; // Porta do Servidor 
const session = require('express-session'); // Importação do Express Session
const Routers = require('./routers/routers'); // Importação das Rotas


app.use(session({
    secret: '84220084',
    resave: false,
    saveUninitialized: true,
})); // Middleware para o uso de sessões no Express

app.use(express.urlencoded({ extended: true })); // Middleware para o uso de URL Encoded
app.use(express.json()); // Middleware para o uso de JSON

app.set('view engine', 'ejs'); // Engine de views EJS (Embedded JavaScript) 
app.set('views', path.join(__dirname, 'views')); // Views EJS

app.use(express.static(path.join(__dirname, 'HTML'))); // Arquivos estáticos

app.use(Routers); // Rotas

app.listen(port, (error) => {
    if (error) {
        console.log('O Servidor não está online, erro: ', error);
        return;
    }
    console.log('O servidor está rodando na porta local: ' + port);
}); // Inicialização do Servidor Express na porta 9000 com mensagem de erro ou sucesso

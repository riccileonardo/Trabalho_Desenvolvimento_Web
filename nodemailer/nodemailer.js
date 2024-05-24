const nodemailer = require('nodemailer'); // Importa o módulo nodemailer

const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com', // Servidor SMTP do Yahoo
    port: 587, // Porta padrão para SMTP
    secure: false, // Define se a conexão é segura (SSL/TLS)
    auth: {
        user: 'chavemestra211@hotmail.com', 
        pass: 'chavemestra2024'
    },
});

module.exports = transporter; // Exporta o objeto de transporte.
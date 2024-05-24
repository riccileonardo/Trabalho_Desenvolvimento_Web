// Importa o módulo 'mysql' para utilizar suas funcionalidades de conexão com o banco de dados.
const mysql = require('mysql');

// Cria uma conexão com o banco de dados MySQL, especificando os detalhes da banco de dados.
const conexao = mysql.createConnection({
  host: 'localhost',   // Endereço do servidor MySQL
  port: 3306,          // Porta de conexão com o servidor MySQL
  user: 'root',        // Nome de usuário para autenticação no MySQL
  password: '1234',    // Senha do usuário para autenticação no MySQL
  database: 'chavemestra' // Nome do banco de dados que será usado
});

//A função de callback é acionada quando a conexão é bem-sucedida ou ocorre um erro.
conexao.connect((err) => {
  if (err) {
    // Se ocorrer um erro durante a conexão, uma mensagem de erro é exibida no console.
    console.error('Erro na conexão com o banco de dados:', err);
  } else {
    // Se a conexão for bem-sucedida, uma mensagem de sucesso é exibida no console.
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
  }
});

// Exporta o objeto de conexão para que ele possa ser usado em outros módulos ou partes do aplicativo.
module.exports = conexao;

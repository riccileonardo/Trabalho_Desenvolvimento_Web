const express = require('express'); // Importe o módulo express
const conexao = require('../db/conexao'); // Importe o módulo de conexão com o banco de dados
const { Router } = express; // Importe o Router do express
const router = Router(); // Cria um objeto de roteamento
const path = require('path'); // Importe o módulo de caminho do Node.js
const bcrypt = require('bcrypt'); // Importe o módulo de criptografia de senha.
const transporter = require('../nodemailer/nodemailer'); // Importe o módulo nodemailer para enviar emails.
const { OAuth2Client } = require('google-auth-library'); // Importe o módulo google-auth-library para autenticação com o Google.
const client = new OAuth2Client('511020543256-t574uniqurqe3tjjvm0sigj7ka2oue4n.apps.googleusercontent.com'); // Crie um novo cliente OAuth2 para autenticação com o Google.

// Configura os diretórios estáticos para servir arquivos CSS, JS e HTML
router.use('/static', express.static(path.join(__dirname, '/../static')));
// Variável global para armazenar o código gerado para envio por email.
let codigoGerado;
//Variável global para armazenar o id do usuário logado na sessão.
let idUsuario;

// Rota padrão.
router.get('/', (req, res) => {
    res.redirect('/home');
});

// Rota para a página "home".
router.get('/home', (req, res) => {
    let indexPath = path.join(__dirname, "/../static/html/home/home.html"); // Define o caminho do arquivo HTML home.
    res.sendFile(indexPath); // Envia o arquivo HTML.
});

// Rota para carregar a página de login.
router.get("/Login", (req, res) => {
    let indexPath = path.join(__dirname, "/../static/html/signin/Signin.html"); // Define o caminho do arquivo HTML.
    res.sendFile(indexPath); // Envia o arquivo HTML.
});

// Rota para verificar as credenciais do usuário.
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT id, nome, senha_criptografada FROM usuarios WHERE nome = ?';
    conexao.query(query, [username], async (error, results) => {
        if (error) {
            console.error('Erro durante a consulta ao banco de dados:', error);
            res.json({ success: false, message: 'Erro interno durante a autenticação' });
        } else {
            if (results.length > 0) {
                const usuario = results[0];
                const match = await bcrypt.compare(password, usuario.senha_criptografada);

                if (match) {
                    req.session.logado = true;
                    req.session.idUsuario = usuario.id; // Armazenando o ID do usuário na sessão.
                    console.log(`O id referente ao usuário logado é: ${req.session.idUsuario}`); // Exibindo o ID do usuário logado no console.
                    res.json({ success: true, redirect: '/dado' });
                } else {
                    res.json({ success: false, message: 'Credenciais inválidas' });
                }
            } else {
                res.json({ success: false, message: 'Credenciais inválidas' });
                console.log('\nCredenciais inválidas, tente novamente.');
            }
        }
    });
});

// Rota para fazer login com o Google
router.post('/google-login', async (req, res) => {
    const { idToken } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: '511020543256-t574uniqurqe3tjjvm0sigj7ka2oue4n.apps.googleusercontent.com',  // Substitua pelo seu CLIENT_ID
        });
        const payload = ticket.getPayload();
        const googleId = payload['sub']; // ID único do usuário no Google
        const email = payload['email'];
        const name = payload['name'];
        const picture = payload['picture'];

        // Verifique se o usuário já existe na tabela usuarios
        const query = 'SELECT id FROM usuarios WHERE email = ?';
        conexao.query(query, [email], (error, results) => {
            if (error) {
                console.error('Erro durante a consulta ao banco de dados:', error);
                res.json({ success: false, message: 'Erro interno durante a autenticação' });
            } else {
                if (results.length > 0) {
                    // Usuário existe, autentique-o
                    const usuario = results[0];
                    req.session.logado = true;
                    req.session.idUsuario = usuario.id;
                    res.json({ success: true, redirect: '/dado' });
                } else {
                    // RRegistre o usuário na tabela google_users.
                    const insertQueryGoogleUsers = 'INSERT INTO google_users (google_id, email, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)';
                    conexao.query(insertQueryGoogleUsers, [googleId, email], (errorGoogleUsers, resultsGoogleUsersInsert) => {
                        if (errorGoogleUsers) {
                            console.error('Erro ao criar novo usuário do Google:', errorGoogleUsers);
                            res.json({ success: false, message: 'Erro ao criar novo usuário do Google' });
                        } else {
                            // Criação do usuário na tabela usuarios para permitir o login.
                            const senhaCriptografada = 'usuário cadastrado por conta google';
                            const insertQueryUsuarios = 'INSERT INTO usuarios (nome, email, senha_criptografada) VALUES (?, ?, ?)';
                            conexao.query(insertQueryUsuarios, [name, email, senhaCriptografada], (errorUsuarios, resultsUsuariosInsert) => {
                                if (errorUsuarios) {
                                    console.error('Erro ao criar novo usuário:', errorUsuarios);
                                    res.json({ success: false, message: 'Erro ao criar novo usuário' });
                                } else {
                                    req.session.logado = true;
                                    req.session.idUsuario = resultsUsuariosInsert.insertId;
                                    res.json({ success: true, redirect: '/dado' });
                                }
                            });
                        }
                    });
                }
            }
        });
    } catch (error) {
        console.error('Erro ao verificar o token de ID do Google:', error);
        res.json({ success: false, message: 'Erro ao verificar o token de ID do Google' });
    }
});

// Rota para buscar dados do banco de dados.
router.get('/dado', (req, res) => {
    if (!req.session.logado || !req.session.idUsuario) {
        // Se o usuário não estiver logado ou não houver ID de usuário na sessão, redirecione para a página de login.
        res.redirect('/Login');
        return;
    }
    // Execute uma consulta SQL para buscar os dados do banco de dados
    conexao.query('SELECT * FROM senhas WHERE usuario_id = ?', [req.session.idUsuario], (error, results) => {
        if (error) {
            console.error('Erro na consulta ao banco de dados:', error);
            res.status(500).send('Erro na consulta ao banco de dados: ' + error.message);
        } else {
            //Se a consulta for bem-sucedida, armazene os resultados em uma variável de sessão
            req.session.senhas = results;
            console.log('\nDados da variável de sessão:', req.session.senhas);
            // Em seguida, redirecione para a rota /sistema
            res.redirect('/app');
        }
    });
});

// Rota para página protegida que requer login
router.get('/app', (req, res) => {
    if (!req.session.logado) {
        // Se o usuário não estiver logado, redirecione para a página de login.
        res.redirect('/Login');
        return;
    }
    let indexPath = path.join(__dirname, "/../static/html/app/app.html"); // Define o caminho do arquivo HTML.
    res.sendFile(indexPath); // Envia o arquivo HTML.
});

// Rota para carregar a página de cadastro.
router.get('/cadastro', (req, res) => {
    let indexPath = path.join(__dirname, '/../static/html/signup/signup.html'); // Define o caminho do arquivo HTML de cadastro.
    res.sendFile(indexPath); // Envia o arquivo HTML.
});

// Rota para cadastrar um novo usuário
router.post('/cadastrar', (req, res) => {
    const { nome, email, senha } = req.body;

    // Verifique se todos os campos necessários foram fornecidos
    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Por favor, preencha todos os campos.' });
    }

    const saltRounds = 10;

    // Gerar o hash da senha usando bcrypt
    bcrypt.hash(senha, saltRounds, (err, hash) => {
        if (err) {
            console.error('Erro ao gerar hash criptografado:', err);
            return res.status(500).json({ error: 'Erro interno ao cadastrar usuário.' });
        }

        // Agora você pode inserir os dados no banco de dados usando o objeto 'conexao'
        const query = 'INSERT INTO usuarios (nome, email, senha_criptografada) VALUES (?, ?, ?)';
        conexao.query(query, [nome, email, hash], (error, results) => {
            if (error) {
                console.error('Erro ao cadastrar usuário:', error);
                return res.status(500).json({ error: 'Erro interno ao cadastrar usuário.' });
            }

            console.log('Usuário cadastrado com sucesso:', results);

            // Envie uma resposta de sucesso
            res.status(201).json({ success: true, message: 'Usuário cadastrado com sucesso.' });
        });
    });
});

// Rota para carregar a página de recuperação de senha
router.get('/recover', (req, res) => {
    const indexPath = path.join(__dirname, '/../static/html/recover/recover.html');
    res.sendFile(indexPath);
});

// Rota para enviar o código de recuperação por email
router.post('/enviar-codigo', (req, res) => {
    const { email } = req.body;

    // Verifique se o email foi fornecido
    if (!email) {
        return res.status(400).json({ error: 'Por favor, forneça um email válido.' });
    }

    // Gere um código aleatório
    codigoGerado = Math.floor(100000 + Math.random() * 900000).toString();

    // Corpo do email
    const mailOptions = {
        from: 'chavemestra211@hotmail.com',
        to: email,
        subject: 'Código de Recuperação de Senha',
        text: `Seu código de recuperação de senha é: ${codigoGerado}`
    };

    // Envie o email com o código usando o transporter
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Erro ao enviar email:', error);
            return res.status(500).json({ error: 'Erro interno ao enviar código de recuperação.' });
        }
        console.log('Email enviado:', info.response);
        res.status(200).json({ success: true, message: 'Código de recuperação enviado com sucesso.' });
        console.log('Código de recuperação enviado com sucesso.');
    });
});

// Rota para verificar o código digitado na modal
router.post('/verificar-codigo', (req, res) => {
    const { codigoDigitado } = req.body;

    // Verifique se o código digitado é igual ao código gerado
    if (codigoDigitado === codigoGerado) {
        res.status(200).json({ success: true, message: 'Código válido.' });
        console.log('Código válido.');
    } else {
        res.status(400).json({ error: 'Código inválido.' });
    }
});

// Rota para atualizar a senha
router.post('/atualizar-senha', (req, res) => {
    const { email, novaSenha } = req.body;

    // Verifique se todos os campos necessários foram fornecidos
    if (!email || !novaSenha) {
        return res.status(400).json({ error: 'Por favor, forneça o email e a nova senha.' });
    }

    // Consulta SQL para buscar o usuário pelo email
    const querySelect = 'SELECT id, senha_criptografada FROM usuarios WHERE email = ?';

    conexao.query(querySelect, [email], (error, results) => {
        if (error) {
            console.error('Erro ao buscar usuário:', error);
            return res.status(500).json({ error: 'Erro interno ao buscar usuário.' });
        }

        // Verifique se o usuário foi encontrado
        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        // Pegue o ID do usuário e a senha criptografada do resultado da consulta
        const { id, senha_criptografada } = results[0];

        // Verifique se a nova senha é diferente da senha atual
        if (bcrypt.compareSync(novaSenha, senha_criptografada)) {
            return res.status(400).json({ error: 'A nova senha não pode ser igual à senha atual.' });
        }

        // Gerar o hash da nova senha usando bcrypt
        const saltRounds = 10;
        bcrypt.hash(novaSenha, saltRounds, (err, hash) => {
            if (err) {
                console.error('Erro ao gerar hash criptografado:', err);
                return res.status(500).json({ error: 'Erro interno ao atualizar senha.' });
            }

            // Consulta SQL para atualizar a senha no banco de dados
            const queryUpdate = 'UPDATE usuarios SET senha_criptografada = ? WHERE id = ?';
            conexao.query(queryUpdate, [hash, id], (updateError) => {
                if (updateError) {
                    console.error('Erro ao atualizar senha:', updateError);
                    return res.status(500).json({ error: 'Erro interno ao atualizar senha.' });
                }

                console.log('Senha atualizada com sucesso.');

                // Envie uma resposta de sucesso
                res.status(200).json({ success: true, message: 'Senha atualizada com sucesso.' });
            });
        });
    });
});

// Rota para salvar uma senha no banco de dados.
router.post('/api/senhas', (req, res) => {
    const { recurso, usuario, senha, link } = req.body;
    const idusuario = req.session.idUsuario; // Obtenha o ID do usuário da sessão.

    //linha para mostrar o objeto json que foi recebido pelo front-end junto com o id do usuário logado no terminal.
    console.log('\nObjeto JSON recebido:', req.body, '\nID do usuário logado:', idusuario);
    // Verifica se todos os campos necessários foram fornecidos
    if (!recurso || !usuario || !senha || !link || !idusuario) {
        return res.status(400).json({ error: 'Por favor, preencha todos os campos.' });
    }

    // Agora você pode inserir os dados no banco de dados usando o objeto 'conexao'
    const query = 'INSERT INTO senhas (usuario_id, recurso, usuario, senha, link) VALUES (?, ?, ?, ?, ?)';
    conexao.query(query, [idusuario, recurso, usuario, senha, link], (error, results) => {
        if (error) {
            console.error('Erro ao salvar senha:', error);
            return res.status(500).json({ error: 'Erro interno ao salvar senha. Por favor, tente novamente mais tarde.' });
        }

        if (results.affectedRows === 0) {
            // Nenhuma linha foi afetada ao inserir, o que indica um problema
            console.error('Erro ao salvar senha:', results);
            return res.status(500).json({ error: 'Erro ao salvar senha. Por favor, tente novamente mais tarde.' });
        }

        console.log('Senha salva com sucesso:', results);

        // Envie uma resposta de sucesso
        res.status(201).json({ success: true, message: 'Senha salva com sucesso.' });
    });
});

// Rota para buscar dados do usuario na variável de sessão.
router.get('/get-senhas-data', (req, res) => {
    const dados = req.session.senhas || []; // Se a variável de sessão não existir, defina-a como uma matriz vazia.
    res.json({ results: dados }); // Envie os dados da variável de sessão como resposta.
});

// Rota para buscar o id referente a linha na senha.
router.get('/api/senhas/:id', (req, res) => {
    const id = req.params.id; // Obtenha o ID da senha a ser buscada.

    const query = 'SELECT * FROM senhas WHERE id = ?'; // Execute uma consulta SQL para buscar a senha no banco de dados.

    conexao.query(query, [id], (error, results) => {
        if (error) {
            console.error('Erro ao buscar dados:', error);
            res.status(500).json({ message: 'Erro ao buscar dados' });
        } else {
            if (results.length > 0) {
                const senha = results[0]; // Obtenha a senha da lista de resultados.
                res.json({ senha }); // Envie a senha como resposta.
            } else {
                res.status(404).json({ message: 'Dados não encontrada' }); // Envie uma mensagem de erro como resposta.
            }
        }
    });
});

// Rota para editar uma linha no banco de dados.
router.put('/api/senhas/:id', (req, res) => {
    const senhaId = req.params.id; // Obtenha o ID da senha a ser editada.
    const dadosDoFormulario = req.body; // Obtenha os dados do formulário.

    // Validação básica dos dados do formulário
    if (!dadosDoFormulario.recurso || !dadosDoFormulario.usuario || !dadosDoFormulario.link) {
        return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios' });
    }

    const query = 'UPDATE senhas SET ? WHERE id = ?'; // Consulta SQL para atualizar a senha no banco de dados.

    // Execute a consulta de atualização.
    conexao.query(query, [dadosDoFormulario, senhaId], (error, results) => {
        if (error) {
            console.error('\nErro ao editar dados:', error);
            res.status(500).json({ success: false, message: 'Erro ao editar dados' });
        } else {
            if (results.affectedRows === 0) {
                // Caso a senha não seja encontrada pelo ID.
                res.status(404).json({ success: false, message: 'Senha não encontrada' });
            } else {
                console.log('\nSenha editada com sucesso'); // Mensagem de sucesso.
                res.status(200).json({ success: true, message: 'Dados atualizados com sucesso', data: dadosDoFormulario }); // Envie os dados atualizados como resposta.
            }
        }
    });
});

// Rota para deletar uma senha pelo ID
router.delete('/api/senhas/:id', (req, res) => {
    const senhaId = req.params.id;
    const idusuario = req.session.idUsuario; // Obtenha o ID do usuário da sessão

    // Verifique se o ID da senha e o ID do usuário estão presentes
    if (!senhaId || !idusuario) {
        return res.status(400).json({ error: 'ID da senha ou ID do usuário ausentes.' });
    }

    // Aqui você pode adicionar a lógica para deletar a senha do banco de dados usando o objeto 'conexao'
    const query = 'DELETE FROM senhas WHERE id = ? AND usuario_id = ?';
    conexao.query(query, [senhaId, idusuario], (error, results) => {
        if (error) {
            console.error('Erro ao deletar senha:', error);
            return res.status(500).json({ error: 'Erro interno ao deletar senha. Por favor, tente novamente mais tarde.' });
        }

        if (results.affectedRows === 0) {
            // Nenhuma linha foi afetada ao deletar, o que indica um problema (por exemplo, a senha não existe ou não pertence ao usuário)
            console.error('Erro ao deletar senha:', results);
            return res.status(404).json({ error: 'Senha não encontrada ou não autorizada para deleção.' });
        }

        console.log('Senha deletada com sucesso:', results);

        // Envie uma resposta de sucesso
        res.status(200).json({ success: true, message: 'Senha deletada com sucesso.' });
    });
});

// Rota para sair do sistema.
router.get('/logout', (req, res) => {
    // Limpar a sessão (se estiver usando sessões)
    req.session.destroy(err => {
        if (err) {
            console.error('Erro ao encerrar sessão:', err);
        }
        // Redirecionar para a página inicial
        res.redirect('/home');
    });
});

module.exports = router; // Exporta o objeto de roteamento.
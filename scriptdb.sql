-- Criando o banco de dados chavemestra
CREATE DATABASE IF NOT EXISTS chavemestra;

USE chavemestra;

-- Restante do seu script SQL aqui
DROP TABLE IF EXISTS `google_users`;
CREATE TABLE `google_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `google_id` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `google_id` (`google_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `google_users` VALUES 
(3,'113439931121184651789','oliveiramoraes230@gmail.com',NULL,'2024-05-21 20:45:16');


DROP TABLE IF EXISTS `senhas`;
CREATE TABLE `senhas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `usuario` varchar(255) NOT NULL,
  `recurso` varchar(255) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `link` varchar(255) NOT NULL,
  `modificado` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `senhas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `senha_criptografada` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `usuarios` VALUES 
(1,'alex','oliveiramoraes230@gmail.com','$2b$10$SM77K6SpAD6ZNXsEoTRuNuFI4Rl2hqMMbT/OilrLzM0v3.1OqaaKW'),
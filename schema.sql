CREATE TABLE `chats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `is_group` tinyint DEFAULT NULL,
  `name` varchar(255) COLLATE utf16_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf16 COLLATE=utf16_unicode_ci

CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `chatId` int DEFAULT NULL,
  `senderId` int DEFAULT NULL,
  `text` varchar(1000) COLLATE utf16_unicode_ci DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf16 COLLATE=utf16_unicode_ci;

CREATE TABLE `participants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `chatId` int DEFAULT NULL,
  `userId` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf16 COLLATE=utf16_unicode_ci;

CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `login` varchar(255) COLLATE utf16_unicode_ci DEFAULT NULL,
  `firstName` varchar(255) COLLATE utf16_unicode_ci DEFAULT NULL,
  `lastName` varchar(255) COLLATE utf16_unicode_ci DEFAULT NULL,
  `passwordHash` varchar(255) COLLATE utf16_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf16 COLLATE=utf16_unicode_ci;
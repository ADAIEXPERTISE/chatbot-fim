-- Adminer 5.4.2 MariaDB 10.11.14-MariaDB-0ubuntu0.24.04.1 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

CREATE TABLE `category_faq` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_category_faq_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `event` (
  `event_id` varchar(15) NOT NULL,
  `event_date` date NOT NULL,
  `day_label` enum('Jeudi','Vendredi','Samedi','Dimanche') NOT NULL,
  `event_type` enum('Conférence','Table ronde','Atelier','Speed recruiting','Workshop ADAI') NOT NULL,
  `title` varchar(255) DEFAULT NULL COMMENT 'NULL si event_type = Speed recruiting',
  `venue_id` varchar(30) DEFAULT NULL COMMENT 'Identifiant salle (texte libre)',
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `organizer_or_brand` varchar(100) DEFAULT NULL,
  `target_audience` text DEFAULT NULL,
  `status` enum('confirmé_capture','a_valider_fim','annulé') NOT NULL DEFAULT 'confirmé_capture',
  `source` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `recrutement_id` int(10) unsigned DEFAULT NULL COMMENT 'NULL sauf si event_type = Speed recruiting',
  PRIMARY KEY (`event_id`),
  KEY `idx_event_date` (`event_date`),
  KEY `idx_event_type` (`event_type`),
  KEY `idx_event_day` (`day_label`),
  KEY `idx_event_status` (`status`),
  KEY `idx_event_time` (`start_time`),
  KEY `fk_event_venue` (`venue_id`),
  KEY `fk_event_recrutement` (`recrutement_id`),
  CONSTRAINT `fk_event_recrutement` FOREIGN KEY (`recrutement_id`) REFERENCES `recrutement` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_event_venue` FOREIGN KEY (`venue_id`) REFERENCES `venue` (`venue_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `exhibitor` (
  `exhibitor_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `exhibitor_name` varchar(300) NOT NULL,
  `subcategory_id` int(10) unsigned DEFAULT NULL,
  `exhibitor_type` enum('b2b','b2c','b2b/b2c') NOT NULL DEFAULT 'b2b/b2c',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`exhibitor_id`),
  KEY `idx_exhibitor_subcategory` (`subcategory_id`),
  CONSTRAINT `fk_exhibitor_subcategory` FOREIGN KEY (`subcategory_id`) REFERENCES `subcategory` (`subcategory_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=192 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Exposants FIM — à remplir depuis stands_seed ou import manuel';


CREATE TABLE `exhibitor_keyword` (
  `exhibitor_id` int(10) unsigned NOT NULL,
  `keyword_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`exhibitor_id`,`keyword_id`),
  KEY `idx_ek_keyword` (`keyword_id`),
  CONSTRAINT `fk_ek_exhibitor` FOREIGN KEY (`exhibitor_id`) REFERENCES `exhibitor` (`exhibitor_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ek_keyword` FOREIGN KEY (`keyword_id`) REFERENCES `keyword` (`keyword_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Liaison many-to-one : plusieurs keywords par exposant';


CREATE TABLE `faq` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `faq_ref` varchar(20) NOT NULL COMMENT 'Référence interne (ex: FAQ-001)',
  `audience` enum('visiteur','exposant') NOT NULL DEFAULT 'visiteur',
  `category_id` int(10) unsigned NOT NULL,
  `question` text NOT NULL,
  `response` text NOT NULL,
  `keywords` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_faq_ref` (`faq_ref`),
  KEY `fk_faq_category` (`category_id`),
  CONSTRAINT `fk_faq_category` FOREIGN KEY (`category_id`) REFERENCES `category_faq` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `keyword` (
  `keyword_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `keyword_name` varchar(100) NOT NULL,
  PRIMARY KEY (`keyword_id`),
  UNIQUE KEY `uq_keyword_name` (`keyword_name`),
  FULLTEXT KEY `idx_ft_keyword` (`keyword_name`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mots-clés associés aux exposants pour la recherche chatbot';


CREATE TABLE `question` (
  `question_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `question` varchar(255) NOT NULL,
  `type` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `depends_on_question_id` int(10) unsigned DEFAULT NULL,
  `depends_on_response` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`question_id`),
  KEY `idx_question_type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Questions du formulaire de satisfaction visiteur';


CREATE TABLE `question_type` (
  `type_id` varchar(20) NOT NULL COMMENT 'ex: choice, text, rating, scale',
  `label` varchar(50) NOT NULL,
  PRIMARY KEY (`type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Types de questions du formulaire de satisfaction';


CREATE TABLE `recrutement` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `organisateur` varchar(150) NOT NULL,
  `org_email` varchar(150) DEFAULT NULL,
  `org_tel` varchar(30) DEFAULT NULL,
  `offres` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `response` (
  `response_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `visitor_id` varchar(36) DEFAULT NULL COMMENT 'NULL = réponse anonyme',
  `question_id` int(10) unsigned NOT NULL,
  `response` text NOT NULL COMMENT 'Valeur libre ou code du choice',
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`response_id`),
  KEY `idx_resp_visitor` (`visitor_id`),
  KEY `idx_resp_question` (`question_id`),
  CONSTRAINT `fk_resp_question` FOREIGN KEY (`question_id`) REFERENCES `question` (`question_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_resp_visitor` FOREIGN KEY (`visitor_id`) REFERENCES `visitor` (`visitor_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=336 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Réponses des visiteurs aux questions de satisfaction';


CREATE TABLE `response_choice` (
  `choice_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `question_id` int(10) unsigned NOT NULL,
  `response` varchar(100) NOT NULL,
  PRIMARY KEY (`choice_id`),
  KEY `idx_rc_question` (`question_id`),
  CONSTRAINT `fk_rc_question` FOREIGN KEY (`question_id`) REFERENCES `question` (`question_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Choix prédéfinis pour les questions de type choice';


CREATE TABLE `sectors` (
  `sector_id` varchar(30) NOT NULL,
  `sector_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `chatbot_keyword` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`sector_id`),
  FULLTEXT KEY `idx_ft_sector` (`sector_name`,`chatbot_keyword`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `stands` (
  `stand_code` varchar(50) NOT NULL,
  `exhibitor_id` int(10) unsigned DEFAULT NULL,
  `zone_id` int(10) unsigned DEFAULT NULL COMMENT 'FK vers zone',
  `pos_x` float DEFAULT NULL,
  `pos_y` float DEFAULT NULL,
  `status` enum('confirmed','pending','cancelled') NOT NULL DEFAULT 'confirmed',
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`stand_code`),
  KEY `idx_stand_exhibitor` (`exhibitor_id`),
  KEY `idx_stand_zone` (`zone_id`),
  CONSTRAINT `fk_stand_exhibitor` FOREIGN KEY (`exhibitor_id`) REFERENCES `exhibitor` (`exhibitor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_stand_zone` FOREIGN KEY (`zone_id`) REFERENCES `zone` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Plan de masse FIM — associe chaque stand à un exposant et une zone';


CREATE TABLE `subcategory` (
  `subcategory_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `subcategory_name` varchar(100) NOT NULL,
  `sector_id` varchar(30) DEFAULT NULL COMMENT 'Secteur parent optionnel',
  PRIMARY KEY (`subcategory_id`),
  UNIQUE KEY `uq_subcategory_name` (`subcategory_name`),
  KEY `fk_subcategory_sector` (`sector_id`),
  CONSTRAINT `fk_subcategory_sector` FOREIGN KEY (`sector_id`) REFERENCES `sectors` (`sector_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sous-catégories d''exposants';


CREATE TABLE `summary_by_day` (`day_label` enum('Jeudi','Vendredi','Samedi','Dimanche'), `count_total` bigint(21), `count_conference` decimal(23,0), `count_table_ronde` decimal(23,0), `count_atelier` decimal(23,0), `count_speed` decimal(23,0), `count_adai_workshop` decimal(23,0), `refreshed_at` datetime /* mariadb-5.3 */);


CREATE TABLE `validation_points` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `topic` varchar(150) NOT NULL,
  `current_reading` text DEFAULT NULL,
  `why_it_matters` text DEFAULT NULL,
  `owner` varchar(50) DEFAULT NULL,
  `priority` enum('basse','moyenne','haute','très haute') NOT NULL DEFAULT 'haute',
  `resolved` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_validation_priority` (`priority`),
  KEY `idx_validation_owner` (`owner`),
  KEY `idx_validation_resolved` (`resolved`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `venue` (
  `venue_id` varchar(30) NOT NULL,
  `venue_name` varchar(100) NOT NULL,
  `venue_type` enum('salle_conference','atelier','espace_special') NOT NULL DEFAULT 'salle_conference',
  `capacity` int(10) unsigned DEFAULT NULL COMMENT 'Capacité en personnes (à remplir)',
  PRIMARY KEY (`venue_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Salles de conférence et ateliers FIM26';


CREATE TABLE `visitor` (
  `visitor_id` varchar(36) NOT NULL COMMENT 'UUID v4',
  `display_name` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL COMMENT 'Hash bcrypt du mot de passe (NULL si auth externe/anonyme)',
  `phone` varchar(30) DEFAULT NULL,
  `role` enum('visiteur','exposant','staff','admin') NOT NULL DEFAULT 'visiteur',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`visitor_id`),
  UNIQUE KEY `uq_visitor_email` (`email`),
  KEY `idx_visitor_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Visiteurs et participants enregistrés FIM 2026';


CREATE TABLE `vue_satisfaction` (`id` int(10) unsigned, `visitor_id` varchar(36), `question_id` int(10) unsigned, `response` text, `question` varchar(255), `age` text);


CREATE TABLE `v_exhibitor_info` (`exhibitor_id` int(10) unsigned, `exhibitor_name` varchar(300), `exhibitor_type` enum('b2b','b2c','b2b/b2c'), `subcategory_id` int(10) unsigned, `subcategory_name` varchar(100), `stand_code` varchar(50), `stand_status` enum('confirmed','pending','cancelled'), `pos_x` float, `pos_y` float, `zone_id` int(10) unsigned, `zone_name` varchar(100), `sector_id` varchar(30), `sector_name` varchar(100), `sector_keywords` varchar(255));


CREATE TABLE `v_programme_complet` (`event_id` varchar(15), `event_date` date, `day_label` enum('Jeudi','Vendredi','Samedi','Dimanche'), `event_type` enum('Conférence','Table ronde','Atelier','Speed recruiting','Workshop ADAI'), `title` varchar(255), `venue_id` varchar(30), `venue_name` varchar(100), `venue_type` enum('salle_conference','atelier','espace_special'), `venue_capacity` int(10) unsigned, `start_time` time, `end_time` time, `organizer_or_brand` varchar(100), `target_audience` text, `status` enum('confirmé_capture','a_valider_fim','annulé'), `notes` text);


CREATE TABLE `zone` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `zone_name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_zone_name` (`zone_name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Zones / catégories exposants FIM26';


DROP TABLE IF EXISTS `summary_by_day`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `summary_by_day` AS select `event`.`day_label` AS `day_label`,count(0) AS `count_total`,sum(`event`.`event_type` = 'Conférence') AS `count_conference`,sum(`event`.`event_type` = 'Table ronde') AS `count_table_ronde`,sum(`event`.`event_type` = 'Atelier') AS `count_atelier`,sum(`event`.`event_type` = 'Speed recruiting') AS `count_speed`,sum(`event`.`event_type` = 'Workshop ADAI') AS `count_adai_workshop`,current_timestamp() AS `refreshed_at` from `event` where `event`.`status` <> 'annulé' group by `event`.`day_label` order by field(`event`.`day_label`,'Jeudi','Vendredi','Samedi','Dimanche');

DROP TABLE IF EXISTS `vue_satisfaction`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vue_satisfaction` AS select `r`.`response_id` AS `id`,`r`.`visitor_id` AS `visitor_id`,`r`.`question_id` AS `question_id`,`r`.`response` AS `response`,`q`.`question` AS `question`,`age_r`.`response` AS `age` from ((`response` `r` join `question` `q` on(`r`.`question_id` = `q`.`question_id`)) left join `response` `age_r` on(`age_r`.`visitor_id` = `r`.`visitor_id` and `age_r`.`question_id` = 1 and `age_r`.`response_id` <> `r`.`response_id`));

DROP TABLE IF EXISTS `v_exhibitor_info`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_exhibitor_info` AS select `ex`.`exhibitor_id` AS `exhibitor_id`,`ex`.`exhibitor_name` AS `exhibitor_name`,`ex`.`exhibitor_type` AS `exhibitor_type`,`sc`.`subcategory_id` AS `subcategory_id`,`sc`.`subcategory_name` AS `subcategory_name`,`st`.`stand_code` AS `stand_code`,`st`.`status` AS `stand_status`,`st`.`pos_x` AS `pos_x`,`st`.`pos_y` AS `pos_y`,`z`.`id` AS `zone_id`,`z`.`zone_name` AS `zone_name`,`se`.`sector_id` AS `sector_id`,`se`.`sector_name` AS `sector_name`,`se`.`chatbot_keyword` AS `sector_keywords` from ((((`exhibitor` `ex` left join `subcategory` `sc` on(`ex`.`subcategory_id` = `sc`.`subcategory_id`)) left join `sectors` `se` on(`sc`.`sector_id` = `se`.`sector_id`)) left join `stands` `st` on(`st`.`exhibitor_id` = `ex`.`exhibitor_id`)) left join `zone` `z` on(`st`.`zone_id` = `z`.`id`));

DROP TABLE IF EXISTS `v_programme_complet`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_programme_complet` AS select `e`.`event_id` AS `event_id`,`e`.`event_date` AS `event_date`,`e`.`day_label` AS `day_label`,`e`.`event_type` AS `event_type`,`e`.`title` AS `title`,`e`.`venue_id` AS `venue_id`,`v`.`venue_name` AS `venue_name`,`v`.`venue_type` AS `venue_type`,`v`.`capacity` AS `venue_capacity`,`e`.`start_time` AS `start_time`,`e`.`end_time` AS `end_time`,`e`.`organizer_or_brand` AS `organizer_or_brand`,`e`.`target_audience` AS `target_audience`,`e`.`status` AS `status`,`e`.`notes` AS `notes` from (`event` `e` left join `venue` `v` on(`e`.`venue_id` = `v`.`venue_id`));

-- 2026-05-04 10:58:25 UTC

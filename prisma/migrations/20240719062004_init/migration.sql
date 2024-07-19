-- CreateTable
CREATE TABLE `AdminUser` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL DEFAULT '',
    `password` VARCHAR(200) NOT NULL DEFAULT '',
    `status` TINYINT NOT NULL DEFAULT 0,
    `login_attempts` INTEGER NOT NULL DEFAULT 0,
    `two_step_enabled` TINYINT NOT NULL DEFAULT 0,
    `two_step_opened_at` DATETIME(0) NULL,
    `lock_until` DATETIME(0) NULL,
    `two_step_attempts` INTEGER NOT NULL DEFAULT 0,
    `two_step_lock_until` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `password_changed_at` DATETIME(0) NULL,

    UNIQUE INDEX `AdminUser_UNIQUE`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminUserRole` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL DEFAULT 0,
    `role_id` BIGINT NOT NULL DEFAULT 0,
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `AdminUserRole_user_id_IDX`(`user_id`, `role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminUserTwoStepAttempt` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL DEFAULT 0,
    `method` TINYINT NOT NULL DEFAULT 0,
    `code` VARCHAR(10) NOT NULL DEFAULT '',
    `status` TINYINT NOT NULL DEFAULT 0,
    `expires_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_userid_method`(`user_id`, `method`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminUserTwoStepSetting` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL DEFAULT 0,
    `method` TINYINT NOT NULL DEFAULT 0,
    `secret` VARCHAR(255) NOT NULL DEFAULT '',
    `draft_box_secret` VARCHAR(255) NOT NULL DEFAULT '',
    `enabled` TINYINT NOT NULL DEFAULT 0,
    `opened_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `UNIQUE_userid_method`(`user_id`, `method`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminUserTwoStepToken` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL DEFAULT 0,
    `token` VARCHAR(255) NOT NULL DEFAULT '',
    `expires_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `UNIQUE_userid`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminApiRouter` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL DEFAULT '',
    `method` VARCHAR(20) NOT NULL DEFAULT '',
    `path` VARCHAR(255) NOT NULL DEFAULT '',
    `status` TINYINT NOT NULL DEFAULT 0,
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminMenu` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL DEFAULT '',
    `parent_id` BIGINT NOT NULL DEFAULT 0,
    `icon` VARCHAR(255) NOT NULL DEFAULT '',
    `link` VARCHAR(255) NOT NULL DEFAULT '',
    `rank` INTEGER NOT NULL DEFAULT 0,
    `status` TINYINT NOT NULL DEFAULT 0,
    `depth` TINYINT NOT NULL DEFAULT 0,
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminMenuApiRouterBindMap` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `menu_id` BIGINT NOT NULL DEFAULT 0,
    `api_id` BIGINT NOT NULL DEFAULT 0,
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `AdminUserRole_user_id_IDX`(`menu_id`, `api_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminPermission` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `role_id` BIGINT NOT NULL DEFAULT 0,
    `menu_id` BIGINT NOT NULL DEFAULT 0,
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminRole` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL DEFAULT '',
    `description` VARCHAR(255) NOT NULL DEFAULT '',
    `status` TINYINT NOT NULL DEFAULT 0,
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `AdminRole_name_IDX`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;




LOCK TABLES `AdminApiRouter` WRITE;
/*!40000 ALTER TABLE `AdminApiRouter` DISABLE KEYS */;
INSERT INTO `AdminApiRouter` VALUES (1,'获取后台用户列表','get','/admin/authority/user/list',1,'2024-07-11 16:01:30','2024-07-09 22:27:44'),(2,'获取角色列表','get','/admin/authority/role/list',1,'2024-07-11 16:53:10','2024-07-11 16:53:10'),(3,'创建后台用户','post','/admin/authority/user/create',1,'2024-07-15 23:12:35','2024-07-15 23:12:35'),(4,'创建角色','post','/admin/authority/role/create',1,'2024-07-15 23:33:13','2024-07-15 23:33:13'),(5,'修改用户信息','post','/admin/authority/user/change',1,'2024-07-16 09:58:06','2024-07-16 09:58:06'),(6,'修改角色','post','/admin/authority/role/change',1,'2024-07-16 10:18:44','2024-07-16 10:18:44');
/*!40000 ALTER TABLE `AdminApiRouter` ENABLE KEYS */;
UNLOCK TABLES;



LOCK TABLES `AdminMenu` WRITE;
/*!40000 ALTER TABLE `AdminMenu` DISABLE KEYS */;
INSERT INTO `AdminMenu` VALUES (1,'首页',0,'home_icon.png','/',0,1,1,'2024-07-04 17:40:56','2024-07-04 17:40:56'),(3,'系统设置',0,'home_icon.png','/settings',0,1,1,'2024-07-19 14:06:57','2024-07-04 17:43:00'),(8,'菜单管理',3,'home_icon.png','/settings/menu',0,1,2,'2024-07-19 14:06:57','2024-07-10 13:52:40'),(9,'权限系统',3,'home_icon.png','/settings/authority',0,1,2,'2024-07-19 14:06:57','2024-07-10 13:54:31'),(10,'用户管理',9,'home_icon.png','/settings/authority/user',0,1,3,'2024-07-19 14:06:57','2024-07-10 13:55:46'),(11,'编辑菜单',8,'home_icon.png','/settings/menu/edit',0,1,3,'2024-07-19 14:06:57','2024-07-10 13:56:19'),(12,'角色管理',9,'home_icon.png','/settings/authority/role',0,1,3,'2024-07-19 14:06:57','2024-07-10 18:39:41'),(13,'接口配置',8,'home_icon.png','/settings/api/config',0,1,3,'2024-07-19 14:06:57','2024-07-10 18:45:50'),(14,'绑定接口',8,'home_icon.png','/settings/menu/bind',0,1,3,'2024-07-19 14:06:57','2024-07-10 18:53:59');
/*!40000 ALTER TABLE `AdminMenu` ENABLE KEYS */;
UNLOCK TABLES;


LOCK TABLES `AdminMenuApiRouterBindMap` WRITE;
/*!40000 ALTER TABLE `AdminMenuApiRouterBindMap` DISABLE KEYS */;
INSERT INTO `AdminMenuApiRouterBindMap` VALUES (1,10,1,'2024-07-19 14:08:35','2024-07-09 22:29:02'),(4,12,2,'2024-07-19 14:09:30','2024-07-11 16:53:34'),(5,10,3,'2024-07-19 14:08:35','2024-07-15 23:12:56'),(6,12,4,'2024-07-19 14:09:30','2024-07-15 23:33:23'),(7,10,5,'2024-07-19 14:08:35','2024-07-16 09:58:16'),(8,12,6,'2024-07-19 14:09:30','2024-07-16 10:18:52');
/*!40000 ALTER TABLE `AdminMenuApiRouterBindMap` ENABLE KEYS */;
UNLOCK TABLES;


LOCK TABLES `AdminPermission` WRITE;
/*!40000 ALTER TABLE `AdminPermission` DISABLE KEYS */;
INSERT INTO `AdminPermission` VALUES (1,1000,1,'2024-07-05 17:01:46','2024-07-05 17:01:46'),(3,1000,3,'2024-07-05 17:02:01','2024-07-05 17:02:01'),(8,1000,8,'2024-07-10 13:53:08','2024-07-10 13:53:08'),(9,1000,9,'2024-07-10 13:54:46','2024-07-10 13:54:46'),(10,1000,10,'2024-07-10 13:56:44','2024-07-10 13:56:44'),(11,1000,11,'2024-07-10 13:56:50','2024-07-10 13:56:50'),(12,1000,12,'2024-07-10 18:40:34','2024-07-10 18:40:34'),(13,1000,13,'2024-07-10 18:52:10','2024-07-10 18:52:10'),(14,1000,14,'2024-07-10 18:54:40','2024-07-10 18:54:40'),(15,1000,15,'2024-07-17 23:03:51','2024-07-17 23:03:51');
/*!40000 ALTER TABLE `AdminPermission` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `AdminRole` WRITE;
/*!40000 ALTER TABLE `AdminRole` DISABLE KEYS */;
INSERT INTO `AdminRole` VALUES (1000,'权限管理员','',1,'2024-07-17 20:55:19','2024-07-05 16:59:11');
/*!40000 ALTER TABLE `AdminRole` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `AdminUser` WRITE;
/*!40000 ALTER TABLE `AdminUser` DISABLE KEYS */;
INSERT INTO `AdminUser` VALUES (1,'admin','$2b$10$ye5fyJe2uyW175b7JxIrK.xVv2K8OuYcKiUUn7za5KIV0d2HWojA6',1,0,0,'2024-07-18 14:35:58',NULL,0,NULL,'2024-07-19 14:15:07','2024-06-19 12:34:44','2024-03-16 14:08:03');
/*!40000 ALTER TABLE `AdminUser` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `AdminUserRole` WRITE;
/*!40000 ALTER TABLE `AdminUserRole` DISABLE KEYS */;
INSERT INTO `AdminUserRole` VALUES (1,1,1000,'2024-07-05 17:00:52','2024-07-05 17:00:52');
/*!40000 ALTER TABLE `AdminUserRole` ENABLE KEYS */;
UNLOCK TABLES;
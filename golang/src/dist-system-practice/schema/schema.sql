CREATE TABLE IF NOT EXISTS work
(
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  viewed      INT UNSIGNED NOT NULL DEFAULT 0,
  achievement VARCHAR(256) NOT NULL DEFAULT '',
  is_planned  BOOLEAN      NOT NULL DEFAULT FALSE,
  created     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_bin;
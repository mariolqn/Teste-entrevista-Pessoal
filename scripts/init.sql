-- Initial Database Setup for Dynamic Dashboard
-- This script runs when MySQL container starts

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS dashboard
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Use the database
USE dashboard;

-- Set timezone to UTC
SET time_zone = '+00:00';

-- Performance settings for session
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- Create user if not exists (for local development)
CREATE USER IF NOT EXISTS 'dashboard'@'%' IDENTIFIED BY 'dashboard';
GRANT ALL PRIVILEGES ON dashboard.* TO 'dashboard'@'%';
FLUSH PRIVILEGES;

-- Create views after tables are created by Prisma migrations
-- These will be created via migration files

-- Performance indexes will be created by Prisma migrations

-- Initial settings
SET GLOBAL max_connections = 1000;
SET GLOBAL innodb_buffer_pool_size = 268435456; -- 256MB
SET GLOBAL innodb_log_file_size = 67108864; -- 64MB
SET GLOBAL slow_query_log = 1;
SET GLOBAL long_query_time = 2;

-- Create stored procedure for generating test data (optional)
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS GenerateTimeSeriesData()
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE max_records INT DEFAULT 1000;
    DECLARE current_date DATE;
    
    SET current_date = DATE_SUB(CURDATE(), INTERVAL 365 DAY);
    
    WHILE i < max_records DO
        -- This procedure can be used to generate test data if needed
        SET i = i + 1;
        SET current_date = DATE_ADD(current_date, INTERVAL 1 DAY);
    END WHILE;
END$$

DELIMITER ;

-- Create function for Brazilian document validation (CPF/CNPJ)
DELIMITER $$

CREATE FUNCTION IF NOT EXISTS ValidateCPF(cpf VARCHAR(11))
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE sum1 INT DEFAULT 0;
    DECLARE sum2 INT DEFAULT 0;
    DECLARE digit1 INT;
    DECLARE digit2 INT;
    
    -- Remove non-numeric characters
    SET cpf = REGEXP_REPLACE(cpf, '[^0-9]', '');
    
    -- Check length
    IF LENGTH(cpf) != 11 THEN
        RETURN FALSE;
    END IF;
    
    -- Check if all digits are the same
    IF cpf REGEXP '^(.)\\1{10}$' THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate first digit
    WHILE i <= 9 DO
        SET sum1 = sum1 + (SUBSTRING(cpf, i, 1) * (11 - i));
        SET i = i + 1;
    END WHILE;
    
    SET digit1 = 11 - (sum1 % 11);
    IF digit1 >= 10 THEN SET digit1 = 0; END IF;
    
    -- Calculate second digit
    SET i = 1;
    WHILE i <= 10 DO
        SET sum2 = sum2 + (SUBSTRING(cpf, i, 1) * (12 - i));
        SET i = i + 1;
    END WHILE;
    
    SET digit2 = 11 - (sum2 % 11);
    IF digit2 >= 10 THEN SET digit2 = 0; END IF;
    
    -- Validate
    RETURN (SUBSTRING(cpf, 10, 1) = digit1) AND (SUBSTRING(cpf, 11, 1) = digit2);
END$$

DELIMITER ;

-- Create events for maintenance (optional)
DELIMITER $$

CREATE EVENT IF NOT EXISTS CleanOldLogs
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY
DO
BEGIN
    -- Clean old logs or temporary data
    -- This is a placeholder for maintenance tasks
    SELECT 1;
END$$

DELIMITER ;

-- Table for query performance monitoring
CREATE TABLE IF NOT EXISTS query_performance_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    query_text TEXT,
    execution_time DECIMAL(10, 6),
    rows_examined INT,
    rows_sent INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_execution_time (execution_time),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ensure character set is correct
ALTER DATABASE dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_code_key`(`code`),
    INDEX `categories_code_idx`(`code`),
    INDEX `categories_name_idx`(`name`),
    INDEX `categories_is_active_idx`(`is_active`),
    FULLTEXT INDEX `categories_name_description_idx`(`name`, `description`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NULL,
    `category_id` VARCHAR(191) NOT NULL,
    `unit_price` DECIMAL(15, 2) NOT NULL,
    `unit` VARCHAR(20) NULL DEFAULT 'UN',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_code_key`(`code`),
    INDEX `idx_products_category`(`category_id`),
    INDEX `idx_products_name`(`name`),
    INDEX `idx_products_code`(`code`),
    INDEX `idx_products_active`(`is_active`),
    INDEX `idx_products_price`(`unit_price`),
    FULLTEXT INDEX `idx_products_name_fulltext`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `document` VARCHAR(20) NOT NULL,
    `email` VARCHAR(100) NULL,
    `phone` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(50) NULL,
    `state` VARCHAR(2) NULL,
    `zip_code` VARCHAR(10) NULL,
    `region` VARCHAR(50) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `customers_document_key`(`document`),
    INDEX `customers_region_idx`(`region`),
    INDEX `customers_document_idx`(`document`),
    INDEX `customers_email_idx`(`email`),
    INDEX `customers_is_active_idx`(`is_active`),
    INDEX `customers_state_idx`(`state`),
    INDEX `customers_city_idx`(`city`),
    FULLTEXT INDEX `customers_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('REVENUE', 'EXPENSE') NOT NULL,
    `product_id` VARCHAR(191) NULL,
    `customer_id` VARCHAR(191) NULL,
    `category_id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(15, 2) NULL,
    `discount` DECIMAL(15, 2) NULL DEFAULT 0,
    `tax` DECIMAL(15, 2) NULL DEFAULT 0,
    `occurred_at` DATETIME(3) NOT NULL,
    `due_date` DATE NULL,
    `paid_at` DATETIME(3) NULL,
    `payment_status` ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `invoice_number` VARCHAR(50) NULL,
    `description` TEXT NULL,
    `reference` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `created_by` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `transactions_occurred_at_type_idx`(`occurred_at`, `type`),
    INDEX `transactions_category_id_occurred_at_idx`(`category_id`, `occurred_at`),
    INDEX `transactions_customer_id_occurred_at_idx`(`customer_id`, `occurred_at`),
    INDEX `transactions_product_id_occurred_at_idx`(`product_id`, `occurred_at`),
    INDEX `transactions_due_date_payment_status_idx`(`due_date`, `payment_status`),
    INDEX `transactions_paid_at_idx`(`paid_at`),
    INDEX `transactions_type_amount_idx`(`type`, `amount`),
    INDEX `transactions_payment_status_idx`(`payment_status`),
    INDEX `transactions_invoice_number_idx`(`invoice_number`),
    INDEX `transactions_occurred_at_category_id_type_idx`(`occurred_at`, `category_id`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

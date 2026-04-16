-- Initial data setup for account service
-- This will run automatically when application starts

-- Create validation rules table if not exists
CREATE TABLE IF NOT EXISTS country_validation_rules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    country ENUM('INDIA', 'USA', 'UK') NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    validation_regex VARCHAR(500),
    min_length INT,
    max_length INT,
    is_required BOOLEAN DEFAULT TRUE,
    error_message VARCHAR(200),
    UNIQUE KEY unique_country_field (country, field_name)
);

-- Insert validation rules 
INSERT IGNORE INTO country_validation_rules 
(country, field_name, validation_regex, min_length, max_length, is_required, error_message) VALUES
-- India Validations
('INDIA', 'aadhaar', '^[0-9]{12}$', 12, 12, TRUE, 'Aadhaar must be 12 digits'),
('INDIA', 'pan', '^[A-Z]{5}[0-9]{4}[A-Z]{1}$', 10, 10, TRUE, 'Invalid PAN format'),
('INDIA', 'mobile', '^[6-9][0-9]{9}$', 10, 10, TRUE, 'Invalid mobile number'),

-- USA Validations
('USA', 'ssn', '^[0-9]{3}-[0-9]{2}-[0-9]{4}$', 11, 11, TRUE, 'Invalid SSN format'),
('USA', 'phone', '^\\+1[0-9]{10}$', 12, 12, TRUE, 'Invalid US phone format'),

-- UK Validations  
('UK', 'nin', '^[A-Z]{2}[0-9]{6}[A-Z]{1}$', 9, 9, TRUE, 'Invalid NIN format'),
('UK', 'phone', '^\\+44[0-9]{10}$', 13, 13, TRUE, 'Invalid UK phone format');

-- Create account type mapping table
CREATE TABLE IF NOT EXISTS account_type_mapping (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    country ENUM('INDIA', 'USA', 'UK') NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    minimum_deposit DECIMAL(10,2) NOT NULL,
    INDEX idx_country (country)
);

-- Insert account type mappings
INSERT IGNORE INTO account_type_mapping 
(country, account_type, is_active, minimum_deposit) VALUES
-- India
('INDIA', 'SAVINGS', TRUE, 1000.00),
('INDIA', 'CURRENT', TRUE, 5000.00),
('INDIA', 'SALARY', TRUE, 0.00),  
('INDIA', 'FIXED_DEPOSIT', TRUE, 10000.00),

-- USA
('USA', 'CHECKING', TRUE, 100.00),
('USA', 'SAVINGS', TRUE, 100.00),
('USA', 'MONEY_MARKET', TRUE, 2500.00),
('USA', 'CERTIFICATE_OF_DEPOSIT', TRUE, 1000.00),

-- UK
('UK', 'CURRENT', TRUE, 50.00),
('UK', 'SAVINGS', TRUE, 10.00),
('UK', 'ISA', TRUE, 100.00),
('UK', 'FIXED_TERM', TRUE, 500.00);
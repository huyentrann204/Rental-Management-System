CREATE DATABASE csdl_quanlytro;
GO
USE csdl_quanlytro;
GO

CREATE TABLE USERS (
    user_id INT PRIMARY KEY IDENTITY(1,1),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role NVARCHAR(20) NOT NULL CHECK (role IN ('tenant', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ROOM_TYPE (
    room_type_id INT IDENTITY PRIMARY KEY,
    type_name NVARCHAR(100),
    price DECIMAL(18,2) NOT NULL CHECK (price >= 0)
);

CREATE TABLE ROOM (
    room_id INT IDENTITY PRIMARY KEY,
    room_code NVARCHAR(50) NOT NULL UNIQUE,
    room_type_id INT NOT NULL,
    status NVARCHAR(20) NOT NULL
    CHECK (status IN ('available','occupied','maintenance','reserved')),
    FOREIGN KEY (room_type_id) REFERENCES ROOM_TYPE(room_type_id)
);

CREATE TABLE TENANT (
    tenant_id INT IDENTITY PRIMARY KEY,
    full_name NVARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    cccd VARCHAR(20),
    email VARCHAR(100),
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);

CREATE TABLE CONTRACT (
    contract_id INT IDENTITY PRIMARY KEY,
    room_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status NVARCHAR(20) NOT NULL
        CHECK (status IN ('active','ended','cancelled')),
    deposit_amount DECIMAL(18,2) CHECK (deposit_amount >= 0),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (room_id) REFERENCES ROOM(room_id)
);

CREATE UNIQUE INDEX UQ_CONTRACT_ACTIVE_ROOM
ON CONTRACT(room_id)
WHERE status = 'active';

CREATE TABLE DEPOSIT (
    deposit_id INT IDENTITY PRIMARY KEY,
    room_id INT NOT NULL,
    tenant_id INT NOT NULL,
    contract_id INT NULL,
    amount DECIMAL(18,2) NOT NULL CHECK (amount > 0),
    status NVARCHAR(20) 
        CHECK (status IN ('pending','converted','cancelled','expired')),
    expired_at DATE,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (room_id) REFERENCES ROOM(room_id),
    FOREIGN KEY (tenant_id) REFERENCES TENANT(tenant_id),
    FOREIGN KEY (contract_id) REFERENCES CONTRACT(contract_id)
);

CREATE TABLE CONTRACT_TENANT (
    contract_id INT NOT NULL,
    tenant_id INT NOT NULL,
    is_primary BIT NOT NULL,
    PRIMARY KEY (contract_id, tenant_id),
    FOREIGN KEY (contract_id) REFERENCES CONTRACT(contract_id),
    FOREIGN KEY (tenant_id) REFERENCES TENANT(tenant_id)
);

CREATE UNIQUE INDEX UQ_CONTRACT_PRIMARY_TENANT
ON CONTRACT_TENANT(contract_id)
WHERE is_primary = 1;

CREATE TABLE SERVICE (
    service_id INT IDENTITY PRIMARY KEY,
    service_name NVARCHAR(100),
    service_type NVARCHAR(20) 
        CHECK (service_type IN ('fixed','metered')),
    unit_type NVARCHAR(20) 
        CHECK (unit_type IN ('per_room','per_person','kwh','m3')),
    price DECIMAL(18,2) NOT NULL CHECK (price >= 0),
    cycle_days INT DEFAULT 30
);

CREATE TABLE SERVICE_SUBSCRIPTION (
    subscription_id INT IDENTITY PRIMARY KEY,
    service_id INT NOT NULL,
    contract_id INT NOT NULL,
    tenant_id INT NULL,
    startDate DATE NOT NULL,
    end_date DATE,
    status_service NVARCHAR(20) 
        CHECK (status_service IN ('pending','active','expired','cancelled')),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (service_id) REFERENCES SERVICE(service_id),
    FOREIGN KEY (contract_id) REFERENCES CONTRACT(contract_id),
    FOREIGN KEY (tenant_id) REFERENCES TENANT(tenant_id)
);

CREATE TABLE UTILITY_READING (
    reading_id INT IDENTITY PRIMARY KEY,
    room_id INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL CHECK (year >= 2000),
    electric_old INT NOT NULL,
    electric_new INT NOT NULL,
    water_old INT NOT NULL,
    water_new INT NOT NULL,
    FOREIGN KEY (room_id) REFERENCES ROOM(room_id),
    CHECK (
        electric_new >= electric_old AND
        water_new >= water_old
    )
);

ALTER TABLE UTILITY_READING
ADD CONSTRAINT UQ_UTILITY_ROOM_MONTH
UNIQUE (room_id, month, year);

CREATE TABLE INVOICE (
    invoice_id INT IDENTITY PRIMARY KEY,
    contract_id INT NOT NULL,
    invoice_type NVARCHAR(20) NOT NULL 
        CHECK (invoice_type IN ('monthly','service')),
    month INT NOT NULL,
    year INT NOT NULL,
    period_start DATE,
    period_end DATE,
    total DECIMAL(18,2) NOT NULL CHECK (total >= 0),
    status_invoice NVARCHAR(20) NOT NULL 
        CHECK (status_invoice IN ('unpaid','paid')),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (contract_id) REFERENCES CONTRACT(contract_id)
);

ALTER TABLE INVOICE
ADD CONSTRAINT UQ_INVOICE_PERIOD
UNIQUE (contract_id, month, year, invoice_type);

CREATE TABLE INVOICE_ITEM (
    item_id INT IDENTITY PRIMARY KEY,
    invoice_id INT NOT NULL,
    description_invoice NVARCHAR(255) NOT NULL,
    amount DECIMAL(18,2) NOT NULL CHECK (amount >= 0),
    FOREIGN KEY (invoice_id) REFERENCES INVOICE(invoice_id)
);

CREATE TABLE MAINTENANCE_REQUEST (
    request_id INT IDENTITY PRIMARY KEY,
    contract_id INT NOT NULL,
    tenant_id INT NOT NULL,
    description_maintance NVARCHAR(MAX) NOT NULL,
    image_url VARCHAR(255),
    status_maintance NVARCHAR(20) NOT NULL
        CHECK (status_maintance IN ('pending','processing','done')),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (contract_id) REFERENCES CONTRACT(contract_id),
    FOREIGN KEY (tenant_id) REFERENCES TENANT(tenant_id)
);

CREATE TABLE NOTIFICATIONS (
    notification_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    related_id INT,
    type NVARCHAR(50),
    is_read BIT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Notifications_Users FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('INVOICE') AND name = 'description_invoice')
BEGIN
    ALTER TABLE INVOICE ADD description_invoice NVARCHAR(MAX);
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SERVICE') AND name = 'cycle_days')
BEGIN
    ALTER TABLE SERVICE ADD cycle_days INT DEFAULT 30;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('INVOICE_ITEM') AND name = 'item_type')
BEGIN
    ALTER TABLE INVOICE_ITEM ADD item_type NVARCHAR(50);
END

ALTER TABLE ROOM ADD manager_id INT; 

CREATE TABLE DASHBOARD_BANNERS (
    banner_id INT PRIMARY KEY IDENTITY(1,1),
    image_url NVARCHAR(MAX) NOT NULL,
    manager_id INT,
    created_at DATETIME DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ROOM') AND name = 'manager_id')
    ALTER TABLE ROOM ADD manager_id INT;

ALTER TABLE CONTRACT DROP CONSTRAINT CK__CONTRACT__status__46E78A0C;
ALTER TABLE CONTRACT ADD CONSTRAINT CK_Contract_Status CHECK (status IN ('active','ended','cancelled','pending'));

ALTER TABLE USERS ADD resetOTP VARCHAR(10) NULL;
ALTER TABLE USERS ADD otpExp DATETIME NULL;

ALTER TABLE TENANT ADD landlord_id INT;

ALTER TABLE TENANT
ADD CONSTRAINT FK_Tenant_Landlord 
FOREIGN KEY (landlord_id) REFERENCES USERS(user_id);

UPDATE TENANT SET landlord_id = 1 WHERE landlord_id IS NULL;

ALTER TABLE ROOM_TYPE ADD manager_id INT;
ALTER TABLE ROOM_TYPE ADD CONSTRAINT FK_RoomType_Manager FOREIGN KEY (manager_id) REFERENCES USERS(user_id);

DELETE FROM CONTRACT_TENANT;
DELETE FROM UTILITY_READING;
DELETE FROM MAINTENANCE_REQUEST;
DELETE FROM INVOICE_ITEM;
DELETE FROM INVOICE;
DELETE FROM SERVICE_SUBSCRIPTION;
DELETE FROM DEPOSIT;
DELETE FROM CONTRACT;
DELETE FROM ROOM;
DELETE FROM ROOM_TYPE;

DBCC CHECKIDENT ('CONTRACT', RESEED, 0);
DBCC CHECKIDENT ('ROOM', RESEED, 0);
DBCC CHECKIDENT ('ROOM_TYPE', RESEED, 0);
DBCC CHECKIDENT ('INVOICE', RESEED, 0);

DELETE FROM ROOM WHERE manager_id IS NULL;
ALTER TABLE SERVICE ADD manager_id INT;
ALTER TABLE SERVICE ADD CONSTRAINT FK_Service_Manager FOREIGN KEY (manager_id) REFERENCES USERS(user_id);
ALTER TABLE TENANT ADD gender NVARCHAR(10);
ALTER TABLE TENANT ADD address NVARCHAR(255);
DELETE FROM TENANT WHERE full_name IS NULL OR phone IS NULL;
DELETE FROM TENANT;
DBCC CHECKIDENT ('TENANT', RESEED, 0);

CREATE TABLE LANDLORD_INFO (
    landlord_id INT PRIMARY KEY,
    full_name NVARCHAR(100),
    phone VARCHAR(15),
    address NVARCHAR(255),
    avatar_url NVARCHAR(MAX),
    FOREIGN KEY (landlord_id) REFERENCES USERS(user_id)
);

ALTER TABLE LANDLORD_INFO ADD cccd VARCHAR(20);
ALTER TABLE LANDLORD_INFO ADD cccd_date DATE;
ALTER TABLE LANDLORD_INFO ADD theme_mode VARCHAR(10) DEFAULT 'light';

ALTER TABLE CONTRACT DROP CONSTRAINT CK_Contract_Status;

ALTER TABLE CONTRACT ADD CONSTRAINT CK_Contract_Status 
CHECK (status IN ('active','ended','cancelled','pending'));

ALTER TABLE NOTIFICATIONS ADD sender_id INT;
ALTER TABLE NOTIFICATIONS ADD CONSTRAINT FK_Notifications_Sender FOREIGN KEY (sender_id) REFERENCES USERS(user_id);

ALTER TABLE CONTRACT ADD manager_id INT;

ALTER TABLE CONTRACT ADD price_room DECIMAL(18, 2);
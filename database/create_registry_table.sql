CREATE TABLE IF NOT EXISTS registry_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registry_id VARCHAR(20) NOT NULL UNIQUE,
    public_user_id INT,
    visitor_name VARCHAR(255) NOT NULL,
    visitor_nic VARCHAR(20) NOT NULL,
    visitor_address TEXT,
    visitor_phone VARCHAR(20),
    department_id INT NOT NULL,
    division_id INT,
    purpose_of_visit TEXT NOT NULL,
    remarks TEXT,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    visitor_type ENUM('new', 'existing') NOT NULL DEFAULT 'new',
    status ENUM('active', 'checked_out', 'deleted') DEFAULT 'active',
    staff_user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (division_id) REFERENCES divisions(id),
    FOREIGN KEY (staff_user_id) REFERENCES users(id),
    INDEX idx_registry_date (entry_time),
    INDEX idx_department (department_id),
    INDEX idx_status (status)
);
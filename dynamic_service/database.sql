-- Database setup for Dynamic QR Code Service
-- Run this SQL to create the required table

CREATE TABLE IF NOT EXISTS qr_redirects (
    id VARCHAR(10) PRIMARY KEY,
    destination_url TEXT NOT NULL,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    scan_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Sample data for testing
INSERT INTO qr_redirects (id, destination_url, title) VALUES
('ABC123', 'https://google.com', 'Google Search'),
('XYZ789', 'https://github.com', 'GitHub Platform'),
('DEF456', 'mailto:contact@example.com', 'Contact Email');

-- Create index for faster lookups
CREATE INDEX idx_qr_id ON qr_redirects(id);
CREATE INDEX idx_created_at ON qr_redirects(created_at);
<?php
// Database configuration for Dynamic QR Service
// Update these settings based on your hosting environment

// Database settings
define('DB_HOST', 'localhost');
define('DB_NAME', 'qr_dynamic');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

// Service settings
define('BASE_URL', 'https://yourservice.com'); // Update this to your domain
define('REDIRECT_PREFIX', '/go/');

// Error page settings
define('ERROR_REDIRECT', 'https://yourservice.com/error.html');
define('DEFAULT_REDIRECT', 'https://yourservice.com');

// Database connection function
function getDBConnection() {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        return null;
    }
}

// Logging function
function logRedirect($id, $ip, $userAgent) {
    error_log("QR Redirect: ID={$id}, IP={$ip}, UA={$userAgent}");
}
?>
<?php
// Main redirect handler for Dynamic QR Codes
// URL: yourservice.com/go/ABC123

require_once 'config.php';

// Get the QR ID from the URL
$requestUri = $_SERVER['REQUEST_URI'];
$qrId = '';

// Extract QR ID from different URL patterns
if (preg_match('#/go/([A-Za-z0-9]{8})#', $requestUri, $matches)) {
    $qrId = $matches[1];
} elseif (isset($_GET['id'])) {
    $qrId = $_GET['id'];
} else {
    // Invalid URL format
    header("Location: " . ERROR_REDIRECT);
    exit;
}

// Validate QR ID format (8 characters, alphanumeric)
if (!preg_match('/^[A-Za-z0-9]{8}$/', $qrId)) {
    header("Location: " . ERROR_REDIRECT);
    exit;
}

// Get database connection
$pdo = getDBConnection();
if (!$pdo) {
    header("Location: " . ERROR_REDIRECT);
    exit;
}

try {
    // Get destination URL from database
    $stmt = $pdo->prepare("SELECT destination_url, is_active FROM qr_redirects WHERE id = ?");
    $stmt->execute([$qrId]);
    $result = $stmt->fetch();

    if (!$result) {
        // QR ID not found
        header("HTTP/1.1 404 Not Found");
        header("Location: " . ERROR_REDIRECT);
        exit;
    }

    if (!$result['is_active']) {
        // QR code is disabled
        header("HTTP/1.1 410 Gone");
        header("Location: " . ERROR_REDIRECT);
        exit;
    }

    $destinationUrl = $result['destination_url'];

    // Validate destination URL
    if (!filter_var($destinationUrl, FILTER_VALIDATE_URL) && !preg_match('/^mailto:/', $destinationUrl)) {
        // Invalid destination URL
        header("Location: " . ERROR_REDIRECT);
        exit;
    }

    // Update scan count
    $updateStmt = $pdo->prepare("UPDATE qr_redirects SET scan_count = scan_count + 1 WHERE id = ?");
    $updateStmt->execute([$qrId]);

    // Log the redirect for analytics
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    logRedirect($qrId, $ip, $userAgent);

    // Perform the redirect
    header("Location: " . $destinationUrl);
    exit;

} catch (PDOException $e) {
    error_log("Database error in redirect: " . $e->getMessage());
    header("Location: " . ERROR_REDIRECT);
    exit;
}
?>
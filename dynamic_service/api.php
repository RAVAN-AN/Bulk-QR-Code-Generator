<?php
// API for managing Dynamic QR Code redirects
// Endpoints:
// POST /api.php?action=create - Create new redirect
// PUT /api.php?action=update&id=ABC123 - Update existing redirect
// GET /api.php?action=get&id=ABC123 - Get redirect info
// GET /api.php?action=list - List all redirects

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get database connection
$pdo = getDBConnection();
if (!$pdo) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($action) {
        case 'create':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
                break;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $destinationUrl = $input['url'] ?? '';
            $title = $input['title'] ?? '';
            $customId = $input['id'] ?? '';
            
            // Validate destination URL
            if (!filter_var($destinationUrl, FILTER_VALIDATE_URL) && !preg_match('/^mailto:/', $destinationUrl)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid URL']);
                break;
            }
            
            // Generate or validate ID
            if ($customId) {
                if (!preg_match('/^[A-Za-z0-9]{8}$/', $customId)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid ID format']);
                    break;
                }
                $qrId = $customId;
            } else {
                $qrId = generateUniqueId($pdo);
            }
            
            // Insert into database
            $stmt = $pdo->prepare("INSERT INTO qr_redirects (id, destination_url, title) VALUES (?, ?, ?)");
            $result = $stmt->execute([$qrId, $destinationUrl, $title]);
            
            if ($result) {
                echo json_encode([
                    'success' => true,
                    'id' => $qrId,
                    'redirect_url' => BASE_URL . REDIRECT_PREFIX . $qrId,
                    'destination_url' => $destinationUrl,
                    'title' => $title
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to create redirect']);
            }
            break;
            
        case 'update':
            if ($method !== 'PUT') {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
                break;
            }
            
            $qrId = $_GET['id'] ?? '';
            if (!preg_match('/^[A-Za-z0-9]{8}$/', $qrId)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid ID']);
                break;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $destinationUrl = $input['url'] ?? '';
            $title = $input['title'] ?? '';
            $isActive = $input['active'] ?? true;
            
            // Validate destination URL
            if ($destinationUrl && !filter_var($destinationUrl, FILTER_VALIDATE_URL) && !preg_match('/^mailto:/', $destinationUrl)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid URL']);
                break;
            }
            
            // Update database
            $stmt = $pdo->prepare("UPDATE qr_redirects SET destination_url = ?, title = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $result = $stmt->execute([$destinationUrl, $title, $isActive, $qrId]);
            
            if ($result && $stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Redirect updated']);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Redirect not found']);
            }
            break;
            
        case 'get':
            if ($method !== 'GET') {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
                break;
            }
            
            $qrId = $_GET['id'] ?? '';
            if (!preg_match('/^[A-Za-z0-9]{8}$/', $qrId)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid ID']);
                break;
            }
            
            $stmt = $pdo->prepare("SELECT * FROM qr_redirects WHERE id = ?");
            $stmt->execute([$qrId]);
            $result = $stmt->fetch();
            
            if ($result) {
                $result['redirect_url'] = BASE_URL . REDIRECT_PREFIX . $result['id'];
                echo json_encode($result);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Redirect not found']);
            }
            break;
            
        case 'list':
            if ($method !== 'GET') {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
                break;
            }
            
            $limit = min($_GET['limit'] ?? 50, 100); // Max 100 items
            $offset = $_GET['offset'] ?? 0;
            
            $stmt = $pdo->prepare("SELECT * FROM qr_redirects ORDER BY created_at DESC LIMIT ? OFFSET ?");
            $stmt->bindValue(1, (int)$limit, PDO::PARAM_INT);
            $stmt->bindValue(2, (int)$offset, PDO::PARAM_INT);
            $stmt->execute();
            
            $results = $stmt->fetchAll();
            foreach ($results as &$result) {
                $result['redirect_url'] = BASE_URL . REDIRECT_PREFIX . $result['id'];
            }
            
            echo json_encode(['redirects' => $results]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
    }
    
} catch (PDOException $e) {
    error_log("API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}

function generateUniqueId($pdo) {
    $chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    $attempts = 0;
    
    do {
        $id = '';
        for ($i = 0; $i < 8; $i++) {
            $id .= $chars[random_int(0, strlen($chars) - 1)];
        }
        
        // Check if ID already exists
        $stmt = $pdo->prepare("SELECT 1 FROM qr_redirects WHERE id = ?");
        $stmt->execute([$id]);
        $exists = $stmt->fetch();
        
        $attempts++;
    } while ($exists && $attempts < 10);
    
    if ($attempts >= 10) {
        throw new Exception('Unable to generate unique ID');
    }
    
    return $id;
}
?>
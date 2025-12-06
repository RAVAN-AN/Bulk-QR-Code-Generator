<?php
// Bulk operations API for Dynamic QR Code Service
// Provides bulk URL management, analytics, and advanced features

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

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
        case 'bulk_update':
            if ($method !== 'PUT') {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
                break;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $updates = $input['updates'] ?? [];
            $operation = $input['operation'] ?? 'url'; // url, status, both
            
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['error' => 'No updates provided']);
                break;
            }
            
            $pdo->beginTransaction();
            $success = 0;
            $failed = 0;
            $errors = [];
            
            foreach ($updates as $update) {
                $id = $update['id'] ?? '';
                $url = $update['url'] ?? '';
                $isActive = $update['active'] ?? true;
                
                try {
                    if ($operation === 'url' || $operation === 'both') {
                        if (!filter_var($url, FILTER_VALIDATE_URL) && !preg_match('/^mailto:/', $url)) {
                            throw new Exception("Invalid URL: $url");
                        }
                    }
                    
                    $setParts = [];
                    $params = [];
                    
                    if ($operation === 'url' || $operation === 'both') {
                        $setParts[] = 'destination_url = ?';
                        $params[] = $url;
                    }
                    
                    if ($operation === 'status' || $operation === 'both') {
                        $setParts[] = 'is_active = ?';
                        $params[] = $isActive;
                    }
                    
                    $setParts[] = 'updated_at = CURRENT_TIMESTAMP';
                    $params[] = $id;
                    
                    $sql = "UPDATE qr_redirects SET " . implode(', ', $setParts) . " WHERE id = ?";
                    $stmt = $pdo->prepare($sql);
                    
                    if ($stmt->execute($params) && $stmt->rowCount() > 0) {
                        $success++;
                    } else {
                        $failed++;
                        $errors[] = "QR ID '$id' not found or no changes made";
                    }
                } catch (Exception $e) {
                    $failed++;
                    $errors[] = "QR ID '$id': " . $e->getMessage();
                }
            }
            
            if ($failed === 0) {
                $pdo->commit();
            } else {
                $pdo->rollBack();
            }
            
            echo json_encode([
                'success' => $success,
                'failed' => $failed,
                'errors' => $errors,
                'message' => "Bulk operation completed: $success successful, $failed failed"
            ]);
            break;
            
        case 'analytics':
            if ($method !== 'GET') {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
                break;
            }
            
            $period = $_GET['period'] ?? '7'; // days
            $limit = min($_GET['limit'] ?? 10, 50);
            
            // Total statistics
            $totalStmt = $pdo->query("
                SELECT 
                    COUNT(*) as total_qrs,
                    SUM(scan_count) as total_scans,
                    COUNT(CASE WHEN is_active THEN 1 END) as active_qrs,
                    AVG(scan_count) as avg_scans_per_qr
                FROM qr_redirects
            ");
            $totals = $totalStmt->fetch();
            
            // Recent activity (period-based stats would need scan logs table)
            $recentStmt = $pdo->prepare("
                SELECT * FROM qr_redirects 
                WHERE updated_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                ORDER BY updated_at DESC
                LIMIT ?
            ");
            $recentStmt->bindValue(1, (int)$period, PDO::PARAM_INT);
            $recentStmt->bindValue(2, (int)$limit, PDO::PARAM_INT);
            $recentStmt->execute();
            $recent = $recentStmt->fetchAll();
            
            // Top performing QR codes
            $topStmt = $pdo->prepare("
                SELECT * FROM qr_redirects 
                WHERE scan_count > 0
                ORDER BY scan_count DESC 
                LIMIT ?
            ");
            $topStmt->bindValue(1, (int)$limit, PDO::PARAM_INT);
            $topStmt->execute();
            $topPerforming = $topStmt->fetchAll();
            
            echo json_encode([
                'totals' => $totals,
                'recent_activity' => $recent,
                'top_performing' => $topPerforming,
                'period_days' => $period
            ]);
            break;
            
        case 'export':
            if ($method !== 'GET') {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
                break;
            }
            
            $format = $_GET['format'] ?? 'csv';
            $filter = $_GET['filter'] ?? 'all'; // all, active, inactive
            
            $sql = "SELECT * FROM qr_redirects";
            if ($filter === 'active') {
                $sql .= " WHERE is_active = 1";
            } elseif ($filter === 'inactive') {
                $sql .= " WHERE is_active = 0";
            }
            $sql .= " ORDER BY created_at DESC";
            
            $stmt = $pdo->query($sql);
            $data = $stmt->fetchAll();
            
            if ($format === 'csv') {
                header('Content-Type: text/csv');
                header('Content-Disposition: attachment; filename="qr_redirects_export.csv"');
                
                $output = fopen('php://output', 'w');
                
                // CSV headers
                fputcsv($output, [
                    'QR_ID', 'Title', 'Destination_URL', 'Redirect_URL', 
                    'Scan_Count', 'Is_Active', 'Created_At', 'Updated_At'
                ]);
                
                foreach ($data as $row) {
                    fputcsv($output, [
                        $row['id'],
                        $row['title'],
                        $row['destination_url'],
                        BASE_URL . REDIRECT_PREFIX . $row['id'],
                        $row['scan_count'],
                        $row['is_active'] ? 'Active' : 'Inactive',
                        $row['created_at'],
                        $row['updated_at']
                    ]);
                }
                
                fclose($output);
                exit;
            } else {
                // JSON format
                foreach ($data as &$row) {
                    $row['redirect_url'] = BASE_URL . REDIRECT_PREFIX . $row['id'];
                }
                echo json_encode(['data' => $data, 'count' => count($data)]);
            }
            break;
            
        case 'search':
            if ($method !== 'GET') {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
                break;
            }
            
            $query = $_GET['q'] ?? '';
            $limit = min($_GET['limit'] ?? 20, 100);
            $offset = $_GET['offset'] ?? 0;
            
            if (strlen($query) < 2) {
                echo json_encode(['results' => [], 'total' => 0]);
                break;
            }
            
            $searchStmt = $pdo->prepare("
                SELECT * FROM qr_redirects 
                WHERE id LIKE ? OR title LIKE ? OR destination_url LIKE ?
                ORDER BY 
                    CASE WHEN id = ? THEN 1 ELSE 2 END,
                    scan_count DESC
                LIMIT ? OFFSET ?
            ");
            
            $searchTerm = "%$query%";
            $searchStmt->bindValue(1, $searchTerm, PDO::PARAM_STR);
            $searchStmt->bindValue(2, $searchTerm, PDO::PARAM_STR);
            $searchStmt->bindValue(3, $searchTerm, PDO::PARAM_STR);
            $searchStmt->bindValue(4, $query, PDO::PARAM_STR);
            $searchStmt->bindValue(5, (int)$limit, PDO::PARAM_INT);
            $searchStmt->bindValue(6, (int)$offset, PDO::PARAM_INT);
            $searchStmt->execute();
            
            $results = $searchStmt->fetchAll();
            foreach ($results as &$result) {
                $result['redirect_url'] = BASE_URL . REDIRECT_PREFIX . $result['id'];
            }
            
            // Get total count for pagination
            $countStmt = $pdo->prepare("
                SELECT COUNT(*) as total FROM qr_redirects 
                WHERE id LIKE ? OR title LIKE ? OR destination_url LIKE ?
            ");
            $countStmt->execute([$searchTerm, $searchTerm, $searchTerm]);
            $total = $countStmt->fetch()['total'];
            
            echo json_encode(['results' => $results, 'total' => $total]);
            break;
            
        case 'duplicate_check':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
                break;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $urls = $input['urls'] ?? [];
            
            if (empty($urls)) {
                echo json_encode(['duplicates' => []]);
                break;
            }
            
            $placeholders = implode(',', array_fill(0, count($urls), '?'));
            $stmt = $pdo->prepare("
                SELECT destination_url, id, title FROM qr_redirects 
                WHERE destination_url IN ($placeholders)
            ");
            $stmt->execute($urls);
            
            $existing = $stmt->fetchAll();
            $duplicates = [];
            
            foreach ($existing as $row) {
                $duplicates[$row['destination_url']] = [
                    'qr_id' => $row['id'],
                    'title' => $row['title'],
                    'redirect_url' => BASE_URL . REDIRECT_PREFIX . $row['id']
                ];
            }
            
            echo json_encode(['duplicates' => $duplicates]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
    }
    
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Bulk manager error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error occurred']);
}
?>
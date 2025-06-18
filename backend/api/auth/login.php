
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';

header('Content-Type: application/json');

// Enable error logging
error_reporting(E_ALL);
ini_set('log_errors', 1);

// Simple JWT generation function
function generateJWT($payload) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode($payload);
    $secret = 'dsk_secret_key_2024'; // Use a secure secret in production
    
    $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $secret, true);
    $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $base64Header . "." . $base64Payload . "." . $base64Signature;
}

try {
    error_log("Login endpoint accessed");
    
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        error_log("Database connection failed");
        sendError(500, "Database connection failed");
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        error_log("Invalid request method: " . $_SERVER['REQUEST_METHOD']);
        sendError(405, "Method not allowed");
        exit;
    }

    $input = file_get_contents("php://input");
    error_log("Raw input: " . $input);
    
    $data = json_decode($input);

    if (!$data || !isset($data->username) || !isset($data->password)) {
        error_log("Missing username or password");
        sendError(400, "Username and password are required");
        exit;
    }

    $username = trim($data->username);
    $password = $data->password;
    $role = isset($data->role) ? strtolower(trim($data->role)) : null;

    error_log("Login attempt for username: $username, role: $role");

    // First try admin/staff users table
    if (!$role || $role === 'admin' || $role === 'staff') {
        $query = "SELECT id, user_id, username, password, role, name, email, status, department_id 
                  FROM users 
                  WHERE username = ? AND status = 'active'";
        
        $stmt = $db->prepare($query);
        if (!$stmt) {
            error_log("Failed to prepare users query: " . $db->errorInfo()[2]);
            sendError(500, "Database query error");
            exit;
        }
        
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            error_log("Found user in users table: " . $user['username'] . ", role: " . $user['role']);
            
            if (password_verify($password, $user['password'])) {
                // Get department info if exists
                $departmentName = null;
                if ($user['department_id']) {
                    $deptQuery = "SELECT name FROM departments WHERE id = ?";
                    $deptStmt = $db->prepare($deptQuery);
                    if ($deptStmt) {
                        $deptStmt->execute([$user['department_id']]);
                        $dept = $deptStmt->fetch(PDO::FETCH_ASSOC);
                        $departmentName = $dept ? $dept['name'] : null;
                    }
                }
                
                $token = generateJWT([
                    'user_id' => $user['id'],
                    'username' => $user['username'],
                    'role' => $user['role'],
                    'exp' => time() + (24 * 60 * 60) // 24 hours
                ]);
                
                // Insert session record
                try {
                    $sessionQuery = "INSERT INTO user_sessions (user_id, token, expires_at, is_valid) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), 1)";
                    $sessionStmt = $db->prepare($sessionQuery);
                    if ($sessionStmt) {
                        $sessionStmt->execute([$user['id'], $token]);
                    }
                } catch (Exception $e) {
                    error_log("Session creation failed: " . $e->getMessage());
                }
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Login successful',
                    'token' => $token,
                    'user' => [
                        'id' => $user['id'],
                        'user_id' => $user['user_id'],
                        'username' => $user['username'],
                        'role' => $user['role'],
                        'name' => $user['name'],
                        'email' => $user['email'],
                        'department_id' => $user['department_id'],
                        'department_name' => $departmentName
                    ]
                ]);
                exit;
            } else {
                error_log("Password verification failed for user: $username");
            }
        }
    }

    // Try public users table if not found in admin/staff or role is public
    if (!$role || $role === 'public') {
        $query = "SELECT id, public_id, username, password_hash, name, email, status 
                  FROM public_users 
                  WHERE username = ? AND status = 'active'";
        
        $stmt = $db->prepare($query);
        if (!$stmt) {
            error_log("Failed to prepare public_users query: " . $db->errorInfo()[2]);
            sendError(500, "Database query error");
            exit;
        }
        
        $stmt->execute([$username]);
        $publicUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($publicUser) {
            error_log("Found user in public_users table: " . $publicUser['username']);
            
            if (password_verify($password, $publicUser['password_hash'])) {
                // Ensure user ID is an integer
                $userId = (int)$publicUser['id'];
                
                $token = generateJWT([
                    'user_id' => $userId,
                    'public_id' => $publicUser['public_id'],
                    'username' => $publicUser['username'],
                    'role' => 'public',
                    'exp' => time() + (24 * 60 * 60) // 24 hours
                ]);
                
                // Insert session record
                try {
                    $sessionQuery = "INSERT INTO user_sessions (user_id, token, expires_at, is_valid) 
                                  VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), 1)";
                    $sessionStmt = $db->prepare($sessionQuery);
                    if ($sessionStmt) {
                        $sessionStmt->execute([$userId, $token]);
                        error_log("Created session for public user ID: " . $userId);
                    }
                } catch (Exception $e) {
                    error_log("Session creation failed: " . $e->getMessage());
                }
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Login successful',
                    'token' => $token,
                    'user' => [
                        'id' => $userId,
                        'public_id' => $publicUser['public_id'],
                        'username' => $publicUser['username'],
                        'role' => 'public',
                        'name' => $publicUser['name'],
                        'email' => $publicUser['email'],
                        'status' => $publicUser['status']
                    ]
                ]);
                exit;
            } else {
                error_log("Password verification failed for public user: $username");
            }
        }
    }

    // No user found with matching credentials
    error_log("Invalid credentials for username: $username");
    sendError(401, "Invalid username, password, or role");

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    sendError(500, "Login failed: " . $e->getMessage());
}
?>

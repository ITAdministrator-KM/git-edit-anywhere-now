<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        sendError(500, "Database connection failed");
        exit;
    }

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            getPublicUsers($db);
            break;
        case 'POST':
            createPublicUser($db);
            break;
        case 'PUT':
            updatePublicUser($db);
            break;
        case 'DELETE':
            deletePublicUser($db);
            break;
        default:
            sendError(405, "Method not allowed");
            break;
    }
} catch (Exception $e) {
    error_log("Public Users API Error: " . $e->getMessage());
    sendError(500, "Internal server error: " . $e->getMessage());
}

function generateSequentialPublicId($db) {
    // Get the last sequential number
    $stmt = $db->prepare("SELECT public_user_id FROM public_users WHERE public_user_id LIKE 'PUB%' ORDER BY CAST(SUBSTRING(public_user_id, 4) AS UNSIGNED) DESC LIMIT 1");
    $stmt->execute();
    $lastId = $stmt->fetchColumn();
    
    if ($lastId) {
        $lastNumber = intval(substr($lastId, 3));
        $newNumber = $lastNumber + 1;
    } else {
        $newNumber = 1;
    }
    
    return 'PUB' . str_pad($newNumber, 5, '0', STR_PAD_LEFT);
}

function getPublicUsers($db) {
    try {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $offset = ($page - 1) * $limit;
        
        // Get total count first
        $countQuery = "SELECT COUNT(*) as total FROM public_users WHERE status = 'active'";
        $countStmt = $db->query($countQuery);
        $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get paginated results
        $query = "SELECT pu.*, d.name as department_name, dvs.name as division_name 
                 FROM public_users pu 
                 LEFT JOIN departments d ON pu.department_id = d.id 
                 LEFT JOIN divisions dvs ON pu.division_id = dvs.id 
                 WHERE pu.status = 'active' 
                 ORDER BY pu.created_at DESC 
                 LIMIT ? OFFSET ?";
                 
        $stmt = $db->prepare($query);
        $stmt->execute([$limit, $offset]);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($users as &$user) {
            unset($user['password_hash']);
        }
        
        sendResponse([
            'users' => $users,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $totalCount,
                'pages' => ceil($totalCount / $limit)
            ]
        ], "Public users retrieved successfully");
    } catch (Exception $e) {
        error_log("Get public users error: " . $e->getMessage());
        sendError(500, "Failed to fetch public users: " . $e->getMessage());
    }
}

function createPublicUser($db) {
    try {
        $input = file_get_contents("php://input");
        if (empty($input)) {
            sendError(400, "Empty request body");
            return;
        }

        $data = json_decode($input);
        if (!$data) {
            sendError(400, "Invalid JSON data");
            return;
        }
        
        $requiredFields = ['name', 'nic', 'address', 'mobile', 'email', 'username'];
        foreach ($requiredFields as $field) {
            if (!isset($data->$field) || empty(trim($data->$field))) {
                sendError(400, "Missing required field: $field");
                return;
            }
        }
        
        if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
            sendError(400, "Invalid email format");
            return;
        }
        
        // Improved NIC validation for Sri Lankan format
        $nic = trim($data->nic);
        if (!preg_match('/^([0-9]{9}[vVxX]|[0-9]{12})$/', $nic)) {
            sendError(400, "Invalid NIC format. Use 9 digits followed by V/X or 12 digits");
            return;
        }
        
        // Check for existing username, email, or NIC
        $stmt = $db->prepare("SELECT COUNT(*) FROM public_users WHERE username = ? OR email = ? OR nic = ?");
        $stmt->execute([$data->username, $data->email, $nic]);
        
        if ($stmt->fetchColumn() > 0) {
            sendError(409, "Username, email, or NIC already exists");
            return;
        }
        
        $db->beginTransaction();
        
        // Generate sequential public_id
        $public_id = generateSequentialPublicId($db);
        
        $password_hash = null;
        if (isset($data->password) && !empty($data->password)) {
            $password_hash = password_hash($data->password, PASSWORD_DEFAULT);
        } else {
            $password_hash = password_hash('changeme', PASSWORD_DEFAULT);
        }
        
        $query = "INSERT INTO public_users (public_user_id, name, nic, address, mobile, email, username, password_hash, department_id, division_id, status) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')";
        
        $stmt = $db->prepare($query);
        $params = [
            $public_id,
            $data->name,
            $nic,
            $data->address,
            $data->mobile,
            $data->email,
            $data->username,
            $password_hash,
            (isset($data->department_id) && !empty($data->department_id)) ? $data->department_id : null,
            (isset($data->division_id) && !empty($data->division_id)) ? $data->division_id : null
        ];
        
        if (!$stmt->execute($params)) {
            throw new Exception("Failed to create public user");
        }
        
        $userId = $db->lastInsertId();
        
        // Generate QR code data
        $qrData = json_encode([
            'public_id' => $public_id,
            'name' => $data->name,
            'nic' => $nic,
            'created_at' => date('Y-m-d H:i:s')
        ]);
        
        // Store QR code in database
        $qrQuery = "INSERT INTO qr_codes (public_user_id, qr_code_data, qr_code_url) VALUES (?, ?, ?)";
        $qrStmt = $db->prepare($qrQuery);
        $qrUrl = "https://dskalmunai.lk/qr-scan/" . $public_id;
        $qrStmt->execute([$userId, $qrData, $qrUrl]);
        
        $db->commit();
        
        sendResponse([
            "public_id" => $public_id,
            "id" => $userId,
            "qr_code_data" => $qrData,
            "qr_code_url" => $qrUrl
        ], "Public user created successfully with QR code");
        
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Create public user error: " . $e->getMessage());
        sendError(500, "Failed to create public user: " . $e->getMessage());
    }
}

function updatePublicUser($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input);
        
        if (!$data || !isset($data->id)) {
            sendError(400, "Public user ID is required");
            return;
        }
        
        $db->beginTransaction();
        
        $stmt = $db->prepare("SELECT id, public_user_id FROM public_users WHERE id = ? AND status = 'active'");
        $stmt->execute([$data->id]);
        
        if ($stmt->rowCount() === 0) {
            sendError(404, "Public user not found");
            return;
        }
        
        $updateFields = [];
        $params = [];
        
        $allowedFields = ['name', 'nic', 'address', 'mobile', 'email', 'username', 'department_id', 'division_id'];
        
        foreach ($allowedFields as $field) {
            if (isset($data->$field)) {
                if ($field === 'email' && !filter_var($data->$field, FILTER_VALIDATE_EMAIL)) {
                    sendError(400, "Invalid email format");
                    return;
                }
                
                $updateFields[] = "$field = ?";
                $params[] = $data->$field;
            }
        }
        
        if (isset($data->password) && !empty($data->password)) {
            $updateFields[] = "password_hash = ?";
            $params[] = password_hash($data->password, PASSWORD_DEFAULT);
        }
        
        if (empty($updateFields)) {
            sendError(400, "No fields to update");
            return;
        }
        
        $query = "UPDATE public_users SET " . implode(", ", $updateFields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        $params[] = $data->id;
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        
        $db->commit();
        sendResponse(["id" => $data->id], "Public user updated successfully");
        
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Update public user error: " . $e->getMessage());
        sendError(500, "Failed to update public user: " . $e->getMessage());
    }
}

function deletePublicUser($db) {
    try {
        $input = file_get_contents("php://input");
        $data = json_decode($input);
        
        if (!$data || !isset($data->id)) {
            sendError(400, "Public user ID is required");
            return;
        }
        
        $db->beginTransaction();
        
        $stmt = $db->prepare("SELECT id FROM public_users WHERE id = ? AND status = 'active'");
        $stmt->execute([$data->id]);
        
        if ($stmt->rowCount() === 0) {
            sendError(404, "Public user not found or already deleted");
            return;
        }
        
        $query = "UPDATE public_users SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$data->id]);
        
        $db->commit();
        sendResponse(["id" => $data->id], "Public user deleted successfully");
        
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Delete public user error: " . $e->getMessage());
        sendError(500, "Failed to delete public user: " . $e->getMessage());
    }
}
?>

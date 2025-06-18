
<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';
include_once '../../utils/auth.php';

header('Content-Type: application/json');

// Enable error logging
error_reporting(E_ALL);
ini_set('log_errors', 1);

// Verify authentication for write operations
if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'DELETE'])) {
    $authHeader = getAuthorizationHeader();
    if (!$authHeader || !validateToken($authHeader)) {
        error_log("Registry API: Authentication failed for " . $_SERVER['REQUEST_METHOD']);
        sendError(401, "Authentication required");
        exit;
    }
}

try {
    error_log("Registry API accessed: " . $_SERVER['REQUEST_METHOD']);
    
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        error_log("Registry API: Database connection failed");
        sendError(500, "Database connection failed");
        exit;
    }

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            getRegistryEntries($db);
            break;
        case 'POST':
            createRegistryEntry($db);
            break;
        default:
            error_log("Registry API: Method not allowed - " . $_SERVER['REQUEST_METHOD']);
            sendError(405, "Method not allowed");
            break;
    }
} catch (Exception $e) {
    error_log("Registry API Error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    sendError(500, "Internal server error");
}

function generateRegistryId($db) {
    try {
        $stmt = $db->prepare("SELECT registry_id FROM registry_entries WHERE registry_id LIKE 'REG%' ORDER BY CAST(SUBSTRING(registry_id, 4) AS UNSIGNED) DESC LIMIT 1");
        $stmt->execute();
        $lastId = $stmt->fetchColumn();
        
        if ($lastId) {
            $lastNumber = intval(substr($lastId, 3));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return 'REG' . str_pad($newNumber, 5, '0', STR_PAD_LEFT);
    } catch (Exception $e) {
        error_log("Error generating registry ID: " . $e->getMessage());
        return 'REG' . str_pad(rand(1, 99999), 5, '0', STR_PAD_LEFT);
    }
}

function getRegistryEntries($db) {
    try {
        $date = $_GET['date'] ?? date('Y-m-d');
        $departmentId = $_GET['department_id'] ?? null;
        $search = $_GET['search'] ?? null;
        
        error_log("Getting registry entries for date: $date, department: $departmentId, search: $search");
        
        $query = "SELECT re.*, pu.name as public_user_name, pu.public_id,
                         d.name as department_name, dv.name as division_name
                  FROM registry_entries re 
                  LEFT JOIN public_users pu ON re.public_user_id = pu.id
                  LEFT JOIN departments d ON re.department_id = d.id 
                  LEFT JOIN divisions dv ON re.division_id = dv.id 
                  WHERE re.status = 'active' 
                  AND DATE(re.entry_time) = :date";
        
        $params = [':date' => $date];
        
        if ($departmentId) {
            $query .= " AND re.department_id = :department_id";
            $params[':department_id'] = $departmentId;
        }
        
        if ($search) {
            $query .= " AND (re.visitor_name LIKE :search 
                           OR re.visitor_nic LIKE :search 
                           OR re.registry_id LIKE :search)";
            $params[':search'] = "%$search%";
        }
        
        $query .= " ORDER BY re.entry_time DESC";
        
        $stmt = $db->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare query: " . implode(', ', $db->errorInfo()));
        }
        
        $stmt->execute($params);
        $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("Found " . count($entries) . " registry entries");
        
        echo json_encode([
            "status" => "success",
            "message" => "Registry entries retrieved successfully",
            "data" => $entries
        ]);
        
    } catch (Exception $e) {
        error_log("Get registry entries error: " . $e->getMessage());
        sendError(500, "Failed to fetch registry entries: " . $e->getMessage());
    }
}

function createRegistryEntry($db) {
    try {
        $input = file_get_contents("php://input");
        error_log("Registry creation input: " . $input);
        
        $data = json_decode($input);
        
        if (!$data || !isset($data->visitor_name) || !isset($data->visitor_nic) || 
            !isset($data->department_id) || !isset($data->purpose_of_visit)) {
            error_log("Missing required fields for registry entry");
            sendError(400, "Missing required fields: visitor_name, visitor_nic, department_id, purpose_of_visit");
            return;
        }
        
        $db->beginTransaction();
        
        // Generate registry ID
        $registry_id = generateRegistryId($db);
        error_log("Generated registry ID: " . $registry_id);
        
        $query = "INSERT INTO registry_entries (
            registry_id, public_user_id, visitor_name, visitor_nic, visitor_address,
            visitor_phone, department_id, division_id, purpose_of_visit, remarks,
            visitor_type, status, staff_user_id
        ) VALUES (
            :registry_id, :public_user_id, :visitor_name, :visitor_nic, :visitor_address,
            :visitor_phone, :department_id, :division_id, :purpose_of_visit, :remarks,
            :visitor_type, 'active', :staff_user_id
        )";
        
        $stmt = $db->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare insert query: " . implode(', ', $db->errorInfo()));
        }
        
        $params = [
            ':registry_id' => $registry_id,
            ':public_user_id' => $data->public_user_id ?? null,
            ':visitor_name' => $data->visitor_name,
            ':visitor_nic' => $data->visitor_nic,
            ':visitor_address' => $data->visitor_address ?? null,
            ':visitor_phone' => $data->visitor_phone ?? null,
            ':department_id' => $data->department_id,
            ':division_id' => $data->division_id ?? null,
            ':purpose_of_visit' => $data->purpose_of_visit,
            ':remarks' => $data->remarks ?? null,
            ':visitor_type' => $data->visitor_type ?? 'new',
            ':staff_user_id' => $data->created_by ?? null
        ];
        
        if (!$stmt->execute($params)) {
            throw new Exception("Failed to execute insert: " . implode(', ', $stmt->errorInfo()));
        }
        
        $entryId = $db->lastInsertId();
        error_log("Created registry entry with ID: " . $entryId);
        
        $db->commit();
        
        echo json_encode([
            "status" => "success",
            "message" => "Registry entry created successfully",
            "data" => [
                'id' => $entryId,
                'registry_id' => $registry_id
            ]
        ]);
        
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Create registry entry error: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        sendError(500, "Failed to create registry entry: " . $e->getMessage());
    }
}
?>

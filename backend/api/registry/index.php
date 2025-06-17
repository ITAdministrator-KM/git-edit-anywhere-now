<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../config/error_handler.php';
include_once '../../utils/auth.php';

header('Content-Type: application/json');

// Verify authentication for write operations
if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'DELETE'])) {
    $authHeader = getAuthorizationHeader();
    if (!$authHeader || !validateToken($authHeader)) {
        sendError(401, "Authentication required");
        exit;
    }
}

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
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
            sendError(405, "Method not allowed");
            break;
    }
} catch (Exception $e) {
    error_log("Registry API Error: " . $e->getMessage());
    sendError(500, "Internal server error");
}

function generateRegistryId($db) {
    $stmt = $db->prepare("SELECT registry_id FROM public_registry WHERE registry_id LIKE 'REG%' ORDER BY CAST(SUBSTRING(registry_id, 4) AS UNSIGNED) DESC LIMIT 1");
    $stmt->execute();
    $lastId = $stmt->fetchColumn();
    
    if ($lastId) {
        $lastNumber = intval(substr($lastId, 3));
        $newNumber = $lastNumber + 1;
    } else {
        $newNumber = 1;
    }
    
    return 'REG' . str_pad($newNumber, 5, '0', STR_PAD_LEFT);
}

function getRegistryEntries($db) {
    try {
        $date = $_GET['date'] ?? date('Y-m-d');
        $departmentId = $_GET['department_id'] ?? null;
        $search = $_GET['search'] ?? null;
        
        $query = "SELECT pr.*, pu.name as public_user_name, pu.public_user_id,
                         d.name as department_name, dv.name as division_name
                  FROM public_registry pr 
                  LEFT JOIN public_users pu ON pr.public_user_id = pu.id
                  LEFT JOIN departments d ON pr.department_id = d.id 
                  LEFT JOIN divisions dv ON pr.division_id = dv.id 
                  WHERE pr.status = 'active' 
                  AND DATE(pr.entry_time) = :date";
        
        $params = [':date' => $date];
        
        if ($departmentId) {
            $query .= " AND pr.department_id = :department_id";
            $params[':department_id'] = $departmentId;
        }
        
        if ($search) {
            $query .= " AND (pr.visitor_name LIKE :search 
                           OR pr.visitor_nic LIKE :search 
                           OR pr.registry_id LIKE :search)";
            $params[':search'] = "%$search%";
        }
        
        $query .= " ORDER BY pr.entry_time DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        
        $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse($entries, "Registry entries retrieved successfully");
    } catch (Exception $e) {
        error_log("Get registry entries error: " . $e->getMessage());
        sendError(500, "Failed to fetch registry entries");
    }
}

function createRegistryEntry($db) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!$data || !isset($data->visitor_name) || !isset($data->visitor_nic) || 
            !isset($data->department_id) || !isset($data->purpose_of_visit)) {
            sendError(400, "Missing required fields");
            return;
        }
        
        $db->beginTransaction();
        
        // Generate registry ID
        $registry_id = generateRegistryId($db);
        
        $query = "INSERT INTO public_registry (
            registry_id, public_user_id, visitor_name, visitor_nic, visitor_address,
            visitor_phone, department_id, division_id, purpose_of_visit, remarks,
            visitor_type, status, created_by
        ) VALUES (
            :registry_id, :public_user_id, :visitor_name, :visitor_nic, :visitor_address,
            :visitor_phone, :department_id, :division_id, :purpose_of_visit, :remarks,
            :visitor_type, 'active', :created_by
        )";
        
        $stmt = $db->prepare($query);
        
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
            ':created_by' => $data->created_by ?? null
        ];
        
        if (!$stmt->execute($params)) {
            throw new Exception("Failed to create registry entry");
        }
        
        $entryId = $db->lastInsertId();
        
        $db->commit();
        
        sendResponse([
            'id' => $entryId,
            'registry_id' => $registry_id
        ], "Registry entry created successfully");
        
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Create registry entry error: " . $e->getMessage());
        sendError(500, "Failed to create registry entry");
    }
}

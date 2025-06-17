
<?php
include_once __DIR__ . '/error_handler.php';

// Handle CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, Accept");

// Force JSON for all responses
if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    $accept = isset($_SERVER['HTTP_ACCEPT']) ? $_SERVER['HTTP_ACCEPT'] : '';
    if (
        strpos($accept, 'application/json') === false && 
        strpos($accept, '*/*') === false
    ) {
        http_response_code(406);
        echo json_encode(array(
            "message" => "Only JSON requests are accepted",
            "acceptHeader" => $accept
        ));
        exit();
    }
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Clean any previous output
while (ob_get_level()) ob_end_clean();

// Setup output buffering with a callback to ensure clean JSON output
ob_start(function($output) {
    // If output is not empty and doesn't look like JSON
    if (!empty($output) && $output[0] !== '{' && $output[0] !== '[') {
        // Remove any whitespace before the first character
        $output = trim($output);
        // If it still doesn't look like JSON, wrap it
        if ($output[0] !== '{' && $output[0] !== '[') {
            return json_encode(["message" => strip_tags($output)]);
        }
    }
    return $output;
});

// Register shutdown function for fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        ob_end_clean();
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Internal Server Error",
            "details" => $error['message'],
            "code" => $error['type']
        ]);
    } else {
        ob_end_flush();
    }
});
?>

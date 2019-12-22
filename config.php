<?php
function getStaticRoutes()
{
    return array(
        '/api/v1/logo' => 'showLogo',
        '/api/v1/classify' => 'classifyImage',
        '/api/v1/login' => 'loginUser',
        '/api/v1/register' => 'createUser',
        '/api/v1/password-reset' => 'resetPassword',
        '/api/v1/mailing' => 'addToMailingList',
        '/api/v1/contact' => 'add_to_mailing_list',
        '/api/v1/monitors' => 'handlingMonitors',
        '/api/v1/traffic' => 'handlingTraffic',
        '/api/v1/traffic/all' => 'getTrafficEntriesAll',
        '/api/v1/traffic/days' => 'getTrafficDays',
        '/api/v1/traffic/bulk' => 'insertTrafficInBulk',
        '/api/v1/traffic/total' => 'getTrafficTotal',
        '/api/v1/gender' => 'handlingGender',
        '/api/v2/gender' => 'get_gender_entries_v2',
        '/api/v1/gender/all' => 'getGenderEntriesAll',
        '/api/v1/gender/bulk' => 'insertGendersInBulk',
        '/api/v1/gender/total' => 'getGendersTotal',
        '/api/v1/impression' => 'handlingImpression',
        '/api/v1/impression/all' => 'getImpressionEntriesAll',
        '/api/v1/impression/bulk' => 'insertImpressionInBulk',
        '/api/v1/impression/total' => 'getImpressionTotal',
        '/api/v1/account' => 'getUser',
        '/api/v1/account/password-reset' => 'resetPasswordLoggedIn',
        '/api/v1/account/invoice' => 'getUpcomingInvoice',
        '/api/v1/account/card' => 'handlingCard',
        '/api/v1/account/usage/start' => 'activateMeter',
        '/api/v1/account/usage/update' => 'updateUsage',
        '/api/v1/account/subscription' => 'handlingSubscription'


    );
}

function getWildCardRoutes()
{
    return array(
        "~\/api\/v1\/verify\/([a-zA-Z0-9-]+)~" => "verifyUser",
        "~\/api\/v1\/password-reset\/([a-zA-Z0-9-]+)~" => "resetPasswordByToken",
        "~\/api\/v1\/monitors\/daily\/([a-zA-Z0-9-]+)~" => "getMonitorsDaily",
        "~\/api\/v1\/monitors\/segments\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9-]+)~" => "deleteMonitorSegment",
        "~\/api\/v1\/monitors\/segments\/([a-zA-Z0-9-]+)~" => "handlingMonitorSegments",
        "~\/api\/v1\/monitors\/toggle\/([a-zA-Z0-9-]+)~" => "toggleMonitors",
        "~\/api\/v1\/monitors\/thumbnail\/([a-zA-Z0-9-]+)~" => "handlingMonitorThumbnail",
        "~\/api\/v1\/monitors\/([a-zA-Z0-9-]+)~" => "handlingMonitorId"
    );
}


function execute($routes, $url)
{
    foreach ($routes as $pattern => $callback) {
        if (preg_match($pattern, $url, $params)) {
            array_shift($params);
            $action = $callback;
            return array($action, $params);
        }
    }
}

function sendJson($json)
{
    header('Content-type: application/json');
    http_response_code($json["status"]);
    echo json_encode($json);
}

function check_isset_body($body, $params)
{
    $set = true;
    foreach ($params as $item) {
        if (!isset($body[$item]))
            $set = false;
    }
    return $set;
}

function subtract_from_date($timestamp, $duration, $unit)
{
    return strtotime("-" . $unit . " " . $duration . "", $timestamp);
}

function getAuthorizationHeader()
{
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { //Nginx or fast CGI
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        // Server-side fix for bug in old Android versions (a nice side-effect of this fix means we don't care about capitalization for Authorization)
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        //print_r($requestHeaders);
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    return $headers;
}

function isPost()
{
    return ($_SERVER['REQUEST_METHOD'] === 'POST');

}

function isGet()
{
    return ($_SERVER['REQUEST_METHOD'] === 'GET');

}

function get_micro_time()
{
    return microtime(true) * 1000;
}

function get_valid_durations()
{
    return $durations = array('minute', 'hour', 'day', 'week', 'fortnight', 'month', 'year');
}

function verify_user_token()
{
    $token = null;
    $headers = getAuthorizationHeader();
    error_log($headers);
    if (isset($headers)) {
        $token = explode(" ", $headers)[1];
    }
    if (!is_null($token)) {
        // Get our server-side secret key from a secure location.
        $serverKey = 'super-secret-will-change-later';
        try {
            return jwt_decode($token, $serverKey);
        } catch (Exception $e) {
            return false;
        }
    } else {
        return false;
    }
}


$G_MYSQLI_AFFECTED_ROWS = 0;
$G_MYSQLI_INSERT_ID = 0;
$G_MYSQLI_ERROR = "";
function queryDatabase($connection, $sent_query)
{
    global $G_MYSQLI_AFFECTED_ROWS, $G_MYSQLI_INSERT_ID, $G_MYSQLI_ERROR;
    $G_MYSQLI_AFFECTED_ROWS = 0;
    $G_MYSQLI_INSERT_ID = 0;
    $G_MYSQLI_ERROR = "";
    $result = mysqli_query($connection, $sent_query);
    $G_MYSQLI_AFFECTED_ROWS = mysqli_affected_rows($connection);
    $G_MYSQLI_INSERT_ID = mysqli_insert_id($connection);
    $G_MYSQLI_ERROR = mysqli_error($connection);

    return $result;
}

function getDB()
{
    $database_username = "root";
    $database_host = "127.0.0.1";
    $database_password = "";
    $database_name = "facenition";
    return mysqli_connect($database_host, $database_username, $database_password, $database_name);


}

function getAllRowsOfQuery($connection, $query)
{

    $query_results = queryDatabase($connection, $query);
    while ($row = $query_results->fetch_assoc()) {
        $rows[] = $row;
    }
    return !empty($query_results) ? $rows : array();

}

function base64UrlEncode($text)
{
    return str_replace(
        ['+', '/', '='],
        ['-', '_', ''],
        base64_encode($text)
    );
}

function jwt_encode($payload, $secret)
{
// Create the token header
    $header = json_encode([
        'typ' => 'JWT',
        'alg' => 'HS256'
    ]);
// Encode Header
    $base64UrlHeader = base64UrlEncode($header);
// Encode Payload
    $base64UrlPayload = base64UrlEncode($payload);
// Create Signature Hash
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
// Encode Signature to Base64Url String
    $base64UrlSignature = base64UrlEncode($signature);
// Create JWT
    $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    return $jwt;
}

function jwt_decode($jwt, $secret)
{
// split the token
    $tokenParts = explode('.', $jwt);
    $header = base64_decode($tokenParts[0]);
    $payload = base64_decode($tokenParts[1]);
    $signatureProvided = $tokenParts[2];
// check the expiration time - note this will cause an error if there is no 'exp' claim in the token
    $expiration = json_decode($payload, true)['exp'];
    $tokenExpired = (intval(get_micro_time() - $expiration) < 0);
// build a signature based on the header and payload using the secret
    $base64UrlHeader = base64UrlEncode($header);
    $base64UrlPayload = base64UrlEncode($payload);
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $base64UrlSignature = base64UrlEncode($signature);
// verify it matches the signature provided in the token
    $signatureValid = ($base64UrlSignature === $signatureProvided);
    if ($tokenExpired) {
        throw new Exception("Token has expired.\n");
    }
    if (!$signatureValid) {
        throw new Exception("The signature is NOT valid\n");
    }
    return $payload;
}



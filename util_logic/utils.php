<?php
function execute($routes, $url)
{
    foreach ($routes as $pattern => $callback) {
        if (preg_match($pattern, $url, $params)) {
            array_shift($params);
            $controller = explode('/', $callback);
            include_once("./domain_logic/$controller[0].php");
            $action = $controller[1];
            return array($action, $params);
        }
    }
}

function sendJson($json)
{
    header('Content-type: application/json');
    echo $json;

}
function check_isset_body($body, $params) {
    $set = true;
    foreach($params as $item) {
        if(!isset($body[$item]))
            $set = false;
    }
    return $set;
}
function getAuthorizationHeader(){
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    }
    else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { //Nginx or fast CGI
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
function get_micro_time() {
    return microtime(true) * 1000;
}
function get_valid_durations() {
    return $durations = array('minute', 'hour', 'day', 'week', 'fortnight', 'month', 'year');
}
function verify_user_token() {
    $token = null;
    $headers = getAuthorizationHeader();
    error_log($headers);
    if (isset($headers)) { $token = explode(" ", $headers)[1]; }
    if (!is_null($token)) {
        require_once('jwt.php');
        // Get our server-side secret key from a secure location.
        $serverKey = 'super-secret-will-change-later';
        try {
            return JWT::decode($token, $serverKey, array('HS256'));
        } catch(Exception $e) {
            return false;
        }
    } else {
        return false;
    }
}
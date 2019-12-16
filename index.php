<?php
require_once("./config/db_config.php");
require_once("./jwt.php");
require_once("./stripe.php");
$route = $_SERVER['REQUEST_URI'];
require_once("./util_logic/utils.php");
$route = rtrim($route, '/\\');
$route_config = require("config/static_route_config.php");
$regex_route_config = require("config/wildcard_route_config.php");
$controller = "default_controller";
$query=array();
if (isset($_SERVER["QUERY_STRING"])) {
    $query=parse_url($_SERVER["QUERY_STRING"]);
    $route = strtok($route, '?');
    $controller = $route_config[$route];
    $split_path = explode('/', $controller);
    $handling_file = $split_path[0];
    $action = $split_path[1];
    if (file_exists("./domain_logic/{$handling_file}.php")) {
        include_once("./domain_logic/{$handling_file}.php");
        if (is_callable($action)) $json_info = $action($query);
        if (isset($json_info)) sendJson($json_info);
    }




}

if (array_key_exists($route, $route_config) && empty($query)) {
    $controller = $route_config[$route];
    $split_path = explode('/', $controller);
    $handling_file = $split_path[0];
    $action = $split_path[1];
    if (file_exists("./domain_logic/{$handling_file}.php")) {
        include_once("./domain_logic/{$handling_file}.php");
        if (is_callable($action)) $json_info = $action();
        if (isset($json_info)) sendJson($json_info);
    }
} else {
    list($controller, $params) = execute($regex_route_config, $route);
    if (is_callable($controller) && isset($params))
        sendJson(call_user_func_array($controller, array_values($params)));
    else $controller = "default_controller";
}
if ($controller == "default_controller") {
    include_once("./domain_logic/default_controller.php");
    sendJson(defaultAction());
}




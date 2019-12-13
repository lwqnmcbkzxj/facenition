<?php
require_once("./config/db_config.php");
$route = $_SERVER['REQUEST_URI'];
$route = rtrim($route, '/\\');
$route_config = require("config/static_route_config.php");
include("./util_logic/utils.php");
$regex_route_config = require("config/wildcard_route_config.php");
$controller = "default_controller";
if (array_key_exists($route, $route_config)) {
    $controller = $route_config[$route];
    $split_path = explode('/', $controller);
    $handling_file = $split_path[0];
    $action = $split_path[1];
    if (file_exists("./domain_logic/$handling_file.php")) {
        include_once("./domain_logic/$handling_file.php");
        json_send($action());
    }
} else {
    list($controller, $params) = execute($regex_route_config, $route);
    json_send(call_user_func_array($controller, array_values($params)));
}
if ($controller == "default_controller") {
    include_once("./domain_logic/default_controller.php");
    json_send(defaultAction());
}




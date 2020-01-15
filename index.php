<?php
require_once("include.php");
require_once("actions.php");
require_once("stripe_fun.php");
$route = $_SERVER['REQUEST_URI'];
$route = preg_replace('/\?.*/', '', $route);
$route = rtrim($route, '/\\');
$action = "default_action";
$static_routes = getStaticRoutes();
if (array_key_exists($route, $static_routes)) {
    $action = $static_routes[$route];
    if (is_callable($action)) $json_info = $action();
    if (isset($json_info)) sendJson($json_info);

} else {
    list($action, $params) = execute(getWildCardRoutes(), $route);
    if (is_callable($action) && isset($params))
        sendJson(call_user_func_array($action, array_values($params)));
    else $action = "default_action";
}
if ($action == "default_action") {
    sendJson(defaultAction());
}


?>


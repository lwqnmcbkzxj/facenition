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
    // sendJson(defaultAction());
}




// Вытаскиваем конфиг в ассоциативный массив
$jsonString = file_get_contents(__DIR__ . '/data/config.json');
$config = json_decode($jsonString, true);

// Определяем текущую страницу
$page = trim($_SERVER['REQUEST_URI'], '/');
$page = explode("?", $page)[0];

// Если $page == '', то есть REQUEST_URI = '/', то эта страница главная
if ($page == '') {
    $page = $config['mainPage'];
}

// Заголовок сайта
$siteTitle = $config['siteTitle'];

// Если страница не существует, возвращаем 404 Not Found
if (!isset($config['pages'][$page])) {
    // Отдаем код 404
    header('HTTP/1.0 404 Not Found');

    // Подключаем шаблон 404 страницы
    include_once __DIR__ . '/tpl/404.php';
    die;
}

// Заголовок и меню страницы
$pageData = $config['pages'][$page];
$pageTitle = $pageData['title'];
$header = $pageData['header'];
$headerContent;
$footerContent;
if ($header) {
    $headerContent = file_get_contents(__DIR__ . '/static/dashboard-header.html');
    $footerContent = file_get_contents(__DIR__ . '/static/dashboard-footer.html');
} else {
    $headerContent = file_get_contents(__DIR__ . '/static/header.html');
    $footerContent = file_get_contents(__DIR__ . '/static/footer.html');
}
// Содержимое страницы
$content = file_get_contents(__DIR__ . '/static/' . $page . '.html');

// Подключаем шаблон главной страницы
include_once __DIR__ . '/tpl/index.php';

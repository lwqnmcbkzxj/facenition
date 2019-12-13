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

function json_send($json)
{
    header('Content-type: application/json');
    echo $json;

}
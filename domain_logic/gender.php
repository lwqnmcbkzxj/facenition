<?php
include_once("./config/db_config.php");
function handler()
{
    $pdo = getDB();
    return json_encode(array("status" => "200"));
}
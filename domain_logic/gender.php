<?php
function handler()
{
    $pdo = getDB();
    return json_encode(array("status" => "200"));
}
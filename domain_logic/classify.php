<?php
include_once('./util_logic/utils.php');
function classifyImage()
{
    if (!isPost()) {
        http_response_code(405);
        return json_encode(array("status" => 405));
    }
    if (!isset($_FILES["image"])) {
        http_response_code(400);
        $return_json = array("status" => 400, "msg" => "Missing input image", "success" => false);

    }
    $fileName = uniqid();
    $targetDir = $_SERVER['DOCUMENT_ROOT'] . "/classify/";
    $targetFilePath = $targetDir . $fileName;
    $fileType = pathinfo($_FILES["image"]["name"], PATHINFO_EXTENSION);
    $allowTypes = array('jpg', 'jpeg');
    if (!in_array($fileType, $allowTypes)) {
        http_response_code(400);
        $return_json = array("status" => 400, "msg" => "Incompatible filetype. Should be one of (jpg, jpeg, png)", "success" => false);
    }
    move_uploaded_file($_FILES["thumbnail"]["tmp_name"], $targetFilePath . "." . $fileType);
    shell_exec('./imid_ml ' . $targetFilePath . "." . $fileType . ' 1 ' . $targetFilePath . "_out.jpg");
    $file = $targetFilePath . "_out.jpg";
    $type = 'image/jpg';
    header('Content-Type:' . $type);
    header('Content-Length: ' . filesize($file));
    readfile($file);

}
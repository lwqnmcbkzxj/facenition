<?php
function verifyUser($verify_token)
{
    $pdo = getDB();
    $sql = 'SELECT * from users WHERE verify_token = :verify_token';
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':verify_token', $verify_token);
    $stmt->execute();
    if ($stmt->rowCount() > 0) {
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $user_id = $rows[0]["id"];
        $sql_update = 'UPDATE users SET active = :active WHERE id = :user_id';
        $stmt_update = $pdo->prepare($sql_update);
        $stmt_update->bindValue(':active', true);
        $stmt_update->bindValue(':user_id', $user_id);
        $stmt_update->execute();

        // SEND MAIL (WELCOME MAIL)
        http_response_code(200);
        return $arr_json = json_encode(array('msg' => "Verified user account", "success" => true));
    } else {
        http_response_code(400);
        return $arr_json = json_encode(array('msg' => "No user with that token", "success" => false));
    }
}


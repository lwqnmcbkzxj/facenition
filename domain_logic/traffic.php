<?php
function getTrafficEntriesAll($query) {
    $user = verify_user_token();
    if(is_bool($user)) {
        http_response_code(401);
        return array("status" => 401, "success" => false);
    }
    $pdo = getDB();
    // shift param is not required
    $params = array("start", "end", "duration");
    if(!check_isset_body($query, $params) || !in_array($query["duration"], get_valid_durations())) {
        http_response_code(400);
        return array("status" => 400, "msg" => "Missing required query parameters", "success" => false);
    }

    $start = intval($query["start"]);
    $end = intval($query["end"]);
    $duration = $query["duration"];

    $sql = 'SELECT created, SUM(value) AS total, monitor_id, FROM_UNIXTIME(created/1000) AS time FROM traffic WHERE created <= :end AND created >= :start AND user_id = :user_id GROUP BY '.$duration.'(time), monitor_id';
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':end', $end);
    $stmt->bindValue(':start', $start);
    $stmt->bindValue(':user_id', $user->id);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    return json_encode(array("status" => 200, "msg" => "Retrieved traffic entries in range for monitor", "data" => $rows, "success" => true));
}
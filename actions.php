<?php
/*
 * DEFAULT
 */
function defaultAction()
{
    return array(
        "status" => "404"
    );
}

/*
 * USERS
 */
function verifyUser($verify_token)
{
    if (!isGet()) {
        return array("status" => 405, "success" => false);
    }
    $db = getDB();
    $verify_token = mysqli_real_escape_string($db, $verify_token);
    $sql = "SELECT * from users WHERE verify_token = \"$verify_token\"";
    $res = getAllRowsOfQuery($db, $sql);
    if (!empty($res)) {
        $rows = $res;
        $user_id = mysqli_real_escape_string($db, $rows[0]["id"]);
        $sql_update = "UPDATE users SET active = true WHERE id = \"$user_id\"";
        queryDatabase($db, $sql_update);
        if (empty(mysqli_error($db)))
            return array("status" => 200, 'msg' => "Verified user account", "success" => true);

        return array("status" => 500, 'msg' => "Server error", "success" => false);
    } else {
        return array("status" => 401, 'msg' => "No user with that token", "success" => false);
    }
}

function loginUser()
{
    if (!isPost()) {
        return array("status" => 405, "success" => false);
    }
    $body = json_decode(file_get_contents('php://input'), true);
    $email = $body["email"];
    $password = $body["password"];
    $db = getDB();
    $email = mysqli_real_escape_string($db, $email);
    if (empty($email) || empty($password)) return array("status" => 400, 'msg' => "Email or password incorrect", "success" => false);
    $sql = "SELECT * FROM users WHERE email = \"$email\"";
    $res = getAllRowsOfQuery($db, $sql);
    if (!empty($res)) {
        $rows = $res;
        $password_match = password_verify($password, $rows[0]["password"]);
        if ($password_match) {
            $userId = 'some-user-id';
            // Get our server-side secret key from a secure location.
            $skey = 'super-secret-will-change-later';
            $token = jwt_encode(json_encode($rows[0]), $skey);
            $data = array("status" => 200, "msg" => "Successfully signed in!", "token" => $token, "success" => true);
            return $data;
        } else {
            return array("status" => 400, 'msg' => "Email or password incorrect", "success" => false);
        }
    } else {

        return array("status" => 400, 'msg' => "Email or password incorrect", "success" => false);
    }

}

function createUser()
{
    if (!isPost()) {
        return array("status" => 405, "success" => false);
    }
    $db = getDB();
    $body = json_decode(file_get_contents('php://input'), true);
    $email = mysqli_real_escape_string($db, $body["email"]);
    $password = mysqli_real_escape_string($db, $body["password"]);
    $plan = mysqli_real_escape_string($db, $body["plan"]);
    $user_id = uniqid();
    $verify_token = uniqid();
    if (empty($email) || empty ($password)) return array("status" => 400, "msg" => "Invalid body", "success" => false);
    $sql = "SELECT * FROM users WHERE email = \"$email\" AND mailing_list_only = 0";
    $res = getAllRowsOfQuery($db, $sql);
    if (empty($res)) {
        $customer = json_decode(customer_create($email), true);
        $subscription = json_decode(customer_subscribe($customer["id"], $plan), true);
        $subscription_item_id = $subscription["items"]["data"][0]["id"];
        # We can successfully create the user in this scenario
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $sql_insert = "REPLACE INTO users (id, email, password, created, customer_id, subscription_id, subscription_item_id, verify_token, mailing_list_only) 
VALUES (\"$user_id\", \"$email\", \"$hash\", " . get_micro_time() . ", \"{$customer['id']}\", \"{$subscription['$id']}\",\"$subscription_item_id\", \"$verify_token\", 0)";
        queryDatabase($db, $sql_insert);
        if (empty(mysqli_error($db))) {
            $to = $email;
            $subject = "Facenition";
            $txt = "Verify your email address! verify $verify_token";
            $headers = "From: admin@app.facenition.com" . "\r\n";
            mail($to, $subject, $txt, $headers);
            return array("status" => 200, 'msg' => "Successfully created user account! Please check your email.", "success" => true);
        } else  return array("status" => 500, "msg" => "Server error", "success" => false);

    } else {
        return array("status" => 400, 'msg' => "Account with that email already exists", "success" => false);
    }
}

function resetPassword()
{
    if (!isPost()) {
        return array("status" => 405, "success" => false);
    }
    $body = json_decode(file_get_contents('php://input'), true);
    $db = getDB();
    $email = mysqli_escape_string($db, $body["email"]);
    $sql = "SELECT * from password_resets WHERE email = '{$email}'";
    $res = getAllRowsOfQuery($db, $sql);
    if (empty($res)) {
        $reset_id = uniqid();
        $reset_token = uniqid();
        $sql_insert = "INSERT into password_resets (id, email, reset_token, created) VALUES (\"$reset_id\", \"$email\", \"$reset_token\", " . get_micro_time() . ")";
        queryDatabase($db, $sql_insert);
        if (empty(mysqli_error($db))) {
            $to = $email;
            $subject = "Facenition";
            $txt = "Password reset! reset token $reset_token";
            $headers = "From: admin@app.facenition.com" . "\r\n";
            mail($to, $subject, $txt, $headers);
            return array("status" => 200, 'msg' => 'Reset request successfully submitted! Follow email instructions', "success" => true);
        } else return array("status" => 500, "msg" => "Server error", "success" => false);

    } else {
        return array("status" => 400, 'msg' => "Password reset request already exists!", "success" => false);
    }
}

/**/
function resetPasswordByToken($param)
{
    if (!isPost()) {
        return array("status" => 405, "success" => false);
    }
    $body = json_decode(file_get_contents('php://input'), true);
    $db = getDB();
    $token = mysqli_real_escape_string($db, $param);
    $password = mysqli_real_escape_string($db, $body);
    $sql = "SELECT * from password_resets where reset_token=\"$token\"";
    $rows = getAllRowsOfQuery($db, $sql);
    if (!$rows) return array("status" => 400, "msg" => "Failed to reset password, no reset request by that id", "success" => false);
    $email = $rows[0]['email'];
    $sql = "SELECT * from users where email=\"$email\"";
    $rows = getAllRowsOfQuery($db, $sql);
    $user_id = $rows[0]["id"];
    $password = password_hash($password, PASSWORD_BCRYPT);
    $sql = "UPDATE users SET password =\"$password\" WHERE id =\"$user_id\"";
    queryDatabase($db, $sql);
    $sql = "DELETE FROM password_resets WHERE reset_token=\"$token\"";
    queryDatabase($db, $sql);
    if (empty(mysqli_error($db))) {
        $to = $email;
        $subject = "Facenition";
        $txt = "Password changed";
        $headers = "From: admin@app.facenition.com" . "\r\n";
        mail($to, $subject, $txt, $headers);
        return array("status" => 200, 'msg' => 'Successfully changed password!', "success" => true);
    } else return array("status" => 500, "msg" => "Server error", "success" => false);

}

function joinMailingList()
{
    if (!isGet()) return array("status" => 405, "success" => false);

    $user_id = uniqid();
    $db = getDB();
    $email = mysqli_real_escape_string($db, $_GET["email"]);
    $sql = "SELECT * from users where email = \"$email\"";
    $rows = getAllRowsOfQuery($db, $sql);
    if (!$rows) {
        $created = get_micro_time();
        $sql_insert = "INSERT INTO users (id, email, created, mailing_list_only) VALUES (\"$user_id\", \"$email\", \"$created\", true)";
        queryDatabase($db, $sql_insert);
        if (empty(mysqli_error($db)))
            return array("status" => 200, 'msg' => "Succesfully signed up to mailing list", "success" => true);
        else
            return array("status" => 500, "success" => false);
    } else {
        return array("status" => 400, 'msg' => "Mail already exists", "success" => false);
    }
}

function submitContactForm()
{
    if (!isPost()) {
        return array("status" => 405, "success" => false);
    }
    $db = getDB();
    $max_submissions = 5;
    $params = array("email", "name", "message");
    if (!check_isset_body($_POST, $params)) return array("status" => 400, "success" => false);
    $email = mysqli_real_escape_string($db, $_POST["email"]);
    $name = mysqli_real_escape_string($db, $_POST["name"]);
    $message = mysqli_real_escape_string($db, $_POST["message"]);
    $ip = $_SERVER['REMOTE_ADDR'];
    $sql = "SELECT * FROM submitted_contact_forms WHERE ip = \"$ip\"";
    $rows = getAllRowsOfQuery($db, $sql);
    if ($rows <= $max_submissions) {
        $sql_insert = "INSERT INTO submitted_contact_forms (ip) VALUES ($ip)";
        if (!queryDatabase($db, $sql_insert)) return array("status" => 500, "success" => false);
        $to = "info@facenition.com";
        $subject = "Facenition";
        $txt = "Resetting password reset $email $name $message";
        $headers = "From: admin@app.facenition.com" . "\r\n";
        mail($to, $subject, $txt, $headers);
        return array("status" => 200, 'msg' => "Submitted contact form", "success" => true,
            "data" => array("email" => $email, "name" => $name, "message" => $message, "ip" => $ip));
    } else {
        return array("status" => 400, 'msg' => "Submitted too many times already, please wait a day or so", "success" => false);
    }
}

/*
 * USERS
 */
/*
 *
 */
/*
 * MONITORS
 */
function handlingMonitors()
{
    $user = json_decode(verify_user_token(), true);
    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $user_id = $user['id'];
    switch ($_SERVER["REQUEST_METHOD"]) {
        case 'GET':
            {

                $db = getDB();
                $time = get_micro_time();
                $time = strtotime("today", $time);
                $sql = "SELECT id, name, traffic, genders, impressions, created, (SELECT SUM(value) from traffic WHERE monitor_id = monitors . id AND created > $time) as daily_count FROM monitors WHERE user_id = \"{
    $user_id}\" ORDER BY created ASC";
                $rows = getAllRowsOfQuery($db, $sql);
                return array("status" => 200, "msg" => "Retrieved monitors", "data" => $rows, "success" => true);
            }

            break;
        case
        'POST':
            {
                $body = array_map('htmlspecialchars', json_decode(file_get_contents('php://input'), true));
                $params = array("name", "genders", "traffic", "impressions");
                if (!check_isset_body($body, $params)) {
                    return array("status" => 400, "msg" => "Missing required parameters", "success" => false);
                }
                $db = getDB();
                $time = get_micro_time();
                $name = mysqli_real_escape_string($db, $body["name"]);
                $genders = mysqli_escape_string($db, $body["genders"]);
                $traffic = mysqli_real_escape_string($db, $body["traffic"]);
                $impressions = mysqli_real_escape_string($db, $body["impressions"]);
                $monitor_id = uniqid();

                $sql = "INSERT INTO monitors (id, user_id, name, traffic, genders, impressions, created) VALUES(\"$monitor_id\", \"$user_id\", \"$name\", \"$traffic\", \"$genders\", \"$impressions\", \"$time\")";
                queryDatabase($db, $sql);
                if (empty(mysqli_error($db)))
                    return array("status" => 200, "msg" => "Created monitor", "success" => true);
                else return array("status" => 500, "msg" => "Server error", "success" => true);
            }
            break;

    }
    return array("status" => 405, "success" => false);

}

function handlingMonitorSegments($param)
{
    $user = json_decode(verify_user_token(), true);
    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    # $user_id = $user['id'];
    switch ($_SERVER["REQUEST_METHOD"]) {
        case 'GET':
            {
                $db = getDB();
                $monitor_id = mysqli_real_escape_string($db, $param);
                $sql = "SELECT id, start, end, name, created FROM monitor_segments WHERE monitor_id = \"$monitor_id\"";
                $rows = getAllRowsOfQuery($db, $sql);
                return array("status" => 200, "msg" => "Retrieved monitor segments", "data" => $rows, "success" => true);
            }
            break;

        case 'POST':
            {
                $body = array_map('htmlspecialchars', json_decode(file_get_contents('php://input'), true));
                $params = array("name", "start", "end");
                $db = getDB();
                $monitor_id = mysqli_real_escape_string($db, $param);
                if (!check_isset_body($body, $params) || !isset($monitor_id)) {
                    return array("status" => 400, "msg" => "Missing required parameters", "success" => false);
                }
                $name = $body["name"];
                $start = $body["start"];
                $end = $body["end"];
                $created = get_micro_time();
                $sql = "INSERT INTO monitor_segments (monitor_id, name, start, end, created) VALUES (\"$monitor_id\", \"$name\", \"$start\", \"$end\", $created)";
                queryDatabase($db, $sql);
                if (empty(mysqli_error($db)))
                    return array("status" => 200, "msg" => "Created monitor segment", "success" => true);
                else return array("status" => 500, "msg" => "Server error", "success" => true);

            }
            break;


    }
    return array("status" => 405, "success" => false);

}

function deleteMonitorSegment($param_1, $param_2)
{
    $user = verify_user_token();
    if (is_bool($user)) {
        return array("status" => 401, "success" => false);
    }
    if ($_SERVER["REQUEST_METHOD"] != 'DELETE') return array("status" => 405, "success" => false);
    $monitor_id = htmlspecialchars($param_1);
    $segment_id = htmlspecialchars($param_2);
    if (!isset($monitor_id) || !isset($segment_id)) {

        return array("status" => 400, "msg" => "Missing required parameters", "success" => false);
    }
    $db = getDB();
    $monitor_id = mysqli_real_escape_string($db, $monitor_id);
    $segment_id = mysqli_real_escape_string($db, $segment_id);
    $sql = "DELETE FROM monitor_segments WHERE monitor_id = \"$monitor_id\" AND id = \"$segment_id\"";
    queryDatabase($db, $sql);
    if (empty(mysqli_error($db)))
        return array("status" => 200, "msg" => "Deleted monitor segment", "success" => true);
    else return array("status" => 500, "msg" => "Server error", "success" => true);

}

function handlingMonitorId($param)
{
    $user = json_decode(verify_user_token(), true);
    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $user_id = $user['id'];
    switch ($_SERVER["REQUEST_METHOD"]) {

        case 'GET':
            {
                $db = getDB();
                $monitor_id = mysqli_real_escape_string($db, $param);
                $sql = "SELECT id, name, traffic, genders, impressions, active, created FROM monitors WHERE user_id=\"{$user_id}\" AND id=\"{$monitor_id}\"";
                $rows = getAllRowsOfQuery($db, $sql);
                return array("status" => 200, "msg" => "Retrieved monitor segments", "data" => $rows, "success" => true);
            }
            break;

        case 'DELETE':
            {
                $db = getDB();
                $monitor_id = mysqli_real_escape_string($db, $param);
                $sql = "DELETE FROM monitors WHERE id=\"$monitor_id\" AND user_id=\"{$user_id}\"";
                queryDatabase($db, $sql);
                if (empty(mysqli_error($db)))
                    return array("status" => 200, "msg" => "Deleted monitor", "success" => true);
                else return array("status" => 500, "msg" => "Server error", "success" => true);
            }
            break;

    }
    return array("status" => 405, "success" => false);

}

function toggleMonitors($param)
{
    if (!isPost()) {
        return array("status" => 405, "success" => false);
    }
    $user = json_decode(verify_user_token(), true);
    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $user_id = $user['id'];
    $db = getDB();
    $monitor_id = mysqli_real_escape_string($db, $param);
    $sql = "UPDATE monitors SET active = 1 - active WHERE id = \"$monitor_id\" AND user_id = \"{$user_id}\"";
    if (empty(mysqli_error($db)))
        return array("status" => 200, "msg" => "Toggled monitors", "success" => true);
    else return array("status" => 500, "msg" => "Server error", "success" => true);


}

function handlingMonitorThumbnail($param)
{
    $user = json_decode(verify_user_token(), true);
    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $user_id = $user['id'];
    switch ($_SERVER["REQUEST_METHOD"]) {
        case 'GET':
            {
                $db = getDB();
                $monitor_id = mysqli_real_escape_string($db, $param);
                $sql = "SELECT thumbnail FROM monitors WHERE user_id=\"{$user_id}\" AND id=\"$monitor_id\"";
                $rows = getAllRowsOfQuery($db, $sql);
                if (!empty($rows))
                    return array("status" => 200, "msg" => "Retrieved thumbnail", "data" => $rows[0]["thumbnail"], "success" => true);
                else return array("status" => 500, "msg" => "Server error", "success" => false);
            }
            break;

        case 'POST':
            {
                if (!isset($_FILES["thumbnail"])) {
                    return array("status" => 400, "msg" => "Missing input image", "success" => false);
                }
                $fileName = uniqid();
                $targetDir = $_SERVER['DOCUMENT_ROOT'] . "/thumbnails/";
                $targetFilePath = $targetDir . $fileName;
                $fileType = pathinfo($_FILES["thumbnail"]["name"], PATHINFO_EXTENSION);
                $allowTypes = array('jpg', 'jpeg', 'png');
                if (!in_array($fileType, $allowTypes)) {
                    return array("status" => 400, "msg" => "Incompatible filetype. Should be one of (jpg, jpeg, png)", "success" => false);
                }
                $hex_string = base64_encode(file_get_contents($_FILES["thumbnail"]["tmp_name"]));
                move_uploaded_file($_FILES["thumbnail"]["tmp_name"], $targetFilePath . "." . $fileType);
                $db = getDB();
                $monitor_id = mysqli_real_escape_string($db, $param);
                $sql = "UPDATE monitors SET thumbnail = \"$hex_string\" WHERE id = \"$monitor_id\" AND user_id = \"$user_id\"";
                queryDatabase($db, $sql);
                if (empty(mysqli_error($db)))
                    return array("status" => 200, "msg" => "Set monitor thumbnail", "success" => true);
                else return array("status" => 500, "msg" => "Server error", "success" => false);
            }
            break;


    }
    return array("status" => 405, "success" => false);

}

function getMonitorsDaily($param)
{
    $user = json_decode(verify_user_token(), true);
    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $user_id = $user['id'];

    if (!isGet()) {
        return array("status" => 405, "success" => false);
    }
    $db = getDB();
    $time = get_micro_time();
    $time = strtotime("today", $time);
    $monitor_id = mysqli_real_escape_string($db, $param);
    $sql = "SELECT (SELECT SUM(value) FROM traffic WHERE monitor_id = monitors.id AND created > $time) AS daily_traffic, (SELECT SUM(male) FROM genders  WHERE  monitor_id = monitors.id AND created > $time) 
AS daily_males, (SELECT SUM(female) FROM genders WHERE monitor_id = monitors.id AND created > $time) AS daily_females, (SELECT SUM(z > 0) FROM impressions WHERE monitor_id = monitors.id AND created > $time) AS daily_impressions FROM monitors WHERE user_id = \"{$user_id}\" AND id = \"$monitor_id\"";
    $rows = getAllRowsOfQuery($db, $sql);
    if (!empty($rows)) {
        return array("status" => 200, "msg" => "Retrieved monitor daily counts", "data" => $rows[0], "success" => true);
    } else {
        return array("status" => 400, "msg" => "Failed to retrieve daily counts for monitor", "success" => false);
    }

}

/*
 * MONITORS
 */
/*
 *
 */
/*
 * LOGO
 */
function showLogo()
{
    $name = 'thumbnails/primary-logo.png';
    $fp = fopen($name, 'rb');
    header("Content-Type: image/png");
    header("Content-Length: " . filesize($name));
    fpassthru($fp);
}

/*
 * LOGO
 */
/*
 * CLASSIFY
 */
function classifyImage()
{
    if (!isPost()) {
        return array("status" => 405);
    }
    if (!isset($_FILES["image"])) {
        http_response_code(400);
        return array("status" => 400, "msg" => "Missing input image", "success" => false);

    }
    $fileName = uniqid();
    $targetDir = $_SERVER['DOCUMENT_ROOT'] . "/classify/";
    $targetFilePath = $targetDir . $fileName;
    $fileType = pathinfo($_FILES["image"]["name"], PATHINFO_EXTENSION);
    $allowTypes = array('jpg', 'jpeg');
    if (!in_array($fileType, $allowTypes)) {
        http_response_code(400);
        return array("status" => 400, "msg" => "Incompatible filetype. Should be one of (jpg, jpeg, png)", "success" => false);
    }
    move_uploaded_file($_FILES["thumbnail"]["tmp_name"], $targetFilePath . "." . $fileType);
    shell_exec('./imid_ml ' . $targetFilePath . "." . $fileType . ' 1 ' . $targetFilePath . "_out.jpg");
    $file = $targetFilePath . "_out.jpg";
    $type = 'image/jpg';
    header('Content-Type:' . $type);
    header('Content-Length: ' . filesize($file));
    readfile($file);

}

/*
 * CLASSIFY
 */
/*
 * TRAFFIC
 */
function getTrafficEntriesAll()
{
    if (!isGet()) {
        return array("status" => 405);
    }

    $user = json_decode(verify_user_token(), true);
    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $user_id = $user['id'];
    $db = getDB();
    // shift param is not required
    $params = array("start", "end", "duration");
    if (!check_isset_body($_GET, $params) || !in_array($_GET["duration"], get_valid_durations())) {
        return array("status" => 400, "msg" => "Missing required query parameters", "success" => false);
    }
    $start = intval($_GET["start"]);
    $end = intval($_GET["end"]);
    $duration = mysqli_real_escape_string($db, $_GET["duration"]);
    $sql = "SELECT created, SUM(value) AS total, monitor_id, FROM_UNIXTIME(created/1000) AS time FROM traffic WHERE created <= $end AND created >= $start AND user_id = \"{$user_id}\" GROUP BY $duration (time), monitor_id";
    $rows = getAllRowsOfQuery($db, $sql);
    return array("status" => 200, "msg" => "Retrieved traffic entries in range for monitor", "data" => $rows, "success" => true);
}

function handlingTraffic()
{
    $user = json_decode(verify_user_token(), true);
    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $user_id = $user['id'];
    switch ($_SERVER["REQUEST_METHOD"]) {
        case 'GET':
            {
                $db = getDB();
                $params = array("start", "end", "monitor_id", "duration");
                if (!check_isset_body($_GET, $params) || !in_array($_GET["duration"], get_valid_durations())) {
                    return array("status" => 400, "msg" => "Missing required query parameters", "success" => false);
                }

                $start = intval($_GET["start"]);
                $end = intval($_GET["end"]);
                $monitor_id = $_GET["monitor_id"];
                $duration = ($_GET["duration"]);
                $shift = ($_GET["shift"]);

                if (isset($shift)) {
                    $start = subtract_from_date($start, $duration, 1);
                    $end = subtract_from_date($end, $duration, 1);
                }
                $monitor_id = mysqli_real_escape_string($db, $monitor_id);
                $duration = mysqli_real_escape_string($db, $duration);

                #$sql = "SELECT created, SUM(value) AS total, monitor_id, FROM_UNIXTIME(created/1000) AS time FROM traffic WHERE created <= $end AND created >= $start AND user_id = \"{$user->id}\" GROUP BY $duration (time), monitor_id";
                $sql = "SELECT created, SUM(value) AS total, monitor_id, FROM_UNIXTIME(created/1000) AS time FROM traffic WHERE created <= $end AND created >= $start AND user_id = \"{$user_id}\" AND monitor_id = \"$monitor_id\" GROUP BY $duration (time), monitor_id";
                $rows = getAllRowsOfQuery($db, $sql);
                return array("status" => 200, "msg" => "Retrieved traffic entries in range for monitor", "data" => $rows, "success" => true);
            }
            break;
        case "POST":
            {
                $db = getDB();
                $params = array("value", "monitor_id");
                if (!check_isset_body($_GET, $params)) {
                    return array("status" => 400, "msg" => "Missing required query parameters", "success" => false);
                }
                $value = $_GET["value"];
                if (!is_numeric($value) || $value < 0) {
                    return array("status" => 400, "msg" => "Value must be valid positive number", "success" => false);
                }
                $monitor_id = mysqli_real_escape_string($db, $_GET["monitor_id"]);

                $sql = "INSERT INTO traffic (monitor_id, user_id, value, created) VALUES (\"$monitor_id\", \"$user_id\", $value, " . get_micro_time() . ")";
                queryDatabase($db, $sql);
                if (empty(mysqli_error($db))) {
                    return array("status" => 200, "msg" => "Inserted entry successfully", "success" => true);
                }
                return array("status" => 500, "msg" => "Server error", "success" => false);
            }
            break;
    }
    return array("status" => 405, "success" => false);


}

function getTrafficDays()
{
    if (!isGet()) return array("status" => 405, "success" => false);

    $user = json_decode(verify_user_token(), true);
    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $user_id = $user['id'];
    $params = array("days");
    if (!check_isset_body($_GET, $params)) {
        return array("status" => 400, "msg" => "Missing required query parameters", "success" => false);
    }

    if (!is_numeric($_GET["days"]) || $_GET["days"] < 0) {
        return array("status" => 400, "msg" => "Days must be numeric and positive", "success" => false);
    }
    $db = getDB();
    $days = subtract_from_date(microtime(true), 'day', $_GET["days"]);
    $days = mysqli_real_escape_string($db, $days);
    $sql = "SELECT created, SUM(value) AS total, monitor_id, FROM_UNIXTIME(created/1000) AS time FROM traffic WHERE created >= $days AND created <= " . get_micro_time() . " AND user_id = \"{$user_id}\" GROUP BY DAY(time), monitor_id";
    $rows = getAllRowsOfQuery($db, $sql);
    return array("status" => 200, "msg" => "Retrieved traffic entries in range for days", "data" => $rows, "success" => true);
}

function getTrafficTotal()
{
    if (!isGet()) {
        return array("status" => 405, "success" => false);
    }
    $user = json_decode(verify_user_token(), true);

    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $user_id = $user['id'];
    $params = array("start", "end");
    if (!check_isset_body($_GET, $params)) {
        return array("status" => 400, "msg" => "Missing required query parameters", "success" => false);
    }

    $start = $_GET["start"];
    $end = $_GET["end"];
    if (!is_numeric($start) || !is_numeric($end) || $start < 0 || $end < 0) {
        return array("status" => 400, "msg" => "Date values must be valid timestamps", "success" => false);
    }
    $db = getDB();
    $start = mysqli_real_escape_string($db, $start);
    $end = mysqli_real_escape_string($db, $end);
    $sql = "SELECT SUM(value) as total FROM traffic WHERE created >= $start AND created <= $end AND user_id = \"{$user_id}\"";
    $rows = getAllRowsOfQuery($db, $sql);
    $data = isset($rows[0]["total"]) ? $rows[0] : array("total" => 0);

    return array("status" => 200, "msg" => "Retrieved traffic entries in range for days", "data" => $data, "success" => true);
}

function insertTrafficInBulk()
{
    if (!isPost()) {
        return array("status" => 405, "success" => false);
    }
    $user = json_decode(verify_user_token(), true);

    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $user_id = $user['id'];

    $body = json_decode(file_get_contents('php://input'), true);

    $params = array("data", "monitor_id");
    if (!check_isset_body($body, $params)) {
        return array("status" => 400, "msg" => "Missing required body parameters", "success" => false);
    }

    $data = $body["data"];
    if (!is_array($data)) {
        return array("status" => 400, "msg" => "Need appropriately formatted data array for bulk insertion", "success" => false);
    }
    $db = getDB();
    $sql = "INSERT INTO `traffic` (monitor_id, user_id, value, created) VALUES (";
    $sql_arr = array();
    foreach ($data as $entry) {
        $to_insert = array();
        $e = array("\"" . mysqli_real_escape_string($db, $body["monitor_id"]) . "\"", "\"" . $user_id . "\"", mysqli_real_escape_string($db, $entry["value"]), mysqli_real_escape_string($db, $entry["created"]));
        foreach ($e as $element) {
            $to_insert[] = $element;
        }
        $sql_arr[] = $sql . implode(', ', $to_insert) . ")";
    }


    foreach ($sql_arr as $query_var) {
        queryDatabase($db, $query_var);
    }
    if (empty(mysqli_error($db))) {
        return array("status" => 200, "msg" => "Bulk entries inserted successfully", "success" => true);
    }

    return array("status" => 500, "msg" => "Server error", "success" => false);


}

/*
 * TRAFFIC
 */
/*
 * GENDER
 */
function handlingGender()
{
    $user = json_decode(verify_user_token(), true);

    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $user_id = $user['id'];

    switch ($_SERVER['REQUEST_METHOD']) {
        case "GET":
            {
                $db = getDB();
                $params = array("start", "end", "monitor_id", "duration");
                if (!check_isset_body($_GET, $params) || !in_array($_GET["duration"], get_valid_durations())) {
                    return array("status" => 400, "msg" => "Missing required query parameters", "success" => false);
                }

                $start = intval($_GET["start"]);
                $end = intval($_GET["end"]);
                $monitor_id = $_GET["monitor_id"];
                $duration = ($_GET["duration"]);
                $shift = ($_GET["shift"]);

                if (isset($shift)) {
                    $start = subtract_from_date($start, $duration, 1);
                    $end = subtract_from_date($end, $duration, 1);
                }
                $monitor_id = mysqli_real_escape_string($db, $monitor_id);
                $duration = mysqli_real_escape_string($db, $duration);
                $sql = "SELECT created, SUM(male) AS males, SUM(female) AS females, monitor_id, FROM_UNIXTIME(created/1000) AS time FROM genders WHERE created <= $end AND created >= $start AND user_id = \"{$user_id}\" AND monitor_id = \"$monitor_id\" GROUP BY $duration (time), monitor_id";
                $rows = getAllRowsOfQuery($db, $sql);
                return array("status" => 200, "msg" => "Retrieved gender entries in range for monitor", "data" => $rows, "success" => true);
            }
            break;
        case "POST":
            {
                $db = getDB();
                $params = array("male", "female", "monitor_id");
                if (!check_isset_body($_GET, $params)) {
                    return array("status" => 400, "msg" => "Missing required query parameters", "success" => false);
                }
                $male = $_GET["male"];
                $female = $_GET["female"];
                if (!is_numeric($male) || $male < 0 || !is_numeric($female) || $female < 0) {
                    return array("status" => 400, "msg" => "Entries must be valid positive integers", "success" => false);
                }
                $monitor_id = mysqli_real_escape_string($db, $_GET["monitor_id"]);
                $male = mysqli_real_escape_string($db, $male);
                $female = mysqli_real_escape_string($db, $female);
                $sql = "INSERT INTO genders (monitor_id, user_id, male, female, created) VALUES (\"$monitor_id\", \"$user_id\", $male, $female, " . get_micro_time() . ")";
                queryDatabase($db, $sql);
                if (empty(mysqli_error($db))) {
                    return array("status" => 200, "msg" => "Inserted entry successfully", "success" => true);
                }
                return array("status" => 500, "msg" => "Server error", "success" => false);

            }
            break;
    }
    return array("status" => 405, "success" => false);

}

function getGenderEntriesAll()
{
    if (!isGet()) return array("status" => 405, "success" => false);
    $user = json_decode(verify_user_token(), true);
    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $user_id = $user['id'];
    $db = getDB();
    // shift param is not required
    $params = array("start", "end", "duration");
    if (!check_isset_body($_GET, $params) || !in_array($_GET["duration"], get_valid_durations())) {

        return array("status" => 400, "msg" => "Missing required query parameters", "success" => false);
    }

    $start = intval($_GET["start"]);
    $end = intval($_GET["end"]);
    $duration = mysqli_real_escape_string($db, $_GET["duration"]);
    $sql = "SELECT created, SUM(male) AS males, SUM(female) as females, monitor_id, FROM_UNIXTIME(created/1000) AS time FROM genders WHERE created <= $end AND created >= $start AND user_id = \"{$user_id}\" GROUP BY $duration (time), monitor_id";
    $rows = getAllRowsOfQuery($db, $sql);
    return array("status" => 200, "msg" => "Retrieved gender entries in range for monitor", "data" => $rows, "success" => true);
}

function getGendersTotal()
{
    if (!isGet())
        return array("status" => 405, "success" => false);
    $user = json_decode(verify_user_token(), true);
    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $user_id = $user['id'];
    $params = array("start", "end");
    if (!check_isset_body($_GET, $params)) {

        return array("status" => 400, "msg" => "Missing required query parameters", "success" => false);
    }

    $start = $_GET["start"];
    $end = $_GET["end"];
    if (!is_numeric($start) || !is_numeric($end) || $start < 0 || $end < 0) {
        return array("status" => 400, "msg" => "Date values must be valid timestamps", "success" => false);
    }
    $db = getDB();
    $start = mysqli_real_escape_string($db, $start);
    $end = mysqli_real_escape_string($db, $end);
    $sql = "SELECT SUM(male) as males, SUM(female) as females FROM genders WHERE created >= $start AND created <= $end AND user_id = \"{$user_id}\"";
    $rows = getAllRowsOfQuery($db, $sql);
    $data = array(
        "males" => isset($rows[0]["males"]) ? $rows[0]["males"] : 0,
        "females" => isset($rows[0]["females"]) ? $rows[0]["females"] : 0
    );
    return array("status" => 200, "msg" => "Retrieved gender entries in range for days", "data" => $data, "success" => true);
}

function insertGendersInBulk()
{
    if (!isPost()) {
        return array("status" => 405, "success" => false);
    }
    $user = json_decode(verify_user_token(), true);
    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $user_id = $user['id'];
    $body = json_decode(file_get_contents('php://input'), true);
    $params = array("data", "monitor_id");
    if (!check_isset_body($body, $params)) {
        return array("status" => 400, "msg" => "Missing required body parameters", "success" => false);
    }
    $data = $body["data"];
    if (!is_array($data)) {
        return array("status" => 400, "msg" => "Need appropriately formatted data array for bulk insertion", "success" => false);
    }
    $db = getDB();
    $sql = "INSERT INTO `genders` (monitor_id, user_id, male, female, created) VALUES (";
    $sql_arr = array();
    foreach ($data as $entry) {
        $to_insert = array();
        $e = array("\"" . mysqli_real_escape_string($db, $body["monitor_id"]) . "\"", "\"" . $user_id . "\"", mysqli_real_escape_string($db, $entry["male"]), mysqli_real_escape_string($db, $entry["female"]), mysqli_real_escape_string($db, $entry["created"]));
        foreach ($e as $element) {
            $to_insert[] = $element;
        }
        $sql_arr[] = $sql . implode(', ', $to_insert) . ")";
    }
    foreach ($sql_arr as $query_var) {
        queryDatabase($db, $query_var);
    }
    if (empty(mysqli_error($db))) {
        return array("status" => 200, "msg" => "Bulk entries inserted successfully", "success" => true);
    }

    return array("status" => 500, "msg" => "Server error", "success" => false);


}

/*
 * GENDER
 */
/*
 * IMPRESSION
 */
function getImpressionEntriesAll()
{
    $user = json_decode(verify_user_token(), true);

    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $user_id = $user['id'];
    $db = getDB();
    // shift param is not required
    $params = array("start", "end", "duration");
    if (!check_isset_body($_GET, $params) || !in_array($_GET["duration"], get_valid_durations())) {
        return array("status" => 400, "msg" => "Missing required query parameters", "success" => false);
    }

    $start = intval($_GET["start"]);
    $end = intval($_GET["end"]);
    $duration = $_GET["duration"];
    $sql = "SELECT created, monitor_id, FROM_UNIXTIME(created/1000) as time, COUNT(*) as total from impressions where created <= $end AND created >= $start AND user_id = \"{$user_id}\" GROUP BY $duration (time), monitor_id";
    $rows = getAllRowsOfQuery($db, $sql);
    return array("status" => 200, "msg" => "Retrieved impression entries in range for monitor", "data" => $rows, "success" => true);
}

function handlingImpression()
{

    $user = json_decode(verify_user_token(), true);

    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $user_id = $user['id'];

    switch ($_SERVER['REQUEST_METHOD']) {
        case "GET":
            {
                $db = getDB();
                $params = array("start", "end", "monitor_id", "duration");
                if (!check_isset_body($_GET, $params) || !in_array($_GET["duration"], get_valid_durations())) {
                    return array("status" => 400, "msg" => "Missing required query parameters", "success" => false);
                }

                $start = intval($_GET["start"]);
                $end = intval($_GET["end"]);
                $monitor_id = $_GET["monitor_id"];
                $duration = ($_GET["duration"]);
                $shift = ($_GET["shift"]);

                if (isset($shift)) {
                    $start = subtract_from_date($start, $duration, 1);
                    $end = subtract_from_date($end, $duration, 1);
                }
                $monitor_id = mysqli_real_escape_string($db, $monitor_id);
                $duration = mysqli_real_escape_string($db, $duration);
                #$sql = "SELECT created, SUM(male) AS males, SUM(female) AS females, monitor_id, FROM_UNIXTIME(created/1000) AS time FROM genders WHERE created <= $end AND created >= $start AND user_id = \"{$user->id}\" AND monitor_id = \"$monitor_id\" GROUP BY $duration (time), monitor_id";
                $sql = "SELECT created, monitor_id, FROM_UNIXTIME(created/1000) as time, COUNT(*) as total from impressions WHERE z > 0 AND created <= $end AND created >= $start AND user_id = \"{$user_id}\" AND monitor_id = \"$monitor_id\" GROUP BY $duration (time), monitor_id";
                $rows = getAllRowsOfQuery($db, $sql);
                return array("status" => 200, "msg" => "Retrieved impression entries in range for monitor", "data" => $rows, "success" => true);
            }
            break;
        case "POST":
            {


                $db = getDB();
                $params = array("x", "y", "z", "monitor_id");
                if (!check_isset_body($_GET, $params)) {
                    return array("status" => 400, "msg" => "Missing required query parameters", "success" => false);
                }
                $x = $_GET["x"];
                $y = $_GET["y"];
                $z = $_GET["z"];
                if (!is_numeric($x) || !is_numeric($y) || !is_numeric($z)) {

                    return array("status" => 400, "msg" => "Entries must be valid positive integers", "success" => false);
                }
                $monitor_id = mysqli_real_escape_string($db, $_GET["monitor_id"]);
                $x = mysqli_real_escape_string($db, $x);
                $y = mysqli_real_escape_string($db, $y);
                $z = mysqli_real_escape_string($db, $z);
                $sql = "INSERT INTO impressions (monitor_id, user_id, x, y, z, created) VALUES(\"$monitor_id\", \"$user_id\", $x, $y, $z," . get_micro_time() . ")";
                queryDatabase($db, $sql);
                if (empty(mysqli_error($db))) {
                    return array("status" => 200, "msg" => "Inserted entry successfully", "success" => true);
                }
            }
            break;
    }

    return array("status" => 500, "msg" => "Server error", "success" => false);
}


function insertImpressioninBulk()
{
    if (!isPost()) return array("status" => 405, "success" => false);
    $user = json_decode(verify_user_token(), true);
    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $user_id = $user['id'];
    $body = json_decode(file_get_contents('php://input'), true);

    $params = array("data", "monitor_id");
    if (!check_isset_body($body, $params)) {
        return array("status" => 400, "msg" => "Missing required body parameters", "success" => false);
    }

    $data = $body["data"];
    if (!is_array($data)) {
        return array("status" => 400, "msg" => "Need appropriately formatted data array for bulk insertion", "success" => false);
    }
    $db = getDB();
    $sql = "INSERT INTO `impressions` (monitor_id, user_id, x,y,z, created) VALUES (";
    $sql_arr = array();
    foreach ($data as $entry) {
        $to_insert = array();
        $e = array("\"" . mysqli_real_escape_string($db, $body["monitor_id"]) . "\"", "\"" . $user_id . "\"", intval($entry["x"]), intval($entry["y"]), intval($entry["z"]), mysqli_real_escape_string($db, $entry["created"]));
        foreach ($e as $element) {
            $to_insert[] = $element;
        }
        $sql_arr[] = $sql . implode(', ', $to_insert) . ")";
    }


    foreach ($sql_arr as $query_var) {
        queryDatabase($db, $query_var);
    }
    if (empty(mysqli_error($db))) {
        return array("status" => 200, "msg" => "Bulk entries inserted successfully", "success" => true);
    }

    return array("status" => 500, "msg" => "Server error", "success" => false);


}

function getImpressionTotal()
{
    if (!isGet()) return array("status" => 405, "success" => false);
    $user = json_decode(verify_user_token(), true);
    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $user_id = $user['id'];
    $params = array("start", "end");
    if (!check_isset_body($_GET, $params)) {
        return array("status" => 400, "msg" => "Missing required query parameters", "success" => false);
    }
    $start = htmlspecialchars($_GET["start"]);
    $end = htmlspecialchars($_GET["end"]);
    if (!is_numeric($start) || !is_numeric($end) || $start < 0 || $end < 0) {
        return array("status" => 400, "msg" => "Date values must be valid timestamps", "success" => false);
    }
    $db = getDB();
    $start = mysqli_real_escape_string($db, $start);
    $end = mysqli_real_escape_string($db, $end);
    $sql = "SELECT COUNT(*) as total FROM impressions WHERE created >= $start AND created <= $end AND user_id = \"{$user_id}\" AND z > 0";
    $rows = getAllRowsOfQuery($db, $sql);
    $data = isset($rows[0]["total"]) ? $rows[0] : array("total" => 0);
    return array("status" => 200, "msg" => "Retrieved impression entries in range for days", "data" => $data, "success" => true);

}

/*
 * IMPRESSION
 */
/*
 * ACCOUNT
 */
function getUser()
{
    if (!isGet()) return array("status" => 405, "success" => false);
    $user = json_decode(verify_user_token(), true);
    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $user_id = $user['id'];
    $email = $user['email'];
    $id = $user_id;
    $db = getDB();
    $sql = "SELECT id, email, created, customer_id, subscription_id, subscription_item_id, card_id, active, mailing_list_only FROM users WHERE email= \"{$email}\" AND id = \"$id\"";
    $rows = getAllRowsOfQuery($db, $sql);
    $data = $rows[0];
    return array("status" => 200, "msg" => "Retrieved user successfully", "data" => $data, "success" => true);
}

function resetPasswordLoggedIn()
{
    if (!isGet()) return array("status" => 405, "success" => false);
    $user = json_decode(verify_user_token(), true);
    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $user_id = $user['id'];
    $email = $user['email'];
    $db = getDB();
    $sql = "SELECT * FROM password_resets WHERE email=\"$email\"";
    $rows = getAllRowsOfQuery($db, $sql);
    if (!empty($rows)) {
        return array("status" => 400, "msg" => "Password reset request already exists!", "success" => false);
    }
    $reset_id = uniqid();
    $reset_token = uniqid();
    $sql = "INSERT into password_resets (id, email, reset_token, created) VALUES (\"$reset_id\", \"$email\", \"$reset_token\"
," . get_micro_time() . ")";
    if (queryDatabase($db, $sql)) {
        // SEND MAIL
        $to = $email;
        $subject = "Facenition";
        $txt = "Reset your password! reset $reset_token";
        $headers = "From: admin@app.facenition.com" . "\r\n";
        mail($to, $subject, $txt, $headers);
        return array("status" => 200, 'msg' => 'Reset request successfully submitted! Follow email instructions', "success" => true);
    }
}

function getUpcomingInvoice()
{
    if (!isGet()) return array("status" => 405, "success" => false);
    $user = json_decode(verify_user_token(), true);
    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $id = $user['id'];
    $email = $user['email'];
    $db = getDB();
    $sql = "SELECT * FROM users WHERE id = \"$id\"";
    $rows = getAllRowsOfQuery($db, $sql);
    if (!empty($rows)) {
        $customer_id = $rows[0]["customer_id"];
        $upcoming = json_decode(customer_upcoming_invoice($customer_id), true);
        return array("status" => 200, 'msg' => 'Retrieved upcoming invoice', "data" => $upcoming, "success" => true);
    }
}

function handlingCard()
{
    $user = json_decode(verify_user_token(), true);
    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $id = $user['id'];
    switch ($_SERVER["REQUEST_METHOD"]) {
        case "GET":
            {
                $db = getDB();
                $sql = "SELECT customer_id, card_id from users where id = \"$id\"";
                $rows = getAllRowsOfQuery($db, $sql);
                $customer_id = $rows[0]["customer_id"];
                $card_id = $rows[0]["card_id"];
                if (!isset($card_id)) {
                    return array("status" => 500, "msg" => "Failed to retrieve customer card", "success" => false);
                }
                $source = json_decode(retrieve_source($customer_id, $card_id));
                return array("status" => 200, 'msg' => 'Retrieved payment source', "data" => $source, "success" => true);

            }
            break;
        case "POST":
            {
                $body = array_map('htmlspecialchars', $_POST);
                $params = array("tokenId");
                if (!check_isset_body($body, $params)) {
                    return array("status" => 400, "msg" => "Missing required query parameters", "success" => false);
                }
                $token_id = $body["tokenId"];
                $db = getDB();
                $sql = "SELECT customer_id from users where id = \"$id\"";
                $rows = getAllRowsOfQuery($db, $sql);
                if (empty($rows)) {
                    return array("status" => 400, "msg" => "Customer not found", "success" => false);
                }

                $customer_id = $rows[0]["customer_id"];
                $card = json_decode(create_card($customer_id, $token_id), true);
                $updated_customer = update_customer_source($customer_id, $card["id"]);
                $sql = "UPDATE users set card_id = \"{$card["id"]}\" where id = \"$id\"";
                if (queryDatabase($db, $sql))
                    return array("status" => 200, 'msg' => 'Updated customer payment source', "success" => true);
                else return array("status" => 500, "success" => false);
            }
            break;
    }
    return array("status" => 405, "success" => false);

}

function handlingSubscription()
{
    $user = json_decode(verify_user_token(), true);
    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $id = $user['id'];
    switch ($_SERVER["REQUEST_METHOD"]) {
        case 'GET':
            {
                $db = getDB();
                $sql = "SELECT * from users where id = \"$id\"";
                $rows = getAllRowsOfQuery($db, $sql);
                if (!empty($rows)) {
                    $subscription_item_id = $rows[0]["subscription_item_id"];
                    $plan_data = json_decode(get_subscription_item($subscription_item_id), true);
                    return array('msg' => 'Retrieved plan for user', "data" => array(
                        "name" => "Freelancer",
                        "subscription_item" => $plan_data
                    ), "success" => true);
                }
            }
            break;
        case 'PUT':
        {
            $body = json_decode(file_get_contents('php://input'), true);
            $params = array("plan");
            if (!check_isset_body($body, $params)) {
                return array("status" => 400, "msg" => "Missing required query parameters", "success" => false);
            }
            $plan = htmlspecialchars($body["plan"]);
            $db = getDB();
            $sql = "SELECT * FROM users WHERE id = \"{$id}\"";
            $rows = getAllRowsOfQuery($db, $sql);
            if (!empty($rows)) {
                $subscription_item_id = $rows[0]["subscription_item_id"];
                $msg = json_decode(update_plan($subscription_item_id, $plan));
                return array("status" => 200, 'msg' => 'Updated subscription', 'info' => $msg, "success" => true);
            }
        }

        case 'DELETE':
            {
                $db = getDB();
                $sql = "SELECT * FROM users WHERE id = \"{$id}\"";
                $rows = getAllRowsOfQuery($db, $sql);
                if (!empty($rows)) {
                    $subscription_item_id = $rows[0]["subscription_item_id"];
                    $msg = json_decode(delete_subscription($subscription_item_id));
                    return array("status" => 200, 'msg' => 'Deleted subscription', 'info' => $msg, "success" => true);
                }
            }
            break;

    }
    return array("status" => 405, "success" => false);

}

function activateMeter()
{
    if (!isPost()) return array("status" => 405, "success" => false);
    $user = json_decode(verify_user_token(), true);
    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $id = $user['id'];
    $queries = array_map('htmlspecialchars', $_GET);
    $params = array("monitor_id");
    if (!check_isset_body($queries, $params)) {
        return array("status" => 400, "msg" => "Missing required query parameters", "success" => false);
    }
    $db = getDB();
    $monitor_id = mysqli_real_escape_string($db, $queries["monitor_id"]);
    $sql = "INSERT INTO active_meters (monitor_id, user_id, created, last_updated) VALUES(\"$monitor_id\", \"{$id}\"," . get_micro_time() . ", " . get_micro_time() . ")";
    if (queryDatabase($db, $sql))
        return array("status" => 200, 'msg' => 'Monitor active, monitoring usage', "success" => true);
    else  return array("status" => 500, "success" => false);

}

function updateUsage()
{
    $user = json_decode(verify_user_token(), true);
    if (is_bool($user['id'])) {
        return array("status" => 401, "success" => false);
    }
    $id = $user['id'];
    if ($_SERVER["REQUEST_METHOD"] != "PUT") return array("status" => 405, "success" => false);
    $queries = array_map('htmlspecialchars', $_GET);
    $params = array("monitor_id");
    if (!check_isset_body($queries, $params)) {
        return array("status" => 400, "msg" => "Missing required query parameters", "success" => false);
    }
    $db = getDB();
    $monitor_id = mysqli_real_escape_string($db, $queries["monitor_id"]);
    $sql = "UPDATE active_meters SET last_updated = " . get_micro_time() . " WHERE monitor_id = \"$monitor_id\" AND user_id = \"{$id}\"";
    if (queryDatabase($db, $sql))
        return array("status" => 200, 'msg' => 'Monitor updated', "success" => true);
    else  return array("status" => 500, "success" => false);

}

/*
 * ACCOUNT
 */
/*
 * FILES
 */
function getFile($param)
{
    $file_id=$param;
    $name = "files/$file_id";
    if (!file_exists($name)) return array("status" => 400, "success" => false);
    $fp = fopen($name, 'rb');
    header("Content-Length: " . filesize($name));
    fpassthru($fp);

}


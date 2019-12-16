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


        http_response_code(200);
        return $arr_json = json_encode(array('msg' => "Verified user account", "success" => true));
    } else {
        http_response_code(400);
        return $arr_json = json_encode(array('msg' => "No user with that token", "success" => false));
    }
}

function loginUser()
{
    if (!isPost()) {
        http_response_code(405);
        return json_encode(array("status" => 405));
    }
    $body = json_decode(file_get_contents('php://input'), true);
    $email = $body["email"];
    $password = $body["password"];
    $pdo = getDB();
    $sql = 'SELECT * FROM users WHERE email = :email';
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':email', $email);
    $stmt->execute();
    if ($stmt->rowCount() > 0) {
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $password_match = password_verify($password, $rows[0]["password"]);
        if ($password_match) {
            http_response_code(200);
            $userId = 'some-user-id';
            // Get our server-side secret key from a secure location.
            $skey = 'super-secret-will-change-later';
            // Enable the following for actual usage
            if (isset($nbf)) {
                $pload['nbf'] = $nbf;
            }
            if (isset($exp)) {
                $pload['exp'] = $exp;
            }
            $token = JWT::encode($rows[0], $skey);
            $data = array("msg" => "Successfully signed in!", "token" => $token, "success" => true);
            return json_encode($data);
        } else {
            http_response_code(400);
            return $arr_json = json_encode(array('msg' => "Email or password incorrect", "success" => false));
        }
    } else {
        http_response_code(400);
        return $arr_json = json_encode(array('msg' => "Email or password incorrect", "success" => false));
    }

}

function createUser()
{
    if (!isPost()) {
        http_response_code(405);
        return json_encode(array("status" => 405));
    }
    $config = include("./config/stripe_config.php");
    $body = json_decode(file_get_contents('php://input'), true);
    $email = $body["email"];
    $password = $body["password"];
    $plan = $body["plan"];
    $user_id = uniqid();
    $verify_token = uniqid();
    $pdo = getDB();
    $sql = 'SELECT * FROM users WHERE email = :email AND mailing_list_only = :mail_only';
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':email', $email);
    $stmt->bindValue(':mail_only', 0);
    $stmt->execute();
    if ($stmt->rowCount() == 0) {
        $stripe = new Stripe($config);

        $customer = json_decode($stripe->customer_create($email), true);
        $subscription = json_decode($stripe->customer_subscribe($customer["id"], $plan), true);
        $subscription_item_id = $subscription["items"]["data"][0]["id"];

        # We can successfully create the user in this scenario
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $sql_insrt = 'REPLACE INTO users (id, email, password, created, customer_id, subscription_id, subscription_item_id, verify_token, mailing_list_only) VALUES(:id, :email, :password, :created, :customer_id, :subscription_id, :subscription_item_id, :verify_token, :mailing_list_only)';
        $stmt_insrt = $pdo->prepare($sql_insrt);
        $stmt_insrt->bindValue(':id', $user_id);
        $stmt_insrt->bindValue(':email', $email);
        $stmt_insrt->bindValue(':password', $hash);
        $stmt_insrt->bindValue(':created', get_micro_time());
        $stmt_insrt->bindValue(':customer_id', $customer["id"]);
        $stmt_insrt->bindValue(':subscription_id', $subscription["id"]);
        $stmt_insrt->bindValue(':subscription_item_id', $subscription_item_id);
        $stmt_insrt->bindValue(':verify_token', $verify_token);
        $stmt_insrt->bindValue(':mailing_list_only', 0);
        $stmt_insrt->execute();


        http_response_code(400);
        return $arr_json = json_encode(array('msg' => "Successfully created user account! Please check your email.", "success" => true));
    } else {
        http_response_code(400);
        return $arr_json = json_encode(array('msg' => "Account already exists with that email", "success" => false));
    }
}

function resetPassword()
{
    if (!isPost()) {
        http_response_code(405);
        return json_encode(array("status" => 405));
    }
    $body = json_decode(file_get_contents('php://input'), true);
    $email = $body["email"];
    $sql = 'SELECT * from password_resets WHERE email = :email';
    $pdo = getDB();
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':email', $email);
    $stmt->execute();
    if ($stmt->rowCount() == 0) {
        $reset_id = uniqid();
        $reset_token = uniqid();

        $sql_inser = 'INSERT into password_resets (id, email, reset_token, created) VALUES(:id, :email, :reset_token, :created)';
        $stmt_insrt = $pdo->prepare($sql_inser);
        $stmt_insrt->bindValue(':id', $reset_id);
        $stmt_insrt->bindValue(':email', $email);
        $stmt_insrt->bindValue(':reset_token', $reset_token);
        $stmt_insrt->bindValue(':created', get_micro_time());
        $stmt_insrt->execute();

        // SEND MAIL
        http_response_code(200);
        return $arr_json = json_encode(array('msg' => 'Reset request successfully submitted! Follow email instructions', "success" => true));
    } else {
        http_response_code(400);
        return $arr_json = json_encode(array('msg' => "Password reset request already exists!", "success" => false));
    }

}
function resetPasswordByToken() {
    if (!isPost()) {
        http_response_code(405);
        return json_encode(array("status" => 405));
    }
    $body = json_decode(file_get_contents('php://input'), true);

}


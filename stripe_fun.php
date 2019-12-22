<?php
// Set the server api endpoint and http methods as constants
define('STRIPE_API_ENDPOINT', 'https://api.stripe.com/v1/');
define('STRIPE_METHOD_POST', 'post');
define('STRIPE_METHOD_DELETE', 'delete');
$PLANS = array(
    "FREELANCER" => 'plan_FWrIrMckTHUPSA',
    "BUSINESS" => 'plan_FWrKkGK0MXriqF',
    "ENTERPRISE" => 'plan_FWrKvSazFRTGwl'
);

$config = array(
    'stripe_key_test_public' => '',
    'stripe_key_test_secret' => 'sk_test_7v3p8JLwuPRGyuqWF4JtukLO',
    'stripe_key_live_public' => '',
    'stripe_key_live_secret' => '',
    'stripe_test_mode' => TRUE,
    'stripe_verify_ssl' => FALSE
);

function _send_request($url_segs, $params = array(), $http_method = 'get')
{
    global $config;
    if ($config['stripe_test_mode'])
        $key = $config['stripe_key_test_secret'];
    else
        $key = $config['stripe_key_live_secret'];

    // Initialize and configure the request
    $req = curl_init('https://api.stripe.com/v1/' . $url_segs);
    curl_setopt($req, CURLOPT_SSL_VERIFYPEER, $config['stripe_verify_ssl']);
    curl_setopt($req, CURLOPT_HTTPAUTH, CURLAUTH_ANY);
    curl_setopt($req, CURLOPT_USERPWD, $key . ':');
    curl_setopt($req, CURLOPT_RETURNTRANSFER, TRUE);

    // Are we using POST? Adjust the request properly
    if ($http_method == STRIPE_METHOD_POST) {
        curl_setopt($req, CURLOPT_POST, TRUE);
        curl_setopt($req, CURLOPT_POSTFIELDS, http_build_query($params, NULL, '&'));
    }

    if ($http_method == STRIPE_METHOD_DELETE) {
        curl_setopt($req, CURLOPT_CUSTOMREQUEST, "DELETE");
        curl_setopt($req, CURLOPT_POSTFIELDS, http_build_query($params, NULL, '&'));
    }

    // Get the response, clean the request and return the data
    $response = curl_exec($req);
    curl_close($req);
    return $response;
}

function charge_customer($amount, $customer_id, $desc)
{
    $params = array(
        'amount' => $amount,
        'currency' => 'usd',
        'customer' => $customer_id,
        'description' => $desc
    );

    return _send_request('charges', $params, STRIPE_METHOD_POST);
}

/**
 * Create and apply a charge based on credit card information
 *
 * @param int           The amount to charge in cents ( USD )
 * @param mixed         This can be a card token generated with stripe.js ( recommended ) or
 *                       an array with the card information: number, exp_month, exp_year, cvc, name
 * @param string        A free form reference for the charge
 */
function charge_card($amount, $card, $desc)
{
    $params = array(
        'amount' => $amount,
        'currency' => 'usd',
        'card' => $card,
        'description' => $desc
    );

    return _send_request('charges', $params, STRIPE_METHOD_POST);
}

/**
 * Retrieve information about a specific charge
 *
 * @param string         The charge ID to query
 */
function charge_info($charge_id)
{
    return _send_request('charges/' . $charge_id);
}

function create_card($customer_id, $token)
{
    $params = array(
        "source" => $token
    );
    return _send_request('customers/' . $customer_id . '/sources', $params);
}

function update_customer_source($customer_id, $card_id)
{
    $params = array(
        "default_source" => $card_id
    );
    return _send_request('customers/' . $customer_id);
}

/**
 * Refund a charge
 *
 * @param string        The charge ID to refund
 * @param int           The amount to refund, defaults to the total amount charged
 */
function charge_refund($charge_id, $amount = FALSE)
{
    $amount ? $params = array('amount' => $amount) : $params = array();
    return _send_request('charges/' . $charge_id . '/refund', $params, STRIPE_METHOD_POST);
}

/**
 * Get a list of charges, either general or for a certain customer
 *
 * @param int           The number of charges to return, default 10, max 100
 * @param int           Offset to apply to the list, default 0
 * @param string        A customer ID to return only charges for that customer
 */
function charge_list($count = 10, $offset = 0, $customer_id = FALSE)
{
    $params['count'] = $count;
    $params['offset'] = $offset;
    if ($customer_id)
        $params['customer'] = $customer_id;
    $vars = http_build_query($params, NULL, '&');

    return _send_request('charges?' . $vars);
}

/**
 * Register a new customer on system
 *
 * @param mixed         This can be a card token generated with stripe.js ( recommended ) or
 *                       an array with the card information: number, exp_month, exp_year, cvc, name
 * @param string        The customer email address, useful as reference
 * @param string        A free form reference for the customer record
 * @param string        A subscription plan identifier to add the customer to it
 */
function customer_create($email, $desc = NULL, $plan = NULL)
{
    $params = array(
        'email' => $email
    );
    if ($desc)
        $params['description'] = $desc;
    if ($plan)
        $params['plan'] = $plan;

    return _send_request('customers', $params, STRIPE_METHOD_POST);
}

/**
 * Retrieve information for a given customer
 *
 * @param string        The customer ID to get information about
 */
function customer_info($customer_id)
{
    return _send_request('customers/' . $customer_id);
}

/**
 * Update an existing customer record
 *
 * @param string        The customer ID for the record to update
 * @param array         An array containing the new data for the user, you may use the
 *                       following keys: card, email, description
 */
function customer_update($customer_id, $newdata)
{
    return _send_request('customers/' . $customer_id, $newdata, STRIPE_METHOD_POST);
}

/**
 * Delete an existing customer record
 *
 * @param string        The customer ID of the record to delete
 */
function customer_delete($customer_id)
{
    return _send_request('customers/' . $customer_id, array(), STRIPE_METHOD_DELETE);
}

/**
 * Get a list of customers record ordered by creation date
 *
 * @param int           The number of customers to return, default 10, max 100
 * @param int           Offset to apply to the list, default 0
 */
function customer_list($count = 10, $offset = 0)
{
    $params['count'] = $count;
    $params['offset'] = $offset;
    $vars = http_build_query($params, NULL, '&');

    return _send_request('customers?' . $vars);
}

/**
 * Subscribe a customer to a plan
 *
 * @param string        The customer ID
 * @param string        The plan identifier
 * @param array         Configuration options for the subscription: prorate, coupon, trial_end(stamp)
 */
function customer_subscribe($customer_id, $plan_id, $options = array())
{
    $options['plan'] = 'plan_FWrIrMckTHUPSA';
    return _send_request('customers/' . $customer_id . '/subscription', $options, STRIPE_METHOD_POST);
}

/**
 * Cancel a customer's subscription
 *
 * @param string        The customer ID
 * @param boolean       Cancel the subscription immediately( FALSE ) or at the end of the current period( TRUE )
 */
function customer_unsubscribe($customer_id, $at_period_end = TRUE)
{
    $at_period_end ? $pend = 'true' : $pend = 'false';
    $url = 'customers/' . $customer_id . '/subscription?at_period_end=' . $pend;

    return _send_request($url, array(), STRIPE_METHOD_DELETE);
}

function update_plan($subscription_item_id, $plan)
{
    global $PLANS;
    $options['plan'] = $PLANS[$plan];
    return _send_request('subscription_items/' . $subscription_item_id, $options, STRIPE_METHOD_POST);
}

function delete_subscription($subscription_item_id)
{
    return _send_request('subscription_items/' . $subscription_item_id, array(), STRIPE_METHOD_DELETE);
}

/**
 * Get the next upcoming invoice for a given customer
 *
 * @param string        Customer ID to get the invoice from
 */
function customer_upcoming_invoice($customer_id)
{
    return _send_request('invoices/upcoming?customer=' . $customer_id);
}

/**
 * Generate a new single-use stripe card token
 *
 * @param array         An array containing the credit card data, with the following keys:
 *                       number, cvc, exp_month, exp_year, name
 * @param int           If the token will be used on a charge, this is the amount to charge for
 */

function card_token_create($card_data, $amount)
{
    $params = array(
        'card' => $card_data,
        'amount' => $amount,
        'currency' => 'usd'
    );

    return _send_request('tokens', $params, STRIPE_METHOD_POST);
}

/**
 * Get information about a card token
 *
 * @param string        The card token ID to get the information
 */

function card_token_info($token_id)
{
    return _send_request('tokens/' . $token_id);
}


function retrieve_source($customer_id, $card_id)
{
    return _send_request('customers/' . $customer_id . '/sources/' . $card_id);
}

/**
 * Create a new subscription plan on the system
 *
 * @param string        The plan identifier, this will be used when subscribing customers to it
 * @param int           The amount in cents to charge for each period
 * @param string        The plan name, will be displayed in invoices and the web interface
 * @param string        The interval to apply on the plan, could be 'month' or 'year'
 * @param int           Number of days for the trial period, if any
 */
function plan_create($plan_id, $amount, $name, $interval, $trial_days = FALSE)
{
    $params = array(
        'id' => $plan_id,
        'amount' => $amount,
        'name' => $name,
        'currency' => 'usd',
        'interval' => $interval
    );
    if ($trial_days)
        $params['trial_period_days'] = $trial_days;

    return _send_request('plans', $params, STRIPE_METHOD_POST);
}

/**
 * Retrieve information about a given plan
 *
 * @param string        The plan identifier you wish to get info about
 */

function plan_info($plan_id)
{
    return _send_request('plans/' . $plan_id);
}

function get_subscription_item($subscription_item_id)
{
    return _send_request('subscription_items/' . $subscription_item_id);
}

/**
 * Delete a plan from the system
 *
 * @param string        The identifier of the plan you want to delete
 */
function plan_delete($plan_id)
{
    return _send_request('plans/' . $plan_id, array(), STRIPE_METHOD_DELETE);
}

/**
 * Retrieve a list of the plans in the system
 */

function plan_list($count = 10, $offset = 0)
{
    $params['count'] = $count;
    $params['offset'] = $offset;
    $vars = http_build_query($params, NULL, '&');

    return _send_request('plans?' . $vars);
}

/**
 * Get infomation about a specific invoice
 *
 * @param string        The invoice ID
 */

function invoice_info($invoice_id)
{
    return _send_request('invoices/' . $invoice_id);
}

/**
 * Get a list of invoices on the system
 *
 * @param string        Customer ID to retrieve invoices only for a given customer
 * @param int           Number of invoices to retrieve, default 10, max 100
 * @param int           Offset to start the list from, default 0
 */

function invoice_list($customer_id = NULL, $count = 10, $offset = 0)
{
    $params['count'] = $count;
    $params['offset'] = $offset;
    if ($customer_id)
        $params['customer'] = $customer_id;
    $vars = http_build_query($params, NULL, '&');

    return _send_request('invoices?' . $vars);
}

/**
 * Register a new invoice item to the upcoming invoice for a given customer
 *
 * @param string        The customer ID
 * @param int           The amount to charge in cents
 * @param string        A free form description explaining the charge
 */

function invoiceitem_create($customer_id, $amount, $desc)
{
    $params = array(
        'customer' => $customer_id,
        'amount' => $amount,
        'currency' => 'usd',
        'description' => $desc
    );

    return _send_request('invoiceitems', $params, STRIPE_METHOD_POST);
}

/**
 * Get information about a specific invoice item
 *
 * @param string        The invoice item ID
 */

function invoiceitem_info($invoiceitem_id)
{
    return _send_request('invoiceitems/' . $invoiceitem_id);
}

/**
 * Update an invoice item before is actually charged
 *
 * @param string        The invoice item ID
 * @param int           The amount for the item in cents
 * @param string        A free form string describing the charge
 */

function invoiceitem_update($invoiceitem_id, $amount, $desc = FALSE)
{
    $params['amount'] = $amount;
    $params['currency'] = 'usd';
    if ($desc) $params['description'] = $desc;

    return _send_request('invoiceitems/' . $invoiceitem_id, $params, STRIPE_METHOD_POST);
}

/**
 * Delete a specific invoice item
 *
 * @param string        The invoice item identifier
 */

function invoiceitem_delete($invoiceitem_id)
{
    return _send_request('invoiceitems/' . $invoiceitem_id, array(), STRIPE_METHOD_DELETE);
}

/**
 * Get a list of invoice items
 *
 * @param string        Customer ID to retrieve invoices only for a given customer
 * @param int           Number of invoices to retrieve, default 10, max 100
 * @param int           Offset to start the list from, default 0
 */

function invoiceitem_list($customer_id = FALSE, $count = 10, $offset = 0)
{
    $params['count'] = $count;
    $params['offset'] = $offset;
    if ($customer_id)
        $params['customer'] = $customer_id;
    $vars = http_build_query($params, NULL, '&');

    return _send_request('invoiceitems?' . $vars);
}

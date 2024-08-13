<?php

$url = "http://localhost:3000/api/tuvi";

// Dữ liệu bạn muốn gửi dưới dạng JSON
$data = array(
    "name" => "Le Quang Vinh",
    "day" => 10,
    "month" => 10,
    "year" => 1991,
    "calendar" => true,
    "hour" => 10,
    "minute" => 59,
    "gender" => false,
    "viewYear" => 2025,
    "viewMonth" => 12
);

// Chuyển mảng dữ liệu thành JSON
$jsonData = json_encode($data);

// Tạo cURL session
$ch = curl_init($url);

// Thiết lập các tùy chọn cho cURL session
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);

// Thực hiện yêu cầu POST
$response = curl_exec($ch);

// Kiểm tra lỗi nếu có
if ($response === false) {
    $error = curl_error($ch);
    echo "cURL Error: $error";
} else {
    // Xử lý phản hồi từ API
    echo $response;
}

// Đóng cURL session
curl_close($ch);

?>

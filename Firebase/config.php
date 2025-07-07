<?php
$servername = "mysql-felipe25.alwaysdata.net";
$username = "felipe25";
$password = "Armando4825";
$database = "felipe25_48";

// Crear conexión con manejo de errores
$conn = new mysqli($servername, $username, $password, $database);

if ($conn->connect_error) {
    error_log("Error de conexión: " . $conn->connect_error);
    die(json_encode([
        'success' => false,
        'message' => 'Error de conexión a la base de datos'
    ]));
}

$conn->set_charset("utf8mb4");
?>
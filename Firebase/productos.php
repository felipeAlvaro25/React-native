<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
require_once 'config.php';

$response = [];

try {
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception('Error de conexión a la base de datos');
    }

    $sql = "SELECT id, nombre, descripcion, precio, stock, imagenURL FROM productos WHERE status = 'activo'";
    $result = $conn->query($sql);

    if (!$result) {
        throw new Exception('Error en consulta: ' . $conn->error);
    }

    $productos = [];
    while($row = $result->fetch_assoc()) {
        $productos[] = $row;
    }

    $response = [
        'success' => true,
        'productos' => $productos
    ];

} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => $e->getMessage()
    ];
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>
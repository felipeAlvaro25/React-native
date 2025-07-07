<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

// Verificar conexión
if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión a la base de datos: ' . $conn->connect_error
    ]);
    exit();
}

// Consulta para obtener proveedores
$sql = "SELECT id, nombre FROM proveedores ORDER BY nombre ASC";
$result = $conn->query($sql);

if (!$result) {
    echo json_encode([
        'success' => false,
        'message' => 'Error en la consulta: ' . $conn->error
    ]);
    $conn->close();
    exit();
}

$proveedores = [];
while($row = $result->fetch_assoc()) {
    $proveedores[] = $row;
}

$conn->close();

echo json_encode([
    'success' => true,
    'proveedores' => $proveedores
]);
?>
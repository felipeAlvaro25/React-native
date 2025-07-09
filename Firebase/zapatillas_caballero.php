<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
require_once 'config.php';

$response = [];

try {
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception('Error de conexión a la base de datos');
    }

    $sql = "SELECT id, nombre, descripcion, precio, stock, categoria, 
                   imagenURL, color, talla, tipo, status, comprados, marca 
            FROM productos 
            WHERE status = 'activo' AND categoria='1' AND sexo='Caballero'";

    $result = $conn->query($sql);

    if (!$result) {
        throw new Exception('Error en consulta: ' . $conn->error);
    }

    $productos = [];
    while($row = $result->fetch_assoc()) {
        // Construir la URL completa de la imagen
        if (!empty($row['imagenURL'])) {
            $row['imagenURL'] = 'https://felipe25.alwaysdata.net/api/uploads/productos/' . basename($row['imagenURL']);
        }
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
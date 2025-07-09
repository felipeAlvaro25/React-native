<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
require_once 'config.php';

$response = [];
$allowedTipos = ['pantalon', 'jeans', 'camisa', 'abrigo', 'sueter', 'deportiva', 'gala'];

try {
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception('Error de conexión a la base de datos', 500);
    }

    // Parámetros GET
    $tipo = isset($_GET['tipo']) ? strtolower($conn->real_escape_string($_GET['tipo'])) : null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 0;
    $popular = isset($_GET['popular']) ? filter_var($_GET['popular'], FILTER_VALIDATE_BOOLEAN) : false;

    if ($tipo && !in_array($tipo, $allowedTipos)) {
        throw new Exception('Tipo de ropa no válido', 400);
    }

    // Consulta base (ropa + género caballero)
    $sql = "SELECT id, nombre, descripcion, precio, stock, categoria, 
                   imagenURL, color, talla, tipo, status, comprados, marca 
            FROM productos 
            WHERE status = 'activo' AND categoria = 'ropa' AND LOWER(sexo) = 'dama'";

    $params = [];
    $types = '';

    if ($tipo) {
        $sql .= " AND LOWER(tipo) = ?";
        $params[] = $tipo;
        $types .= 's';
    }

    if ($popular) {
        $sql .= " ORDER BY comprados DESC";
    }

    if ($limit > 0) {
        $sql .= " LIMIT ?";
        $params[] = $limit;
        $types .= 'i';
    }

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Error al preparar la consulta: ' . $conn->error, 500);
    }

    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    if (!$stmt->execute()) {
        throw new Exception('Error al ejecutar la consulta: ' . $stmt->error, 500);
    }

    $result = $stmt->get_result();
    $productos = [];

    while ($row = $result->fetch_assoc()) {
        $productos[] = [
            'id' => $row['id'],
            'nombre' => $row['nombre'],
            'descripcion' => $row['descripcion'],
            'precio' => (float)$row['precio'],
            'stock' => (int)$row['stock'],
            'categoria' => strtolower($row['categoria']),
            'tipo' => strtolower($row['tipo']),
            'color' => $row['color'],
            'talla' => $row['talla'],
            'imagenURL' => $row['imagenURL'] ? 'https://felipe25.alwaysdata.net/api/uploads/productos/' . basename($row['imagenURL']) : null,
            'esPopular' => $row['comprados'] > 15,
            'marca' => $row['marca'] ?? null
        ];
    }

    $response = [
        'success' => true,
        'count' => count($productos),
        'productos' => $productos
    ];

} catch (Exception $e) {
    http_response_code($e->getCode() ?: 500);
    $response = [
        'success' => false,
        'message' => $e->getMessage(),
        'error_code' => $e->getCode()
    ];
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}
?>

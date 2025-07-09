<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
require_once 'config.php';

$response = [];
$allowedCategories = ['caballero', 'dama'];
$allowedTypes = ['pantalon', 'jeans', 'camisa', 'abrigo', 'sueter', 'deportiva', 'gala'];

try {
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception('Database connection error', 500);
    }

    // Secure parameters with defaults
    $categoria = isset($_GET['categoria']) ? strtolower($conn->real_escape_string($_GET['categoria'])) : 'caballero';
    $tipo = isset($_GET['tipo']) ? $conn->real_escape_string($_GET['tipo']) : null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 0;
    $popular = isset($_GET['popular']) ? filter_var($_GET['popular'], FILTER_VALIDATE_BOOLEAN) : false;

    // Validate inputs
    if (!in_array($categoria, $allowedCategories)) {
        throw new Exception('Invalid category', 400);
    }

    // Base query
    $sql = "SELECT id, nombre, descripcion, precio, stock, categoria, 
                   imagenURL, color, talla, tipo, status, comprados, marca 
            FROM productos 
            WHERE status = 'activo' AND categoria = ? AND sexo = 'Caballero'";

    // Add type filter if specified
    if ($tipo && in_array($tipo, $allowedTypes)) {
        $sql .= " AND tipo = ?";
    }

    // Sort by popularity if requested
    if ($popular) {
        $sql .= " ORDER BY comprados DESC";
    }

    // Add limit if specified
    if ($limit > 0) {
        $sql .= " LIMIT ?";
    }

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Query preparation error: ' . $conn->error, 500);
    }

    // Dynamic parameter binding
    $params = [$categoria];
    $types = "s";
    
    if ($tipo && in_array($tipo, $allowedTypes)) {
        $params[] = $tipo;
        $types .= "s";
    }
    
    if ($limit > 0) {
        $params[] = $limit;
        $types .= "i";
    }

    $stmt->bind_param($types, ...$params);

    if (!$stmt->execute()) {
        throw new Exception('Query execution error: ' . $stmt->error, 500);
    }

    $result = $stmt->get_result();
    $productos = [];

    while($row = $result->fetch_assoc()) {
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
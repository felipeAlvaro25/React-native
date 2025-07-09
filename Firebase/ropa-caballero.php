<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
require_once 'config.php';

$response = [];
$allowedCategories = ['Caballero', 'Dama']; // Categorías permitidas

try {
    // Verificar conexión a la base de datos
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception('Error de conexión a la base de datos', 500);
    }

    // Obtener parámetros de filtro (seguros con valores por defecto)
    $categoria = isset($_GET['categoria']) ? $conn->real_escape_string($_GET['categoria']) : 'Caballero';
    $sexo = isset($_GET['sexo']) ? $conn->real_escape_string($_GET['sexo']) : 'Caballero';
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 0;

    // Validar categoría
    if (!in_array($categoria, $allowedCategories)) {
        throw new Exception('Categoría no válida', 400);
    }

    // Construir consulta SQL segura con prepared statements
    $sql = "SELECT id, nombre, descripcion, precio, stock, categoria, 
                   imagenURL, color, talla, tipo, status, comprados, marca 
            FROM productos 
            WHERE status = 'activo' AND categoria = ? AND sexo = ?";

    // Agregar límite si se especificó
    if ($limit > 0) {
        $sql .= " LIMIT ?";
    }

    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception('Error al preparar consulta: ' . $conn->error, 500);
    }

    // Bind parameters según si hay límite o no
    if ($limit > 0) {
        $stmt->bind_param("ssi", $categoria, $sexo, $limit);
    } else {
        $stmt->bind_param("ss", $categoria, $sexo);
    }

    // Ejecutar consulta
    if (!$stmt->execute()) {
        throw new Exception('Error al ejecutar consulta: ' . $stmt->error, 500);
    }

    $result = $stmt->get_result();
    $productos = [];

    // Procesar resultados
    while($row = $result->fetch_assoc()) {
        // Formatear datos
        $row['precio'] = (float)$row['precio'];
        $row['stock'] = (int)$row['stock'];
        $row['comprados'] = (int)$row['comprados'];

        // Construir URL completa de la imagen si existe
        if (!empty($row['imagenURL'])) {
            $row['imagenURL'] = 'https://felipe25.alwaysdata.net/api/uploads/productos/' . basename($row['imagenURL']);
        } else {
            $row['imagenURL'] = null; // Asegurar que sea null si no hay imagen
        }

        $productos[] = $row;
    }

    // Verificar si hay resultados
    if (empty($productos)) {
        $response = [
            'success' => true,
            'message' => 'No se encontraron productos',
            'productos' => []
        ];
    } else {
        $response = [
            'success' => true,
            'count' => count($productos),
            'productos' => $productos
        ];
    }

} catch (Exception $e) {
    http_response_code($e->getCode() ?: 500);
    $response = [
        'success' => false,
        'message' => $e->getMessage(),
        'error_code' => $e->getCode()
    ];
} finally {
    // Cerrar conexiones
    if (isset($stmt)) {
        $stmt->close();
    }
    if (isset($conn)) {
        $conn->close();
    }

    // Enviar respuesta
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
?>
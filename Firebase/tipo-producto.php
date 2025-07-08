<?php
// Cabeceras para CORS y JSON
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluir archivo de conexión
require_once 'config.php';

$response = [];

try {
    // Manejar petición GET para obtener categorías
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Obtener todas las categorías
        $sql = "SELECT id, nombre FROM categorias ORDER BY nombre";
        $result = $conn->query($sql);
        
        if ($result) {
            $categorias = [];
            while ($row = $result->fetch_assoc()) {
                $categorias[] = [
                    'id' => (int)$row['id'],
                    'nombre' => $row['nombre']
                ];
            }
            
            $response = [
                'success' => true,
                'categorias' => $categorias
            ];
            http_response_code(200);
        } else {
            throw new Exception('Error al obtener categorías: ' . $conn->error);
        }
    }
    // Manejar petición POST para crear tipo
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Obtener datos del cuerpo JSON
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        if (!$data || !isset($data['categoria_id']) || !isset($data['tipo'])) {
            http_response_code(400);
            throw new Exception('Faltan parámetros obligatorios: categoria_id y tipo');
        }

        $categoria_id = intval($data['categoria_id']);
        $tipo = trim($data['tipo']);

        if ($categoria_id <= 0 || $tipo === '') {
            http_response_code(400);
            throw new Exception('Datos inválidos: categoria_id debe ser un entero positivo y tipo no puede estar vacío');
        }

        // Verificar si la categoria_id existe en la tabla 'categorias'
        $checkCategorySql = "SELECT id FROM categorias WHERE id = ?";
        $checkCategoryStmt = $conn->prepare($checkCategorySql);
        if (!$checkCategoryStmt) {
            throw new Exception('Error al preparar la consulta de categoría: ' . $conn->error);
        }
        $checkCategoryStmt->bind_param("i", $categoria_id);
        $checkCategoryStmt->execute();
        $checkCategoryStmt->store_result();

        if ($checkCategoryStmt->num_rows === 0) {
            http_response_code(404); // Not Found
            throw new Exception('La categoría con el ID proporcionado no existe.');
        }
        $checkCategoryStmt->close();

        // Verificar que no exista ya ese tipo con esa categoría
        $checkSql = "SELECT id FROM tipo_producto WHERE categoria = ? AND tipo = ?";
        $checkStmt = $conn->prepare($checkSql);
        if (!$checkStmt) {
            throw new Exception('Error al preparar la consulta de tipo_producto: ' . $conn->error);
        }
        $checkStmt->bind_param("is", $categoria_id, $tipo);
        $checkStmt->execute();
        $checkStmt->store_result();

        if ($checkStmt->num_rows > 0) {
            http_response_code(409); // Conflict
            throw new Exception('Este tipo ya existe para la categoría seleccionada');
        }
        $checkStmt->close();

        // Insertar nuevo tipo
        $sql = "INSERT INTO tipo_producto (categoria, tipo) VALUES (?, ?)";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception('Error al preparar la inserción del tipo: ' . $conn->error);
        }
        $stmt->bind_param("is", $categoria_id, $tipo);

        if ($stmt->execute()) {
            $response = [
                'success' => true,
                'message' => 'Tipo guardado correctamente',
                'id_tipo_producto' => $stmt->insert_id
            ];
            http_response_code(201); // Created
        } else {
            throw new Exception('Error al guardar tipo: ' . $stmt->error);
        }

        $stmt->close();
    }
    else {
        http_response_code(405); // Método no permitido
        throw new Exception('Método no permitido');
    }

} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => $e->getMessage()
    ];
    // Asegura que el código de respuesta HTTP se establezca solo si no ha sido establecido previamente
    if (http_response_code() === 200) {
        http_response_code(500); // Internal Server Error por defecto
    }
} finally {
    if (isset($conn) && $conn) {
        $conn->close();
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}
?>
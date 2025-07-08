<?php
// Cabeceras para CORS y JSON
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluir archivo de conexión
require_once 'config.php'; // Asegúrate de que este archivo contenga tu lógica de conexión

$response = [];

try {
    // Manejar petición GET para obtener categorías y tipos de producto
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $categorias = [];
        $tipos_producto = [];

        // Obtener todas las categorías
        $sqlCategorias = "SELECT id, nombre FROM categorias ORDER BY nombre";
        $resultCategorias = $conn->query($sqlCategorias);
        
        if ($resultCategorias) {
            while ($row = $resultCategorias->fetch_assoc()) {
                $categorias[] = [
                    'id' => (int)$row['id'],
                    'nombre' => $row['nombre']
                ];
            }
        } else {
            // Si hay un error al obtener categorías, aún podemos intentar obtener tipos
            error_log('Error al obtener categorías: ' . $conn->error);
        }

        // Obtener todos los tipos de producto
        $sqlTipos = "SELECT id, tipo, categoria FROM tipo_producto ORDER BY tipo";
        $resultTipos = $conn->query($sqlTipos);

        if ($resultTipos) {
            while ($row = $resultTipos->fetch_assoc()) {
                $tipos_producto[] = [
                    'id' => (int)$row['id'],
                    'tipo' => $row['tipo'],
                    'categoria' => (int)$row['categoria']
                ];
            }
        } else {
            error_log('Error al obtener tipos de producto: ' . $conn->error);
        }
        
        $response = [
            'success' => true,
            'categorias' => $categorias,
            'tipos_producto' => $tipos_producto // ¡Esta es la parte clave!
        ];
        http_response_code(200);
    }
    // ... (El resto de tu código para POST y PUT iría aquí, sin cambios)
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
    // Manejar petición PUT para modificar tipo
    elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        if (!$data || !isset($data['id']) || !isset($data['categoria_id']) || !isset($data['tipo'])) {
            http_response_code(400);
            throw new Exception('Faltan parámetros obligatorios: id, categoria_id y tipo');
        }

        $id = intval($data['id']);
        $categoria_id = intval($data['categoria_id']);
        $tipo = trim($data['tipo']);

        if ($id <= 0 || $categoria_id <= 0 || $tipo === '') {
            http_response_code(400);
            throw new Exception('Datos inválidos: id y categoria_id deben ser enteros positivos, y tipo no puede estar vacío');
        }

        // Verificar si el tipo de producto con el ID dado existe
        $checkTypeSql = "SELECT id FROM tipo_producto WHERE id = ?";
        $checkTypeStmt = $conn->prepare($checkTypeSql);
        if (!$checkTypeStmt) {
            throw new Exception('Error al preparar la consulta de verificación de tipo: ' . $conn->error);
        }
        $checkTypeStmt->bind_param("i", $id);
        $checkTypeStmt->execute();
        $checkTypeStmt->store_result();

        if ($checkTypeStmt->num_rows === 0) {
            http_response_code(404); // Not Found
            throw new Exception('El tipo de producto con el ID proporcionado no existe.');
        }
        $checkTypeStmt->close();

        // Verificar si la nueva categoria_id existe en la tabla 'categorias'
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
            throw new Exception('La categoría con el ID proporcionado para la actualización no existe.');
        }
        $checkCategoryStmt->close();

        // Verificar que no exista otro tipo_producto con la misma 'categoria' y 'tipo'
        // Esto es para evitar duplicados si se intenta cambiar un tipo a uno que ya existe para esa categoría,
        // excluyendo el propio registro que estamos actualizando.
        $checkDuplicateSql = "SELECT id FROM tipo_producto WHERE categoria = ? AND tipo = ? AND id != ?";
        $checkDuplicateStmt = $conn->prepare($checkDuplicateSql);
        if (!$checkDuplicateStmt) {
            throw new Exception('Error al preparar la consulta de duplicidad: ' . $conn->error);
        }
        $checkDuplicateStmt->bind_param("isi", $categoria_id, $tipo, $id);
        $checkDuplicateStmt->execute();
        $checkDuplicateStmt->store_result();

        if ($checkDuplicateStmt->num_rows > 0) {
            http_response_code(409); // Conflict
            throw new Exception('Ya existe un tipo con este nombre para la categoría seleccionada.');
        }
        $checkDuplicateStmt->close();
        
        // Actualizar el tipo de producto
        $sql = "UPDATE tipo_producto SET categoria = ?, tipo = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception('Error al preparar la actualización del tipo: ' . $conn->error);
        }
        $stmt->bind_param("isi", $categoria_id, $tipo, $id);

        if ($stmt->execute()) {
            // Verificar si alguna fila fue afectada (es decir, si la actualización realmente cambió algo)
            if ($stmt->affected_rows > 0) {
                $response = [
                    'success' => true,
                    'message' => 'Tipo de producto actualizado correctamente',
                    'id_tipo_producto' => $id
                ];
                http_response_code(200); // OK
            } else {
                $response = [
                    'success' => true,
                    'message' => 'Tipo de producto encontrado, pero no se realizaron cambios (los datos son los mismos).',
                    'id_tipo_producto' => $id
                ];
                http_response_code(200); // OK, aunque no hubo cambios.
            }
        } else {
            throw new Exception('Error al actualizar tipo de producto: ' . $stmt->error);
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

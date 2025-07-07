<?php
// Configuración de cabeceras CORS
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluir la conexión
require_once 'config.php';

$response = [];

try {
    // Verificar que la conexión existe
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception('Error de conexión a la base de datos: ' . $conn->connect_error);
    }

    // Configurar charset
    if (!$conn->set_charset("utf8mb4")) {
        throw new Exception('Error al configurar charset: ' . $conn->error);
    }

    // Manejar GET para obtener proveedores
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $sql = "SELECT id, nombre FROM proveedores ORDER BY nombre ASC";
        $result = $conn->query($sql);
        
        if (!$result) {
            throw new Exception('Error en consulta de proveedores: ' . $conn->error);
        }
        
        $proveedores = [];
        while($row = $result->fetch_assoc()) {
            $proveedores[] = $row;
        }
        
        $response = [
            'success' => true,
            'proveedores' => $proveedores
        ];
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit();
    }

    // Manejar POST para guardar productos
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Obtener datos JSON
        $json = file_get_contents('php://input');
        
        if (empty($json)) {
            http_response_code(400);
            throw new Exception('No se recibieron datos');
        }

        $data = json_decode($json, true);

        if ($data === null) {
            http_response_code(400);
            throw new Exception('Datos JSON inválidos: ' . json_last_error_msg());
        }

        // Validar campos obligatorios
        $camposRequeridos = ['nombre', 'descripcion', 'precio', 'stock', 'categoria'];
        foreach ($camposRequeridos as $campo) {
            if (!isset($data[$campo]) || trim($data[$campo]) === '') {
                http_response_code(400);
                throw new Exception("El campo '$campo' es requerido");
            }
        }

        // Limpiar y validar datos
        $nombre = trim($data['nombre']);
        $descripcion = trim($data['descripcion']);
        $precio = floatval($data['precio']);
        $stock = intval($data['stock']);
        $categoria = trim($data['categoria']);
        $marca = isset($data['marca']) ? trim($data['marca']) : null;
        $color = isset($data['color']) ? trim($data['color']) : null;
        $talla = isset($data['talla']) ? trim($data['talla']) : null;
        $tipo = isset($data['tipo']) ? trim($data['tipo']) : null;
        $status = isset($data['status']) ? intval($data['status']) : 1;
        $comprados = isset($data['comprados']) ? intval($data['comprados']) : 0;

        // Validar tipos de datos
        if ($precio <= 0) {
            http_response_code(400);
            throw new Exception('El precio debe ser un número positivo');
        }

        if ($stock < 0) {
            http_response_code(400);
            throw new Exception('El stock debe ser un número entero positivo o cero');
        }

        // Procesar imagen si existe
        $imagenURL = null;
        if (isset($data['imagenURL']) && !empty($data['imagenURL'])) {
            $imagenURL = procesarImagen($data['imagenURL'], $data['imagen_tipo'] ?? 'image/jpeg');
        }

        // Preparar consulta SQL con todos los campos
        $sql = "INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagenURL, color, talla, tipo, status, comprados, marca) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception('Error preparando consulta: ' . $conn->error);
        }
        
        $stmt->bind_param("ssdssssssiis", 
            $nombre, 
            $descripcion, 
            $precio, 
            $stock, 
            $categoria, 
            $imagenURL,
            $color,
            $talla,
            $tipo,
            $status,
            $comprados,
            $marca
        );

        // Ejecutar consulta
        if ($stmt->execute()) {
            $insertId = $stmt->insert_id;
            
            $response = [
                'success' => true,
                'message' => 'Producto guardado correctamente',
                'producto_id' => $insertId,
                'data' => [
                    'nombre' => $nombre,
                    'descripcion' => $descripcion,
                    'precio' => $precio,
                    'stock' => $stock,
                    'categoria' => $categoria,
                    'imagenURL' => $imagenURL,
                    'color' => $color,
                    'talla' => $talla,
                    'tipo' => $tipo,
                    'status' => $status,
                    'comprados' => $comprados,
                    'marca' => $marca
                ]
            ];
            http_response_code(201);
        } else {
            // Si hay error y se creó una imagen, eliminarla
            if ($imagenURL && file_exists($imagenURL)) {
                unlink($imagenURL);
            }
            throw new Exception('Error ejecutando consulta: ' . $stmt->error);
        }

        $stmt->close();
    }

} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => $e->getMessage()
    ];
    
    if (http_response_code() === 200) {
        http_response_code(500);
    }
} finally {
    if (isset($conn) && $conn) {
        $conn->close();
    }
}

// Función para procesar imagen
function procesarImagen($imagenBase64, $tipoImagen) {
    try {
        // Crear directorio si no existe
        $directorioImagenes = 'uploads/productos/';
        if (!file_exists($directorioImagenes)) {
            if (!mkdir($directorioImagenes, 0755, true)) {
                throw new Exception('No se pudo crear el directorio de imágenes');
            }
        }

        // Generar nombre único para la imagen
        $extension = 'jpg';
        switch ($tipoImagen) {
            case 'image/png':
                $extension = 'png';
                break;
            case 'image/gif':
                $extension = 'gif';
                break;
            case 'image/webp':
                $extension = 'webp';
                break;
        }

        $nombreArchivo = 'producto_' . time() . '_' . uniqid() . '.' . $extension;
        $rutaCompleta = $directorioImagenes . $nombreArchivo;

        // Decodificar base64 y guardar archivo
        $imagenData = base64_decode($imagenBase64);
        if ($imagenData === false) {
            throw new Exception('Error al decodificar imagen base64');
        }

        if (file_put_contents($rutaCompleta, $imagenData) === false) {
            throw new Exception('Error al guardar imagen');
        }

        return $rutaCompleta;

    } catch (Exception $e) {
        throw new Exception('Error procesando imagen: ' . $e->getMessage());
    }
}

// Enviar respuesta
echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>
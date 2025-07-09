<?php
// Habilitar CORS - Configuración completa
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Manejar preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluir la conexión a la base de datos
require_once 'config.php';

// Inicializar respuesta
$response = [];

try {
    // Verificar conexión a la base de datos
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception('Error de conexión a la base de datos: ' . ($conn->connect_error ?? 'Conexión no establecida'));
    }

    // Configurar charset
    if (!$conn->set_charset("utf8mb4")) {
        throw new Exception('Error al configurar charset: ' . $conn->error);
    }

    // Validar método GET
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        throw new Exception('Método no permitido');
    }

    // Obtener firebase_uid del parámetro GET con validación mejorada
    $firebase_uid = isset($_GET['firebase_uid']) ? trim($_GET['firebase_uid']) : '';
    
    if (empty($firebase_uid)) {
        http_response_code(400);
        throw new Exception('firebase_uid es requerido y no puede estar vacío');
    }

    // Validar formato básico del firebase_uid (opcional pero recomendado)
    if (strlen($firebase_uid) < 10) {
        http_response_code(400);
        throw new Exception('firebase_uid tiene formato inválido');
    }

    // Obtener el id_usuario basado en firebase_uid
    $sql_usuario = "SELECT id FROM usuarios WHERE firebase_uid = ?";
    $stmt_usuario = $conn->prepare($sql_usuario);
    
    if (!$stmt_usuario) {
        throw new Exception('Error al preparar consulta de usuario: ' . $conn->error);
    }
    
    $stmt_usuario->bind_param("s", $firebase_uid);
    $stmt_usuario->execute();
    $result_usuario = $stmt_usuario->get_result();

    if ($result_usuario->num_rows === 0) {
        http_response_code(404);
        throw new Exception('Usuario no encontrado con el firebase_uid proporcionado');
    }

    $usuario = $result_usuario->fetch_assoc();
    $id_usuario = $usuario['id'];

    // Consulta principal para obtener las compras con información del producto
    $sql_compras = "
        SELECT 
            c.id,
            c.id_producto,
            c.canti_productos,
            c.subtotal,
            c.itbms,
            c.total,
            c.direccion,
            c.metodo_pago,
            c.status,
            c.fecha_creacion,
            p.nombre as producto_nombre,
            p.precio as producto_precio,
            p.imagenURL as producto_imagen,
            p.categoria as producto_categoria,
            p.marca as producto_marca
        FROM carrito c
        INNER JOIN productos p ON c.id_producto = p.id
        WHERE c.id_usuario = ?
        ORDER BY c.fecha_creacion DESC
    ";

    $stmt_compras = $conn->prepare($sql_compras);
    
    if (!$stmt_compras) {
        throw new Exception('Error al preparar consulta de compras: ' . $conn->error);
    }
    
    $stmt_compras->bind_param("i", $id_usuario);
    $stmt_compras->execute();
    $result_compras = $stmt_compras->get_result();

    $compras_raw = [];
    while ($row = $result_compras->fetch_assoc()) {
        $compras_raw[] = $row;
    }

    // Agrupar compras por fecha y dirección (asumiendo que las compras del mismo momento tienen la misma fecha y dirección)
    $compras_agrupadas = [];
    
    foreach ($compras_raw as $compra) {
        // Crear una clave única para agrupar (fecha + dirección + método de pago)
        $fecha_key = date('Y-m-d H:i', strtotime($compra['fecha_compra']));
        $grupo_key = $fecha_key . '_' . $compra['direccion'] . '_' . $compra['metodo_pago'];
        
        if (!isset($compras_agrupadas[$grupo_key])) {
            $compras_agrupadas[$grupo_key] = [
                'fecha' => $compra['fecha_compra'],
                'direccion' => $compra['direccion'],
                'metodo_pago' => ucfirst($compra['metodo_pago']),
                'status' => $compra['status'],
                'total_compra' => 0,
                'total_productos' => 0,
                'items' => []
            ];
        }
        
        // Agregar el item a la compra agrupada
        $compras_agrupadas[$grupo_key]['items'][] = [
            'id' => (int)$compra['id'],
            'id_producto' => (int)$compra['id_producto'],
            'canti_productos' => (int)$compra['canti_productos'],
            'subtotal' => (float)$compra['subtotal'],
            'itbms' => (float)$compra['itbms'],
            'total' => (float)$compra['total'],
            'status' => $compra['status'],
            'fecha_compra' => $compra['fecha_compra'],
            'producto' => [
                'id' => (int)$compra['id_producto'],
                'nombre' => $compra['producto_nombre'],
                'precio' => (float)$compra['producto_precio'],
                'imagenURL' => $compra['producto_imagen'],
                'categoria' => $compra['producto_categoria'],
                'marca' => $compra['producto_marca']
            ]
        ];
        
        // Actualizar totales
        $compras_agrupadas[$grupo_key]['total_compra'] += (float)$compra['total'];
        $compras_agrupadas[$grupo_key]['total_productos'] += (int)$compra['canti_productos'];
    }

    // Convertir a array indexado y ordenar por fecha (más reciente primero)
    $compras_finales = array_values($compras_agrupadas);
    usort($compras_finales, function($a, $b) {
        return strtotime($b['fecha']) - strtotime($a['fecha']);
    });

    // Calcular estadísticas adicionales
    $total_compras = count($compras_finales);
    $total_gastado = 0;
    $total_productos_comprados = 0;
    
    foreach ($compras_finales as $compra) {
        $total_gastado += $compra['total_compra'];
        $total_productos_comprados += $compra['total_productos'];
    }

    // Preparar respuesta exitosa
    $response = [
        'success' => true,
        'compras' => $compras_finales,
        'estadisticas' => [
            'total_compras' => $total_compras,
            'total_gastado' => round($total_gastado, 2),
            'total_productos_comprados' => $total_productos_comprados,
            'compra_promedio' => $total_compras > 0 ? round($total_gastado / $total_compras, 2) : 0
        ],
        'debug' => [
            'firebase_uid' => $firebase_uid,
            'id_usuario' => $id_usuario,
            'compras_raw_count' => count($compras_raw)
        ]
    ];

    http_response_code(200);

} catch (Exception $e) {
    $response = [
        'success' => false,
        'error' => $e->getMessage(),
        'debug' => [
            'firebase_uid' => isset($firebase_uid) ? $firebase_uid : 'no_set',
            'get_params' => $_GET,
            'request_method' => $_SERVER['REQUEST_METHOD']
        ]
    ];
    
    if (http_response_code() === 200) {
        http_response_code(500);
    }
} finally {
    // Cerrar statements si existen
    if (isset($stmt_usuario) && $stmt_usuario) {
        $stmt_usuario->close();
    }
    if (isset($stmt_compras) && $stmt_compras) {
        $stmt_compras->close();
    }
    
    // Cerrar conexión
    if (isset($conn) && $conn) {
        $conn->close();
    }
}

// Limpiar buffer y enviar respuesta JSON
ob_clean();
echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
exit;
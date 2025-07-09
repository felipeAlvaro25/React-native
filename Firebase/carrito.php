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

    // Validar método POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        throw new Exception('Método no permitido');
    }

    // Obtener y validar datos JSON
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
    $camposRequeridos = ['firebase_uid', 'items', 'direccion', 'metodoPago', 'subtotal', 'itbms', 'total'];
    foreach ($camposRequeridos as $campo) {
        if (!isset($data[$campo])) {
            http_response_code(400);
            throw new Exception("El campo '$campo' es requerido");
        }
    }

    // Validación adicional para dirección
    if (empty(trim($data['direccion']))) {
        http_response_code(400);
        throw new Exception('La dirección no puede estar vacía');
    }

    // Validación para método de pago
    $metodosPagoPermitidos = ['efectivo', 'tarjeta', 'transferencia'];
    if (!in_array($data['metodoPago'], $metodosPagoPermitidos)) {
        http_response_code(400);
        throw new Exception('Método de pago no válido');
    }

    // Validar que hay items
    if (empty($data['items']) || !is_array($data['items'])) {
        http_response_code(400);
        throw new Exception('No se encontraron productos en el carrito');
    }

    // Obtener el id_usuario basado en firebase_uid
    $firebase_uid = $data['firebase_uid'];
    $sql_usuario = "SELECT id FROM usuarios WHERE firebase_uid = ?";
    $stmt_usuario = $conn->prepare($sql_usuario);
    $stmt_usuario->bind_param("s", $firebase_uid);
    $stmt_usuario->execute();
    $result_usuario = $stmt_usuario->get_result();

    if ($result_usuario->num_rows === 0) {
        http_response_code(404);
        throw new Exception('Usuario no encontrado');
    }

    $usuario = $result_usuario->fetch_assoc();
    $id_usuario = $usuario['id'];

    // Iniciar transacción
    $conn->begin_transaction();

    try {
        // Validar stock disponible para todos los productos
        foreach ($data['items'] as $item) {
            if (!isset($item['id'], $item['cantidad'], $item['precio'])) {
                throw new Exception('Datos incompletos para el producto');
            }

            $sql_stock = "SELECT stock FROM productos WHERE id = ?";
            $stmt_stock = $conn->prepare($sql_stock);
            $stmt_stock->bind_param("i", $item['id']);
            $stmt_stock->execute();
            $result_stock = $stmt_stock->get_result();

            if ($result_stock->num_rows === 0) {
                throw new Exception("Producto con ID {$item['id']} no encontrado");
            }

            $producto = $result_stock->fetch_assoc();
            if ($producto['stock'] < $item['cantidad']) {
                throw new Exception("Stock insuficiente para el producto con ID {$item['id']}");
            }
        }

        // Insertar registros en la tabla carrito
        $sql_carrito = "INSERT INTO carrito (id_producto, id_usuario, canti_productos, subtotal, itbms, total, direccion, metodo_pago, status) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')";
        $stmt_carrito = $conn->prepare($sql_carrito);

        $sql_detalle = "INSERT INTO detalles_compra (id_carrito, id_producto, id_usuario) VALUES (?, ?, ?)";
        $stmt_detalle = $conn->prepare($sql_detalle);

        $sql_update_producto = "UPDATE productos SET stock = stock - ?, comprados = comprados + ? WHERE id = ?";
        $stmt_update = $conn->prepare($sql_update_producto);

        $carritos_ids = [];
        $total_productos = 0;

        foreach ($data['items'] as $item) {
            // Calcular valores primero para evitar problemas con bind_param
            $subtotal_producto = $item['precio'] * $item['cantidad'];
            $itbms_producto = $subtotal_producto * 0.07;
            $total_producto = $subtotal_producto * 1.07;
            $total_productos += $item['cantidad'];

            // Insertar en tabla carrito
            $stmt_carrito->bind_param("iiddddss", 
                $item['id'],
                $id_usuario, 
                $item['cantidad'], 
                $subtotal_producto,
                $itbms_producto,
                $total_producto,
                $data['direccion'],
                $data['metodoPago']
            );

            if (!$stmt_carrito->execute()) {
                throw new Exception('Error al insertar en carrito: ' . $stmt_carrito->error);
            }

            $id_carrito = $conn->insert_id;
            $carritos_ids[] = $id_carrito;

            // Insertar detalle de compra
            $stmt_detalle->bind_param("iii", $id_carrito, $item['id'], $id_usuario);
            if (!$stmt_detalle->execute()) {
                throw new Exception('Error al insertar detalle de compra: ' . $stmt_detalle->error);
            }

            // Actualizar stock del producto
            $stmt_update->bind_param("iii", $item['cantidad'], $item['cantidad'], $item['id']);
            if (!$stmt_update->execute()) {
                throw new Exception('Error al actualizar producto: ' . $stmt_update->error);
            }
        }

        // Confirmar transacción
        $conn->commit();

        // Preparar respuesta exitosa
        $response = [
            'success' => true,
            'message' => 'Pedido procesado correctamente',
            'pedido_id' => uniqid(),
            'carritos_ids' => $carritos_ids,
            'usuario_id' => $id_usuario,
            'total_productos' => $total_productos,
            'subtotal' => $data['subtotal'],
            'itbms' => $data['itbms'],
            'total' => $data['total'],
            'direccion' => $data['direccion'],
            'metodo_pago' => $data['metodoPago']
        ];

        http_response_code(201);

    } catch (Exception $e) {
        // Revertir transacción en caso de error
        $conn->rollback();
        throw $e;
    }

} catch (Exception $e) {
    $response = [
        'success' => false,
        'error' => $e->getMessage()
    ];
    
    if (http_response_code() === 200) {
        http_response_code(500);
    }
} finally {
    // Cerrar statements si existen
    $closeables = ['stmt_usuario', 'stmt_carrito', 'stmt_detalle', 'stmt_update', 'stmt_stock'];
    foreach ($closeables as $var) {
        if (isset($$var)) {
            $$var->close();
        }
    }
    
    // Cerrar conexión
    if (isset($conn) && $conn) {
        $conn->close();
    }
}

// Limpiar buffer y enviar respuesta JSON
ob_clean();
echo json_encode($response, JSON_UNESCAPED_UNICODE);
exit;
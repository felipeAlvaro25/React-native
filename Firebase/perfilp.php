<?php
// Cabeceras CORS y tipo de contenido
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluir conexión (asegúrate que en config.php la variable se llama $conn)
require 'config.php';

// --- Bloque de prueba para validar conexión ---
if (isset($_GET['test']) && $_GET['test'] === 'true') {
    echo json_encode([
        'success' => true,
        'message' => '¡Conexión exitosa! El script perfil.php está en línea y se conectó a la base de datos.'
    ]);
    exit();
}

// Obtener el método HTTP
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (!isset($_GET['uid'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No se proporcionó el UID del usuario.']);
            exit;
        }

        $uid = $_GET['uid'];

        $stmt = $conn->prepare("SELECT nombre, apellido, email, direccion, edad, usuario FROM usuarios WHERE firebase_uid = ?");
        $stmt->bind_param("s", $uid);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($user = $result->fetch_assoc()) {
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado en la base de datos.']);
        }
        $stmt->close();
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);

        if (
            !isset($data['firebase_uid'], $data['nombre'], $data['apellido']) ||
            trim($data['nombre']) === '' || trim($data['apellido']) === ''
        ) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Datos incompletos para la actualización.']);
            exit;
        }

        $uid = $data['firebase_uid'];
        $nombre = trim($data['nombre']);
        $apellido = trim($data['apellido']);
        $direccion = $data['direccion'] ?? '';
        $edad = is_numeric($data['edad']) ? (int)$data['edad'] : null;
        $usuario = $data['usuario'] ?? '';

        $stmt = $conn->prepare("UPDATE usuarios SET nombre = ?, apellido = ?, direccion = ?, edad = ?, usuario = ? WHERE firebase_uid = ?");
        $stmt->bind_param("sssiss", $nombre, $apellido, $direccion, $edad, $usuario, $uid);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode(['success' => true, 'message' => 'Perfil actualizado correctamente.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'No se realizaron cambios o el usuario no fue encontrado.']);
            }
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar el perfil en la base de datos.']);
        }

        $stmt->close();
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no soportado.']);
        break;
}

// Cerrar conexión
$conn->close();
?>

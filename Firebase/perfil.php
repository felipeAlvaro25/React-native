<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require 'config.php';

// Verificar conexión a la base de datos
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (!isset($_GET['uid'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'UID de usuario no proporcionado']);
                exit;
            }

            $uid = trim($_GET['uid']);
            
            $stmt = $conn->prepare("SELECT nombre, apellido, email, direccion, edad, usuario FROM usuarios WHERE firebase_uid = ?");
            $stmt->bind_param("s", $uid);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($user = $result->fetch_assoc()) {
                echo json_encode(['success' => true, 'user' => $user]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            }
            $stmt->close();
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['firebase_uid'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'UID de Firebase no proporcionado']);
                exit;
            }

            $uid = $data['firebase_uid'];
            $nombre = $data['nombre'] ?? '';
            $apellido = $data['apellido'] ?? '';
            $direccion = $data['direccion'] ?? '';
            $edad = isset($data['edad']) && is_numeric($data['edad']) ? (int)$data['edad'] : null;
            $usuario = $data['usuario'] ?? '';

            $stmt = $conn->prepare("UPDATE usuarios SET nombre = ?, apellido = ?, direccion = ?, edad = ?, usuario = ? WHERE firebase_uid = ?");
            $stmt->bind_param("sssiss", $nombre, $apellido, $direccion, $edad, $usuario, $uid);

            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Perfil actualizado']);
            } else {
                throw new Exception("Error al actualizar perfil");
            }
            $stmt->close();
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método no permitido']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}

$conn->close();
?>
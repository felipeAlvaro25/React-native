<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') exit(0);

if ($_SERVER['REQUEST_METHOD'] != 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos JSON inválidos']);
    exit();
}

if (empty($input['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de proveedor requerido']);
    exit();
}

try {
    $stmt = $conn->prepare("SELECT id, logo FROM proveedores WHERE id = ?");
    $stmt->bind_param("i", $input['id']);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        throw new Exception('Proveedor no encontrado');
    }

    $proveedor = $result->fetch_assoc();
    $logoPath = $proveedor['logo'];

    // Validar nombre
    if (isset($input['nombre']) && strlen(trim($input['nombre'])) < 3) {
        http_response_code(400);
        throw new Exception('El nombre debe tener al menos 3 caracteres');
    }

    // Validar RUC
    if (isset($input['ruc'])) {
        if (strlen($input['ruc']) < 4 || !ctype_digit($input['ruc'])) {
            http_response_code(400);
            throw new Exception('El RUC debe tener al menos 4 dígitos numéricos');
        }

        $stmt = $conn->prepare("SELECT id FROM proveedores WHERE ruc = ? AND id != ?");
        $stmt->bind_param("si", $input['ruc'], $input['id']);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            http_response_code(409);
            throw new Exception('Ya existe otro proveedor con este RUC');
        }
    }

    // Si se proporciona imagen base64 válida
    if (!empty($input['logo']) && strpos($input['logo'], 'data:image/') === 0) {
        $nuevoLogo = guardarImagen($input['logo']);
        if (!$nuevoLogo) {
            http_response_code(500);
            throw new Exception('Error al guardar la imagen del logo');
        }

        // Borrar imagen anterior si es diferente
        if (!empty($proveedor['logo']) && $proveedor['logo'] != $nuevoLogo && file_exists(__DIR__ . '/' . $proveedor['logo'])) {
            unlink(__DIR__ . '/' . $proveedor['logo']);
        }
        $logoPath = $nuevoLogo;
    }

    // Preparar UPDATE dinámico
    $fields = ['nombre', 'ruc', 'categoria'];
    $updates = [];
    $types = '';
    $values = [];

    foreach ($fields as $field) {
        if (isset($input[$field])) {
            $updates[] = "$field = ?";
            $types .= 's';
            $values[] = $input[$field];
        }
    }

    if ($logoPath) {
        $updates[] = "logo = ?";
        $types .= 's';
        $values[] = $logoPath;
    }

    $updates[] = "updated_at = ?";
    $types .= 's';
    $values[] = date('Y-m-d H:i:s');

    $values[] = $input['id'];
    $types .= 'i';

    $sql = "UPDATE proveedores SET " . implode(", ", $updates) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$values);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Proveedor actualizado correctamente',
            'data' => ['id' => $input['id'], 'logo' => $logoPath]
        ]);
    } else {
        if (isset($nuevoLogo) && file_exists(__DIR__ . '/' . $nuevoLogo)) {
            unlink(__DIR__ . '/' . $nuevoLogo);
        }
        http_response_code(500);
        throw new Exception('Error al actualizar el proveedor: ' . $conn->error);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    $conn->close();
}

function guardarImagen($base64Image) {
    $parts = explode(',', $base64Image);
    if (count($parts) != 2) return false;

    $imageData = base64_decode($parts[1]);
    if (!$imageData) return false;

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_buffer($finfo, $imageData);
    finfo_close($finfo);

    $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png'];
    if (!isset($allowed[$mime])) return false;

    $extension = $allowed[$mime];
    $filename = 'uploads/proveedores/' . uniqid() . '.' . $extension;

    if (!file_exists(__DIR__ . '/uploads/proveedores')) {
        mkdir(__DIR__ . '/uploads/proveedores', 0755, true);
    }

    if (file_put_contents(__DIR__ . '/' . $filename, $imageData)) {
        return $filename;
    }

    return false;
}
?>

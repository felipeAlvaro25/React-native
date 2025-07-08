<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

// Manejar solicitud OPTIONS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Verificar método POST
if ($_SERVER['REQUEST_METHOD'] != 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

// Obtener datos del input (mejor que $_POST para manejar JSON)
$input = json_decode(file_get_contents('php://input'), true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos JSON inválidos']);
    exit();
}

// Validar campo obligatorio
if (empty($input['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de proveedor requerido']);
    exit();
}

try {
    // Preparar statement para mayor seguridad
    $stmt = $conn->prepare("SELECT id, logo FROM proveedores WHERE id = ?");
    $stmt->bind_param("i", $input['id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(404);
        throw new Exception('Proveedor no encontrado');
    }
    
    $proveedor = $result->fetch_assoc();
    $logoPath = $proveedor['logo']; // Mantener el logo actual por defecto
    
    // Validar RUC si se proporciona
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
    
    // Procesar imagen si se proporciona
    if (!empty($input['logo'])) {
        $logoPath = guardarImagen($input['logo']);
        if (!$logoPath) {
            http_response_code(500);
            throw new Exception('Error al procesar el logo');
        }
        
        // Eliminar imagen anterior si existe y es diferente a la nueva
        if (!empty($proveedor['logo']) && $proveedor['logo'] != $logoPath && file_exists(__DIR__.'/'.$proveedor['logo'])) {
            unlink(__DIR__.'/'.$proveedor['logo']);
        }
    }
    
    // Construir consulta dinámica
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
    
    $values[] = $input['id']; // Para el WHERE
    $types .= 'i';
    
    $sql = "UPDATE proveedores SET ".implode(', ', $updates)." WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$values);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Proveedor actualizado correctamente',
            'data' => [
                'id' => $input['id'],
                'logo' => $logoPath
            ]
        ]);
    } else {
        // Revertir cambios en imagen si falla
        if (isset($input['logo']) && $logoPath && file_exists(__DIR__.'/'.$logoPath)) {
            unlink(__DIR__.'/'.$logoPath);
        }
        http_response_code(500);
        throw new Exception('Error al actualizar el proveedor: '.$conn->error);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($stmt)) $stmt->close();
    $conn->close();
}

function guardarImagen($base64Image) {
    // Implementación básica - debes adaptarla a tus necesidades
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
    $filename = 'uploads/proveedores/'.uniqid().'.'.$extension;
    
    if (!file_exists(__DIR__.'/uploads/proveedores')) {
        mkdir(__DIR__.'/uploads/proveedores', 0755, true);
    }
    
    if (file_put_contents(__DIR__.'/'.$filename, $imageData)) {
        return $filename;
    }
    
    return false;
}
?>
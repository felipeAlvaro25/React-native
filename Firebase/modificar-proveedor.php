<?php
// Configuración común
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

// Manejar OPTIONS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Solo permitir POST
if ($_SERVER['REQUEST_METHOD'] != 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

// Validar campos requeridos
if (empty($_POST['id'])) {
    echo json_encode(['success' => false, 'message' => 'ID de proveedor requerido']);
    exit();
}

try {
    $id = $conn->real_escape_string($_POST['id']);
    
    // Verificar si existe el proveedor
    $check = $conn->query("SELECT id FROM proveedores WHERE id = '$id'");
    if ($check->num_rows === 0) {
        throw new Exception('Proveedor no encontrado');
    }

    // Validar RUC si se está modificando
    if (isset($_POST['ruc'])) {
        $ruc = $conn->real_escape_string($_POST['ruc']);
        if (strlen($ruc) < 4 || !ctype_digit($ruc)) {
            throw new Exception('El RUC debe tener al menos 4 dígitos numéricos');
        }
        
        // Verificar si el RUC ya existe en otro proveedor
        $checkRuc = $conn->query("SELECT id FROM proveedores WHERE ruc = '$ruc' AND id != '$id'");
        if ($checkRuc->num_rows > 0) {
            throw new Exception('Ya existe otro proveedor con este RUC');
        }
    }

    // Procesar imagen si se envió
    $logoPath = null;
    if (!empty($_POST['logo'])) {
        $logoPath = guardarImagen($_POST['logo']);
        if (!$logoPath) {
            throw new Exception('Error al procesar el logo');
        }
    }

    // Construir consulta de actualización
    $updates = [];
    $fields = ['nombre', 'ruc', 'categoria'];
    
    foreach ($fields as $field) {
        if (isset($_POST[$field])) {
            $value = $conn->real_escape_string($_POST[$field]);
            $updates[] = "$field = '$value'";
        }
    }
    
    if ($logoPath) {
        $updates[] = "logo = '$logoPath'";
        // Eliminar imagen anterior
        eliminarImagenAnterior($conn, $id);
    }
    
    $updates[] = "updated_at = '" . date('Y-m-d H:i:s') . "'";
    
    $sql = "UPDATE proveedores SET " . implode(', ', $updates) . " WHERE id = '$id'";

    if ($conn->query($sql)) {
        echo json_encode([
            'success' => true,
            'message' => 'Proveedor actualizado correctamente'
        ]);
    } else {
        // Eliminar imagen nueva si falló la actualización
        if ($logoPath && file_exists(__DIR__ . '/' . $logoPath)) {
            unlink(__DIR__ . '/' . $logoPath);
        }
        throw new Exception('Error al actualizar: ' . $conn->error);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    $conn->close();
}

function guardarImagen($base64Image) {
    // [Misma implementación que en agregar-proveedor.php]
    // ...
}

function eliminarImagenAnterior($conn, $id) {
    $result = $conn->query("SELECT logo FROM proveedores WHERE id = '$id'");
    if ($result && $row = $result->fetch_assoc()) {
        if (!empty($row['logo']) && file_exists(__DIR__ . '/' . $row['logo'])) {
            unlink(__DIR__ . '/' . $row['logo']);
        }
    }
}
?>
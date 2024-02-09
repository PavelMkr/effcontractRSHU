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
router.post('/upload', upload.array('files[]'), (req, res) => {
    const username = req.session.user.login;

    // Проверка наличия загруженных файлов
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('Нет файлов для загрузки');
    }

    // Обработка каждого загруженного файла
    req.files.forEach(file => {
        const targetPath = `${uploadDir}/${username}/${file.originalname}`;
        console.log(targetPath);

        // Перемещаем загруженный файл в целевую папку
        fs.rename(file.path, targetPath, (err) => {
            if (err) {
                console.error('Ошибка перемещения файла:', err);
                return res.status(500).send('Ошибка перемещения файла');
            }
        });
    });

    // Отправляем клиенту ответ после обработки всех файлов
    res.status(200).json({ message: 'Файлы успешно загружены' });
});



module.exports = router;

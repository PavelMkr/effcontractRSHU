const { Router } = require('express');
const router = Router();
const multer = require('multer');
const fs = require('fs');
const { createPool } = require('mysql2/promise');


// Место, куда будут загружены файлы
const uploadDir = './uploadedFiles';

// Создаем пул соединений к базе данных
const pool = new createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'server2',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Создаем объект multer для загрузки файлов
const upload = multer({ 
    dest: uploadDir,
    preservePath: true
});

// Маршрут для обработки POST-запроса на загрузку файла
router.post('/upload', upload.array('files[]'), async (req, res) => {
    const username = req.session.user.login;
    const connection = await pool.getConnection();

    const educatorIdResult = await connection.execute(
        'SELECT educator_id FROM employees WHERE login = ?', [username]
    );
    const educatorId = educatorIdResult[0][0].educator_id;
    //console.log('educatorId =', educatorId);

    await connection.execute(
        'INSERT INTO eff_contract (educator_id, all_value, checked) VALUES (?, ?, ?)', [educatorId, 0, 0]
    );
    const effContracts = await connection.execute(
        'SELECT MAX(id_ek) as id_ek FROM eff_contract WHERE educator_id = ?', [educatorId]
    );
    const effContractId = effContracts[0][0].id_ek;
    //console.log('effContractId =', effContractId)

    // Проверка наличия загруженных файлов
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('Нет файлов для загрузки');
    }

    try {
        
        await connection.beginTransaction();

        

        for (const file of req.files) {
            // Проверка на существование пути. Если не существует - создать
            const targetPath = `${uploadDir}/${username}/${effContractId}`;
            if (!fs.existsSync(targetPath)) {
                // Создаем промежуточные директории с recursive: true
                fs.mkdirSync(targetPath, { recursive: true }, (err) => {
                    if (err) {
                        console.error('Ошибка при создании директории:', err);
                    }
                });
            }

            // Перемещаем загруженный файл в целевую папку
            await fs.promises.rename(file.path, `${targetPath}/${file.originalname}`);

            // Вставляем информацию о загруженном файле в базу данных
            await connection.execute(
                'INSERT INTO docs (id_ek, educator_id, id_index, count, value, file_name) VALUES (?, ?, ?, ?, ?, ?)', [effContractId, educatorId, 311, 1, 4, file.originalname]);
        }

        // Фиксируем транзакцию
        await connection.commit();

        // Освобождаем соединение
        connection.release();

        // Отправляем клиенту успешный ответ
        res.status(200).json({ message: 'Файлы успешно загружены' });
    } catch (error) {
        // Если произошла ошибка, откатываем транзакцию и освобождаем соединение
        console.error('Ошибка при загрузке файлов:', error);
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        res.status(500).send('Ошибка загрузки файлов');
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const { createPool } = require('mysql2/promise');
const path = require('path');

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
    preservePath: true,
    encoding: 'utf-8'
});

// Маршрут для обработки POST-запроса на загрузку файла
router.post('/upload', upload.array('files[]'), async (req, res) => {
    const username = req.session.user.login;
    const connection = await pool.getConnection();

    const educatorIdResult = await connection.execute(
        'SELECT educator_id FROM employees WHERE login = ?', [username]
    );
    const educatorId = educatorIdResult[0][0].educator_id;

    let effContractId;

    try {
        await connection.beginTransaction();

        // Проверка наличия загруженных файлов
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Нет файлов для загрузки' })
        }

        // Создаем ЭК один раз перед циклом загрузки файлов
        await connection.execute(
            'INSERT INTO eff_contract (educator_id, all_value, checked) VALUES (?, ?, ?)', [educatorId, 0, 0]
        );
        const effContracts = await connection.execute(
            'SELECT MAX(id_ek) as id_ek FROM eff_contract WHERE educator_id = ?', [educatorId]
        );
        effContractId = effContracts[0][0].id_ek;

        // Цикл по каждому файлу
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i]; // Получаем файл
            file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8') // Исправление названия файлов
            const index = req.body['index'][i]; // Получаем индекс из массива
            const idInput = req.body['id_input'][i]; // Получаем idInput из массива
            const count = req.body['first'][i]; // Получаем count из массива
            const point = req.body['result'][i]; // Получаем point из массива
            console.log(count, point)


            const targetPath = `${uploadDir}/${username}/${effContractId}/${index}`;
            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath, { recursive: true }, (err) => {
                    if (err) {
                        console.error('Ошибка при создании директории:', err);
                    }
                });
            }

            const nameIndexFull = await connection.execute(
                'SELECT name FROM table_index WHERE id_index = ?', [idInput]
            );
            const nameIndex = nameIndexFull[0][0].name.split(' ')[0];

            await fs.promises.rename(file.path, `${targetPath}/${nameIndex} ${file.originalname}`);

            await connection.execute(
                'INSERT INTO docs (id_ek, educator_id, id_index, count, value, file_name) VALUES (?, ?, ?, ?, ?, ?)', [effContractId, educatorId, idInput, count, point, file.originalname]);
        }

        // Обновляем all_value в ЭК после загрузки файлов
        await connection.execute(`
            UPDATE eff_contract AS ec
            SET all_value = (
                SELECT SUM(d.value)
                FROM docs AS d
                WHERE d.id_ek = ec.id_ek
            )
            WHERE ec.id_ek = ?
        `, [effContractId]);

        await connection.commit();

        connection.release();

        res.status(200).json({ message: 'Файлы успешно загружены' });
    } catch (error) {
        console.error('Ошибка при загрузке файлов:', error);
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        res.status(500).json({ message: 'Ошибка при загрузке файлов' });
    }
});

router.post('/confirmDocuments', async (req, res) => {
    const connection = await pool.getConnection();
    const selectedIds = req.body;
    console.log('selectedIds:', selectedIds);

    if (!selectedIds || selectedIds.length === 0) {
        return res.json({ success: false, message: 'Выберите значение' });
    }

    try {
        // Обновляем данные в таблице docs
        for (const idCheck of selectedIds) {
            await connection.execute('UPDATE docs SET checked = 1 WHERE (id_doc = ?)', [idCheck]);
        }
        
        // Проверяем и обновляем таблицу eff_contract
        const userCheckedId = await connection.execute('SELECT educator_id FROM docs WHERE id_ek = ?', [selectedIds[0][0]]);
        console.log('userCheckedId[0][0] =', userCheckedId[0][0].educator_id);
        await connection.execute('UPDATE eff_contract AS ec SET ec.checked = 1 WHERE ec.checked = 0 AND NOT EXISTS (SELECT 1 FROM docs AS d WHERE d.id_ek = ec.id_ek AND d.checked = 0) and ec.educator_id = 1;', [userCheckedId[0][0].educator_id]);

        await connection.commit();

        connection.release();

        return res.json({ success: true });
    } catch (error) {
        console.error('Ошибка при обновлении данных:', error);
        return res.json({ success: false, message: 'Произошла ошибка' });
    }
});

router.get('../uploadedFiles/:login/:id_ek/:section/:index_name', async (req, res) => {
    const { login, id_ek, section, index_name } = req.params;
    const filePath = path.join(__dirname, 'uploadedFiles', login, id_ek, section, index_name);

    // Установите правильный заголовок Content-Type для PDF
    res.setHeader('Content-Type', 'application/pdf');

    // Отправьте файл в ответе
    res.sendFile(filePath);
});



module.exports = router;

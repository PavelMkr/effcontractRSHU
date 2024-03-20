// Файл создания excel файла для Сводной таблицы
const express = require('express');
const router = express.Router();
const db = require('../db'); // Подключение бд
const { createPool } = require('mysql2/promise');


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

router.get('/createTable', async (req, res) => {
    try {
        // Получаем параметры из запроса
        const { department, position } = req.query;
        // Запрос к базе данных для получения данных
        // let sqlQuery = 'SELECT educator_id, last_name, name_real, patronymic, department, position FROM employees';
        let sqlQuery = 'SELECT employees.last_name as last_name,employees.name_real as name_real,employees.patronymic as patronymic,employees.position as position,employees.department as department, eff_contract.all_value as userScore FROM employees, eff_contract WHERE employees.educator_id = eff_contract.educator_id';

        if (department) {
            sqlQuery += ` AND department = '${department}'`;
        }

        if (position) {
            sqlQuery += ` AND position = '${position}'`;
        }
        const responseTableData = await db.executeQuery(sqlQuery)

        // Отправляем данные в ответ на запрос
        res.json(responseTableData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
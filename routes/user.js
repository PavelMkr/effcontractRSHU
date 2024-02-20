// роут авторизированных пользователей

const {Router} = require('express');
const router = Router();
const db = require('../db'); // Модуль с базой данных
const session = require('express-session');

router.get('/user/teacher', (req, res) => {
    res.render('prepod', {
        title: `Страница Преподавателя`,
        isPrepod: true
    })
})

router.get('/user/deanOrDirector', (req, res) => {
    res.render('deka-dir', {
        title: `Страница Декана или Директора`,
        isDekaDir: true
    })
})

router.get('/user/headOfDepartment', (req, res) => {
    res.render('zavkaf', {
        title: `Страница Заведующего кафедры`,
        isZavKaf: true
    })
})

router.get('/user/admin', async (req, res) => {
    const usersData = await db.executeQuery(`
        SELECT e.*, 
            COALESCE(ec.not_checked, 0) AS not_checked,
            COALESCE(ec.all_ek, 0) AS all_ek
        FROM employees e
        LEFT JOIN (
        SELECT educator_id,
                COUNT(CASE WHEN checked = 0 THEN 1 END) AS not_checked,
                COUNT(*) AS all_ek
        FROM eff_contract
        GROUP BY educator_id
        ) ec ON e.educator_id = ec.educator_id
        WHERE e.position != 'admin';
        `);
        // console.log(usersData);
    res.render('adminpanel', {
        title: `Административная панель`,
        isAdmin: true,
        usersData,
    })
})

router.get('/adminUserEK/:educator_id', async (req, res) => {
    const educator_id = req.params.educator_id;

    const userEKData = await db.executeQuery(`
    SELECT DISTINCT 
        docs.*, eff_contract.checked, employees.login, DATE_FORMAT(docs.id_period, '%y-%m-%d') AS date, LEFT(docs.id_index, 1) AS section, table_index.name AS index_name
    FROM 
        docs
    INNER JOIN 
        eff_contract ON docs.educator_id = eff_contract.educator_id
    INNER JOIN 
        employees ON employees.educator_id = docs.educator_id
    INNER JOIN 
        table_index ON table_index.id_index = docs.id_index
    WHERE 
        docs.educator_id = ? AND docs.checked = 0;
    `, [educator_id]);

    res.render('adminUserEK', {
        title: `Страница подтверждения документов`,
        isUserEk: true,
        isAdmin: req.session.isAdmin,
        userEKData
    });
});

// Для всех
router.get('/profile',(req, res) => {
    //console.log(req.session.isAdmin);
    //console.log(req.session.isZavKaf);
    //console.log(req.session.isDekaDir);
    //console.log(req.session.isPrepod);
    //console.log(req.session.user.position);
    res.render('profile', {
        title: `Профиль`,
        user: req.session.user,
        isProfile: true,
        isAdmin: req.session.isAdmin,
        isZavKaf: req.session.isZavKaf,
        isDekaDir: req.session.isDekaDir,
        isPrepod: req.session.isPrepod
    })
})

router.get('/checkedReports', async (req, res) => {
    const checkedData = await db.executeQuery(`
    SELECT
        eff_contract.id_ek,
        employees.*,
        COUNT(CASE WHEN eff_contract.checked = 0 THEN 1 END) AS not_checked,
        COUNT(*) AS all_ek
    FROM
        eff_contract
    JOIN
        employees ON eff_contract.educator_id = employees.educator_id
    WHERE
        eff_contract.checked = 1
    GROUP BY
        eff_contract.educator_id, eff_contract.id_ek;
    `);
    // console.log(checkedData)
    res.render('checkedReports', {
        title: `Проверенные отчеты`,
        isCheckedReports: true,
        isAdmin: true,
        checkedData
    })
})

router.get('/summTable', async (req, res) => {
    res.render('summtable', {
        title: `Сводная таблица`,
        isSummTable: true,
        isAdmin: true
    })
})

router.get('/registerPage', async (req,res) => {
    res.render('regPage', {
        title: `Страница регистрации`,
        isRegisterPage: true,
        isZavKaf:true
    })
})

router.get('/reducingIndicators', async (req,res) => {
    lowBallData = await db.executeQuery(`
    SELECT 
        emp.last_name,
        emp.name_real,
        emp.patronymic,
        emp.position,
        emp.educator_id,
        ef.id_ek 
    FROM 
        eff_contract AS ef
    JOIN 
        employees AS emp ON ef.educator_id = emp.educator_id
    JOIN 
        table_department AS td ON emp.department = td.department
    WHERE
        ef.checked = 0 
        AND td.institute = (
            SELECT
                institute
            FROM
                table_department
            WHERE
                department = ?
                AND department = table_department.department
        );
    `, [req.session.user.department]); // 
    //console.log(req.session.institute)
    //console.log(lowBallData)
    
    res.render('lowball', {
        title: `Страница понижающих показателей`,
        isLowBall: true,
        isAdmin: req.session.isAdmin,
        isZavKaf: req.session.isZavKaf,
        isDekaDir: req.session.isDekaDir,
        lowBallData
    })
})

router.get('/confirmDocument', async (req,res) => {
    const confirmData = await db.executeQuery(`
    SELECT 
        emp.last_name, emp.name_real, emp.patronymic, emp.position, emp.educator_id, ef.id_ek 
    FROM 
        eff_contract as ef, employees as emp
    WHERE
        ef.educator_id = emp.educator_id and ef.checked = 0 and emp.department = ? and emp.position = "Prepodavatel"
    `, [req.session.user.department]);
    //console.log('Инфа:')
    //console.log(confirmData)
    //console.log(req.session.user)
    res.render('confirmEK', {
        title: `Страница подтверждения документов`,
        isConfirmEK: true,
        isDekaDir: req.session.isDekaDir,
        confirmData
    })
})



module.exports = router;

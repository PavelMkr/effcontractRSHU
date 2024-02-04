// роут авторизации
const { Router } = require('express');
const router = Router();
const session = require('express-session'); // Модуль с сессией
const db = require('../db');


router.use(
    session({
      secret: 'RSHU',
      resave: false,
      saveUninitialized: false,
    })
  );

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Поиск пользователя в базе данных
    db.query('SELECT * FROM employees WHERE login = ? AND password = ?', [username, password], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error logging in');
        } else if (results.length > 0) {
            const user = results[0];
            req.session.user = user;
            console.log(req.session.user);

            // Проверка роли пользователя
            if (user.position === 'Prepodavatel') {
                req.session.isPrepod = true;
                res.redirect('/user/teacher');
            } else if (user.position === 'Direktor' || user.position === 'Dekan') {
                req.session.isDekaDir = true;
                res.redirect('/user/deanOrDirector');
            } else if (user.position === 'ZavKafedri') {
                req.session.isZavKaf = true;
                res.redirect('/user/headOfDepartment');
            } else if (user.position === 'admin') {
                req.session.isAdmin = true;
                res.redirect('/user/admin');
            } else {
                res.status(401).send('Invalid role');
            }
        } else {
            //res.status(401).send('Invalid username or password');
            req.flash('error', 'Неправильный логин или пароль'); // Set flash message for invalid credentials
            res.status(401).redirect('/');
        }
    });
});

router.get('/logout', (req, res) => {
    // Разрушение сессии
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Internal Server Error');
        } else {
            // Перенаправление на страницу входа
            res.redirect('/');
        }
    });
});

module.exports = router;

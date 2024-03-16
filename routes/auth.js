// роут авторизации
const { Router } = require('express');
const router = Router();
const session = require('express-session'); // Модуль с сессией
const bcrypt = require('bcrypt');
const db = require('../db');
const connection = require('../db');


router.use(
    session({
      secret: 'RSHU',
      resave: false,
      saveUninitialized: false,
    })
  );

  router.post('/login', (req, res) => {
      const { username, password } = req.body; // Данные не зашифрованы
  
      // Поиск пользователя в базе данных
      db.query('SELECT * FROM employees WHERE login = ?', [username], (error, results) => {
          if (error) {
              console.error(error);
              res.status(500).send('Error logging in');
          } else if (results.length > 0) {
              const user = results[0];
              // Сравниваем хэш пароля в базе данных с введенным паролем
              bcrypt.compare(password, user.password, (err, passwordMatch) => {
                  if (err) {
                      console.error(err);
                      res.status(500).send('Error comparing passwords');
                  } else if (passwordMatch) {
                      req.session.user = user;
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
                      req.flash('error', 'Неправильный логин или пароль');
                      res.status(401).redirect('/');
                  }
              });
          } else {
              req.flash('error', 'Неправильный логин или пароль');
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

router.post('/register', async (req, res) => {
    const { lastname, firstname, patronymic, stavka, username, password, position, department } = req.body;

    try {
        // Проверка наличия пользователя с таким логином
        const existingUser = await db.executeQuery('SELECT login FROM employees WHERE login = ?', [username]);

        if (existingUser.length > 0) {
            //console.log('Пользователь с таким логином уже существует');
            return res.status(400).send('Пользователь с таким логином уже существует');
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 4);
        const lastCount = await db.executeQuery('SELECT COUNT(*) as count from employees'); // Костыль, надо добавить auto increment в бд mysql
        // Добавление пользователя в базу данных
        await db.executeQuery('INSERT INTO employees (educator_id, last_name, name_real, patronymic, department, position, stavka, login, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [lastCount[0]['count'], lastname, firstname, patronymic, department, position, stavka, username, hashedPassword]);

        //console.log('Пользователь успешно зарегистрирован в системе');
        return res.status(200).send('Пользователь успешно зарегистрирован в системе');
    } catch (error) {
        console.error('Ошибка при регистрации пользователя', error);
        return res.status(500).send('Ошибка при регистрации пользователя');
    }
});


module.exports = router;

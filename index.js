//Основной файл проекта
// Подключенные модули
const express = require('express') // Подключаем библиотеку Express и сохраняем её в переменной express
const session = require('express-session'); // Подключение сессий
const path = require('path') // Подключаем библиотеку path для работы с путями файлов
const exphbs = require('express-handlebars')// Подключаем библиотеку express-handlebars для работы с шаблонами Handlebars
const flash = require('connect-flash'); // Подключаем модуль connect-flash для работы с flash-сообщениями
const db = require('./db'); // Подключение бд
const errorHandler= require('./middleware/error'); // Подключение ошибок (404)

// Подключаем модули с маршрутами (роутами) для различных страниц
const homeRoutes = require('./routes/home.js');
const userRoutes = require('./routes/user.js');
const authRoutes = require('./routes/auth.js');
const uploadRoutes = require('./routes/upload.js');


const app = express()// Создаем экземпляр приложения Express

app.use(
  session({
    secret: 'RSHU',
    resave: false,
    saveUninitialized: false,
  })
);

// Создаем экземпляр Handlebars с определенными настройками
const hbs = exphbs.create({
  defaultLayout: 'main', // Имя главного шаблона
  extname: 'hbs', // Расширение файлов шаблонов
  helpers: {
    funcNotChecked: function (educator_id) {
      const notChecked = db.executeQuery(`SELECT COUNT(*) as not_checked FROM eff_contract WHERE checked = 0 AND educator_id = ?`, [educator_id]);
      //console.log(notChecked[0].not_checked);
      return notChecked[0].not_checked;
    },
    funcAllEk: function (educator_id) {
      const allEk = db.executeQuery(`SELECT COUNT(*) as all_ek FROM eff_contract WHERE educator_id = ?`, [educator_id]);
      //console.log(allEk[0].all_ek);
      return allEk[0].all_ek;
    },
    or: function () {
      // 'arguments' is an array-like object containing all passed arguments
      for (let i = 0; i < arguments.length - 1; i++) {
        if (arguments[i]) {
          return false;
        }
      }
      return true;
    },
  },
})
app.engine('hbs', hbs.engine)// Устанавливаем Handlebars в качестве движка для рендеринга представлений
app.set('view engine', 'hbs')// Устанавливаем 'hbs' как расширение файлов шаблонов по умолчанию

app.use(express.static('public'))// Указываем Express использовать статические файлы из папки 'public'
app.use(express.urlencoded({ extended: true }))// Позволяет Express обрабатывать данные из HTML-форм в формате x-www-form-urlencoded
app.use(flash())

// Устанавливаем обработчики маршрутов для различных частей приложения
app.use(homeRoutes)
app.use(userRoutes)
app.use(authRoutes)
app.use(uploadRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 3000 // Задаем порт, который будет использоваться приложением (или используем порт по умолчанию 3000)

// Приложение слушает указанный порт и выводит сообщение при успешном запуске
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
  })



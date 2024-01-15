const {Router} = require('express')
const router = Router()

router.get('/', (req, res) => {
    res.render('index', {
        title: 'Страница авторизации "Эффективный контракт"',
        isHome: true,
        errorStatus: req.flash('error')
    })
})

module.exports = router
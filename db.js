const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'server2'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database: ' + err.stack);
        return;
    }
    console.log('Connected to database as id ' + connection.threadId);
});

const executeQuery = async (query, values) => {
    return new Promise((resolve, reject) => {
        connection.query(query, values, (error, results, fields) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};

// connection.query('SELECT * FROM employees', (error, results, fields) => {
//     if (error) throw error;
//     console.log('The result is: ', results);
// });

// connection.end((err) => {
//     if (err) {
//         console.error('Error closing database connection: ' + err.stack);
//         return;
//     }
//     console.log('Database connection closed.');
// });

module.exports = connection;
module.exports.executeQuery = executeQuery;
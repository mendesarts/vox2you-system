const Task = require('./server/models/Task'); const Lead = require('./server/models/Lead');
const sequelize = require('./server/config/database');
(async () => {
    try {
        const tasks = await Task.findAll({ 
            limit: 5, 
            order: [['createdAt', 'DESC']],
            include: [{model: Lead, attributes: ['id', 'status']}]
        });
        console.log(JSON.stringify(tasks, null, 2));
    } catch (e) { console.error(e); }
})();

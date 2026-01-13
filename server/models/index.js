const sequelize = require('../config/database');
const defineAssociations = require('./associations');

const models = {
    AIConfig: require('./AIConfig'),
    Attendance: require('./Attendance'),
    CalendarBlock: require('./CalendarBlock'),
    CashRegister: require('./CashRegister'),
    Class: require('./Class'),
    ClassSession: require('./ClassSession'),
    Course: require('./Course'),
    Enrollment: require('./Enrollment'),
    FinancialRecord: require('./FinancialRecord'),
    Holiday: require('./Holiday'),
    Lead: require('./Lead'),
    Mentorship: require('./Mentorship'),
    Module: require('./Module'),
    Student: require('./Student'),
    Task: require('./Task'),
    Transfer: require('./Transfer'),
    Unit: require('./Unit'),
    User: require('./User'),
    UserAvailability: require('./UserAvailability'),
    CadenceLog: require('./CadenceLog'),
    ContactAttempt: require('./ContactAttempt'),
    StudentLog: require('./StudentLog')
};

// Initialize associations
defineAssociations();

module.exports = {
    sequelize,
    ...models
};

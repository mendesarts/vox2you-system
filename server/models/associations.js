const Student = require('./Student');
const User = require('./User');
const Course = require('./Course');
const Class = require('./Class');
const Attendance = require('./Attendance');
const Mentorship = require('./Mentorship');
const Transfer = require('./Transfer');
const Module = require('./Module');
const ClassSession = require('./ClassSession');
const FinancialRecord = require('./FinancialRecord');
const CashRegister = require('./CashRegister');
const Holiday = require('./Holiday');
const Enrollment = require('./Enrollment');
const Unit = require('./Unit');
const Lead = require('./Lead');
const StudentLog = require('./StudentLog');
const UnitConfig = require('./UnitConfig');
const CadenceLog = require('./CadenceLog');
const ContactAttempt = require('./ContactAttempt');
const Message = require('./Message');


function defineAssociations() {
    // Unit Associations
    Unit.hasMany(User, { foreignKey: 'unitId' });
    User.belongsTo(Unit, { foreignKey: 'unitId' });

    Unit.hasMany(Lead, { foreignKey: 'unitId' });
    Lead.belongsTo(Unit, { foreignKey: 'unitId' });

    Lead.belongsTo(User, { as: 'consultant', foreignKey: 'consultant_id' });
    User.hasMany(Lead, { foreignKey: 'consultant_id' });

    Unit.hasMany(Student, { foreignKey: 'unitId' });
    Student.belongsTo(Unit, { foreignKey: 'unitId' });

    Unit.hasMany(Class, { foreignKey: 'unitId' });
    Class.belongsTo(Unit, { foreignKey: 'unitId' });

    Unit.hasMany(FinancialRecord, { foreignKey: 'unitId' });
    FinancialRecord.belongsTo(Unit, { foreignKey: 'unitId' });

    // Class -> Course
    Class.belongsTo(Course, { foreignKey: 'courseId' });
    Course.hasMany(Class, { foreignKey: 'courseId' });

    // Class -> User (as Professor)
    Class.belongsTo(User, { as: 'professor', foreignKey: 'professorId' });
    User.hasMany(Class, { foreignKey: 'professorId' });

    // Course -> Module (Program)
    Module.belongsTo(Course, { foreignKey: 'courseId' });
    Course.hasMany(Module, { foreignKey: 'courseId', onDelete: 'CASCADE' });

    // Student -> Class, Course
    Student.belongsTo(Class, { foreignKey: 'classId' });
    Class.hasMany(Student, { foreignKey: 'classId' });

    Student.belongsTo(Course, { foreignKey: 'courseId' }); // Optional direct link
    Course.hasMany(Student, { foreignKey: 'courseId' });

    // Attendance -> Student, Class
    Attendance.belongsTo(Student, { foreignKey: 'studentId' });
    Student.hasMany(Attendance, { foreignKey: 'studentId' });

    Student.hasMany(StudentLog, { foreignKey: 'studentId' });
    StudentLog.belongsTo(Student, { foreignKey: 'studentId' });

    Attendance.belongsTo(Class, { foreignKey: 'classId' });
    Class.hasMany(Attendance, { foreignKey: 'classId' });

    // Mentorship -> Student, User (as Mentor)
    Mentorship.belongsTo(Student, { foreignKey: 'studentId' });
    Student.hasMany(Mentorship, { foreignKey: 'studentId' });

    Mentorship.belongsTo(User, { as: 'mentor', foreignKey: 'mentorId' });
    User.hasMany(Mentorship, { foreignKey: 'mentorId' });

    // Transfer -> Student, fromClass, toClass
    Transfer.belongsTo(Student, { foreignKey: 'studentId' });
    Student.hasMany(Transfer, { foreignKey: 'studentId' });

    Transfer.belongsTo(Class, { as: 'fromClass', foreignKey: 'fromClassId' });
    Transfer.belongsTo(Class, { as: 'toClass', foreignKey: 'toClassId' });

    // ClassSession -> Class, Module
    ClassSession.belongsTo(Class, { foreignKey: 'classId' });
    Class.hasMany(ClassSession, { foreignKey: 'classId', onDelete: 'CASCADE' });

    ClassSession.belongsTo(Module, { foreignKey: 'moduleId' });
    Module.hasMany(ClassSession, { foreignKey: 'moduleId' });
    // Enrollment -> Student, Class
    Enrollment.belongsTo(Student, { foreignKey: 'studentId' });
    Student.hasMany(Enrollment, { foreignKey: 'studentId' });

    Enrollment.belongsTo(Class, { foreignKey: 'classId' });
    Class.hasMany(Enrollment, { foreignKey: 'classId' });

    Enrollment.belongsTo(Course, { foreignKey: 'courseId' });
    Course.hasMany(Enrollment, { foreignKey: 'courseId' });

    // FinancialRecord -> Student, Class
    FinancialRecord.belongsTo(Student, { foreignKey: 'studentId' });
    Student.hasMany(FinancialRecord, { foreignKey: 'studentId' });

    FinancialRecord.belongsTo(Class, { foreignKey: 'classId' });
    Class.hasMany(FinancialRecord, { foreignKey: 'classId' });


    // FinancialRecord -> Enrollment, Student
    FinancialRecord.belongsTo(Enrollment, { foreignKey: 'enrollmentId' });
    Enrollment.hasMany(FinancialRecord, { foreignKey: 'enrollmentId' });

    FinancialRecord.belongsTo(Student, { foreignKey: 'studentId' });
    Student.hasMany(FinancialRecord, { foreignKey: 'studentId' });

    // CashRegister Associations
    CashRegister.belongsTo(User, { foreignKey: 'userId', as: 'operator' });
    User.hasMany(CashRegister, { foreignKey: 'userId' });

    CashRegister.hasMany(FinancialRecord, { foreignKey: 'cashRegisterId' });
    FinancialRecord.belongsTo(CashRegister, { foreignKey: 'cashRegisterId' });

    // Calendar & Tasks
    const UserAvailability = require('./UserAvailability');
    const CalendarBlock = require('./CalendarBlock');
    const Task = require('./Task');

    User.hasMany(UserAvailability, { foreignKey: 'userId' });
    UserAvailability.belongsTo(User, { foreignKey: 'userId' });

    User.hasMany(CalendarBlock, { foreignKey: 'userId' });
    CalendarBlock.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

    User.hasMany(Task, { foreignKey: 'userId' });
    Task.belongsTo(User, { foreignKey: 'userId' });

    Lead.hasMany(Task, { foreignKey: 'leadId', as: 'tasks', onDelete: 'CASCADE' });
    Task.belongsTo(Lead, { foreignKey: 'leadId' });

    Unit.hasOne(UnitConfig, { foreignKey: 'unitId' });
    UnitConfig.belongsTo(Unit, { foreignKey: 'unitId' });

    // Importado Import History
    Lead.hasMany(CadenceLog, { foreignKey: 'leadId', as: 'cadenceLogs' });
    CadenceLog.belongsTo(Lead, { foreignKey: 'leadId' });

    Lead.hasMany(ContactAttempt, { foreignKey: 'leadId', as: 'contactAttempts' });
    ContactAttempt.belongsTo(Lead, { foreignKey: 'leadId' });

    Lead.hasMany(Message, { foreignKey: 'leadId', as: 'messages' });
    Message.belongsTo(Lead, { foreignKey: 'leadId' });
}

module.exports = defineAssociations;

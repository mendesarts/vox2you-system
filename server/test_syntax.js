try {
    require('./routes/crm');
    console.log('Syntax OK');
} catch (e) {
    console.error('Syntax Error:', e.message);
    console.error(e.stack);
}

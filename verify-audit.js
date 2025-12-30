
const { getAuditLogs } = require('./web/app/actions/audit');

(async () => {
    console.log('Fetching audit logs...');
    try {
        const logs = await getAuditLogs({ limit: 5 });
        console.log('Logs found:', logs.length);
        if (logs.length > 0) {
            console.log('Sample Log:', JSON.stringify(logs[0], null, 2));
        } else {
            console.log('No logs found yet. Triggers might require an action first.');
        }
    } catch (err) {
        console.error('Error fetching logs:', err);
    }
})();

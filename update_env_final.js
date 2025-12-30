const fs = require('fs');

const url = 'https://pxfucuiqtktgwspvpffh.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4ZnVjdWlxdGt0Z3dzcHZwZmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjg4MzYsImV4cCI6MjA4MjY0NDgzNn0.gana8z6tVMvqXk7A_ejgGrnvYSvkA61Brzy7WMdwqeo';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4ZnVjdWlxdGt0Z3dzcHZwZmZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA2ODgzNiwiZXhwIjoyMDgyNjQ0ODM2fQ.s6SpVC6nAQMoi9bdL7g5Nwg7UdxGlnqkHQ5OcyJH6uU';
const targetPath = '.env.local';

try {
    const content = `NEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}\nSUPABASE_SERVICE_ROLE_KEY=${serviceKey}\n`;
    fs.writeFileSync(targetPath, content);
    console.log('SUCCESS: Updated .env.local with correct production keys.');
} catch (e) {
    console.error('ERROR:', e);
}

const fs = require('fs');

function read(file) {
    try {
        if (fs.existsSync(file)) {
            // Try reading as utf16le
            let content = fs.readFileSync(file, 'utf16le');
            console.log(`--- ${file} ---`);
            console.log(content.trim());
        }
    } catch (e) {
        console.log(`Error reading ${file}: ${e.message}`);
    }
}

read('status.json');
read('supabase_status.txt');

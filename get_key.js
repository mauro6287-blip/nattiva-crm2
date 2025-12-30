const { execSync } = require('child_process');
const fs = require('fs');

try {
    console.log('Fetching Supabase status...');
    const output = execSync('npx supabase status -o json', { encoding: 'utf-8' });
    console.log('Output received. Parsing...');
    const json = JSON.parse(output);

    if (json.SERVICE_ROLE_KEY) {
        fs.writeFileSync('service_key.txt', json.SERVICE_ROLE_KEY);
        console.log('SERVICE_ROLE_KEY saved to service_key.txt');
    } else {
        console.error('SERVICE_ROLE_KEY not found in output');
    }
} catch (error) {
    console.error('Error:', error.message);
}

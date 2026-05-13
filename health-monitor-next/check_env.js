const fs = require('fs');

if (fs.existsSync('.env.local')) {
    const content = fs.readFileSync('.env.local', 'utf8');
    const v = 'NEXT_PUBLIC_API_URL';
    const match = content.match(new RegExp(`^${v}=(.*)`, 'm'));
    if (match && match[1]) {
        const url = match[1].trim();
        console.log(`${v} value: ${url}`);
        const portMatch = url.match(/:(\d+)/);
        if (portMatch) {
            console.log(`Port: ${portMatch[1]}`);
        } else {
            console.log('No port found in URL');
        }
    } else {
        console.log(`${v} NOT SET`);
    }
} else {
    console.log('.env.local not found');
}

// A simple script to help debug application issues
console.log("Running debug-app.js");

// Add error listeners to check for unhandled errors
window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Check if CSS is loaded properly
const styleSheets = document.styleSheets;
console.log(`Loaded StyleSheets: ${styleSheets.length}`);
for (let i = 0; i < styleSheets.length; i++) {
    try {
        const sheet = styleSheets[i];
        console.log(`StyleSheet ${i}: ${sheet.href || 'inline'}`);
    } catch (err) {
        console.error(`Error accessing stylesheet ${i}:`, err);
    }
}

// Check DOM structure
console.log('DOM Structure:');
console.log(document.body.innerHTML);

// Check React mounting
console.log('React root:', document.getElementById('root'));

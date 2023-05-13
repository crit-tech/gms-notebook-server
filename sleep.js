const seconds = 20;
console.log(`Sleeping for ${seconds} seconds...`);
setTimeout(() => process.exit(0), seconds * 1000);

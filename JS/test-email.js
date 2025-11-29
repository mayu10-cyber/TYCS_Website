// Test script to verify email configuration
const nodemailer = require('nodemailer');
const config = require('./config');

console.log('Testing TYCS Email Configuration...');
console.log('=====================================');
console.log(`Host: ${config.EMAIL.HOST}`);
console.log(`Port: ${config.EMAIL.PORT}`);
console.log(`User: ${config.EMAIL.USER}`);
console.log(`TLS: ${config.EMAIL.USE_TLS}`);
console.log('=====================================');

// Create transporter
const transporter = nodemailer.createTransport({
    host: config.EMAIL.HOST,
    port: config.EMAIL.PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: config.EMAIL.USER,
        pass: config.EMAIL.PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Test connection
console.log('\nTesting SMTP connection...');
transporter.verify(function(error, success) {
    if (error) {
        console.log('❌ SMTP Connection Failed:', error.message);
        console.log('\nTroubleshooting tips:');
        console.log('1. Check if your email credentials are correct');
        console.log('2. Verify that port 587 is open on your server');
        console.log('3. Ensure your email provider allows SMTP access');
        console.log('4. Check if you need an app-specific password');
    } else {
        console.log('✅ SMTP Connection Successful!');
        console.log('Your email configuration is working correctly.');
        
        // Test sending a simple email
        console.log('\nTesting email sending...');
        const testMailOptions = {
            from: config.EMAIL.FROM,
            to: config.EMAIL.ADMIN,
            subject: 'Test Email from TYCS Server',
            text: 'This is a test email to verify your email configuration is working correctly.',
            html: `
                <h3>Test Email - TYCS Email Server</h3>
                <p>This is a test email to verify your email configuration is working correctly.</p>
                <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                <p><strong>Server:</strong> ${config.EMAIL.HOST}:${config.EMAIL.PORT}</p>
                <hr>
                <p><em>If you receive this email, your configuration is working!</em></p>
            `
        };

        transporter.sendMail(testMailOptions, (error, info) => {
            if (error) {
                console.log('❌ Test Email Failed:', error.message);
            } else {
                console.log('✅ Test Email Sent Successfully!');
                console.log('Message ID:', info.messageId);
                console.log('Response:', info.response);
            }
            process.exit(0);
        });
    }
});

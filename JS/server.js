const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const config = require('./config');

const app = express();
const PORT = config.PORT;

// Rate limiting for production
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: config.SECURITY.RATE_LIMIT_WINDOW,
    max: config.SECURITY.RATE_LIMIT_MAX,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});

app.use(limiter);

// CORS: allow configured origins and also allow requests without Origin (e.g., file://, curl)
const allowedOrigins = new Set(config.CORS.ORIGIN);
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            // Allow requests with no origin (mobile apps, curl, file://)
            return callback(null, true);
        }
        if (allowedOrigins.has(origin)) {
            return callback(null, true);
        }
        console.warn('CORS blocked origin:', origin);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: config.CORS.CREDENTIALS
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Basic request logging for debugging
app.use((req, res, next) => {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} from ${ip}`);
    } catch (_) {}
    next();
});

// Production email configuration
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

// Verify connection configuration
transporter.verify(function(error, success) {
    if (error) {
        console.log('SMTP Server Error:', error);
    } else {
        console.log('SMTP Server is ready to send emails');
    }
});

app.post('/send-email', async (req, res) => {
    try {
        let { name, email, contact, message } = req.body;

        // Trim inputs
        name = (name || '').trim();
        email = (email || '').trim();
        contact = (contact || '').trim();
        message = (message || '').trim();

        // Validate required fields (contact optional)
        if (!name || !email || !message) {
            console.warn('Validation failed for /send-email', { name, email, hasMessage: Boolean(message) });
            return res.status(400).json({ 
                success: false, 
                message: 'Name, Email and Message are required.' 
            });
        }

        const mailOptions = {
            from: config.EMAIL.FROM,
            to: config.EMAIL.ADMIN,
            subject: `New Query from ${name}`,
            html: `
                <h3>New Contact Form Submission</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Contact:</strong> ${contact}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
                <hr>
                <p><em>This email was sent from your company website contact form.</em></p>
            `,
            replyTo: email
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        
        res.status(200).json({ 
            success: true, 
            message: 'Query has been sent successfully!',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('Email sending error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send email. Please try again later.',
            error: config.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV,
        emailHost: config.EMAIL.HOST
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${config.NODE_ENV}`);
    console.log(`Email Host: ${config.EMAIL.HOST}`);
    console.log(`CORS Origins: ${config.CORS.ORIGIN.join(', ')}`);
});

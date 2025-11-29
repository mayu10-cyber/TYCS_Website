// Production Configuration
module.exports = {
    // Server Configuration
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'production',
    
    // Email Configuration
    EMAIL: {
        HOST: 'tycs.in',
        PORT: 587,
        USER: 'support@tycs.in',
        PASSWORD: 'Support@tycs',
        FROM: 'support@tycs.in',
        ADMIN: 'support@tycs.in', // Change this to your admin email if needed
        USE_TLS: true
    },
    
    // CORS Configuration
    CORS: {
        ORIGIN: [
            'https://tycs.in',
            'http://localhost:3000',
            'http://localhost:8080',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:8080'
        ], // Allowed origins for API access
        CREDENTIALS: true
    },
    
    // Security
    SECURITY: {
        RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
        RATE_LIMIT_MAX: 100 // max 100 requests per window
    }
};

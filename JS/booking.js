const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(bodyParser.json());

app.post('/book', async (req, res) => {
    const { name, email, phone, service, serviceType, address, date, time, details } = req.body;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'rohitganji173@gmail.com',
            pass: 'sigl wrcn tyvo arcu'
        }
    });

    const mailOptions = {
        from: email,
        to: 'rohitganjiapple2@gmail.com',
        subject: `New Service Booking from ${name}`,
        html: `
            <h3>New Booking Request</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Service:</strong> ${service}</p>
            <p><strong>Service Type:</strong> ${serviceType}</p>
            <p><strong>Address:</strong> ${address}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            <p><strong>Additional Notes:</strong> ${details}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (error) {
        console.error('Error sending email:', error);
        res.json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

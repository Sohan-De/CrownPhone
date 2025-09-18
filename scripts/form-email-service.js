// Form Email Service - Sends form submissions to admin email
class FormEmailService {
    constructor() {
        // EmailJS configuration for form submissions
        this.emailjsConfig = {
            serviceId: 'service_yiapkbp', // Your EmailJS service ID
            templateId: 'template_form_submission', // Your EmailJS template ID
            publicKey: '92lyoxOZzhE2q_51c' // Your EmailJS public key
        };
        
        // Admin email where form submissions will be sent
        this.adminEmail = 'sohanzerotwo@gmail.com';
        
        // Initialize EmailJS
        this.initializeEmailJS();
    }

    // Initialize EmailJS
    initializeEmailJS() {
        if (typeof emailjs !== 'undefined') {
            emailjs.init(this.emailjsConfig.publicKey);
            console.log('Form Email Service initialized successfully');
        } else {
            console.error('EmailJS not loaded for form submissions');
        }
    }

    // Send contact form submission
    async sendContactForm(formData) {
        try {
            console.log('📧 Sending contact form submission to admin');
            
            const templateParams = {
                to_email: this.adminEmail,
                to_name: 'Sohan',
                from_name: formData.name || 'Unknown',
                from_email: formData.email || 'No email provided',
                subject: `New Contact Form Submission - ${formData.name || 'Unknown'}`,
                message: formData.message || 'No message provided',
                phone: formData.phone || 'Not provided',
                company: formData.company || 'Not provided',
                form_type: 'Contact Form',
                submission_date: new Date().toLocaleString(),
                user_ip: await this.getUserIP(),
                user_agent: navigator.userAgent,
                page_url: window.location.href
            };

            console.log('📧 Sending contact form email with params:', templateParams);
            
            const response = await emailjs.send(
                this.emailjsConfig.serviceId,
                this.emailjsConfig.templateId,
                templateParams,
                this.emailjsConfig.publicKey
            );

            console.log('✅ Contact form email sent successfully:', response);
            return { success: true, response };
        } catch (error) {
            console.error('❌ Error sending contact form email:', error);
            return { success: false, error: error.message };
        }
    }

    // Send profile update notification
    async sendProfileUpdateNotification(formData, userId) {
        try {
            console.log('📧 Sending profile update notification to admin');
            
            const templateParams = {
                to_email: this.adminEmail,
                to_name: 'Sohan',
                from_name: formData.first_name + ' ' + formData.last_name || 'Unknown User',
                from_email: formData.email || 'No email provided',
                subject: `Profile Updated - ${formData.first_name} ${formData.last_name}`,
                user_id: userId || 'Unknown',
                first_name: formData.first_name || 'Not provided',
                last_name: formData.last_name || 'Not provided',
                email: formData.email || 'Not provided',
                form_type: 'Profile Update',
                submission_date: new Date().toLocaleString(),
                user_ip: await this.getUserIP(),
                user_agent: navigator.userAgent,
                page_url: window.location.href
            };

            console.log('📧 Sending profile update email with params:', templateParams);
            
            const response = await emailjs.send(
                this.emailjsConfig.serviceId,
                this.emailjsConfig.templateId,
                templateParams,
                this.emailjsConfig.publicKey
            );

            console.log('✅ Profile update email sent successfully:', response);
            return { success: true, response };
        } catch (error) {
            console.error('❌ Error sending profile update email:', error);
            return { success: false, error: error.message };
        }
    }

    // Send signup notification
    async sendSignupNotification(formData, userId) {
        try {
            console.log('📧 Sending new signup notification to admin');
            
            const templateParams = {
                to_email: this.adminEmail,
                to_name: 'Sohan',
                from_name: formData.first_name + ' ' + formData.last_name || 'New User',
                from_email: formData.email || 'No email provided',
                subject: `New User Signup - ${formData.first_name} ${formData.last_name}`,
                user_id: userId || 'Unknown',
                first_name: formData.first_name || 'Not provided',
                last_name: formData.last_name || 'Not provided',
                email: formData.email || 'Not provided',
                form_type: 'User Signup',
                submission_date: new Date().toLocaleString(),
                user_ip: await this.getUserIP(),
                user_agent: navigator.userAgent,
                page_url: window.location.href
            };

            console.log('📧 Sending signup notification email with params:', templateParams);
            
            const response = await emailjs.send(
                this.emailjsConfig.serviceId,
                this.emailjsConfig.templateId,
                templateParams,
                this.emailjsConfig.publicKey
            );

            console.log('✅ Signup notification email sent successfully:', response);
            return { success: true, response };
        } catch (error) {
            console.error('❌ Error sending signup notification email:', error);
            return { success: false, error: error.message };
        }
    }

    // Send general form submission
    async sendFormSubmission(formData, formType = 'General Form') {
        try {
            console.log(`📧 Sending ${formType} submission to admin`);
            
            const templateParams = {
                to_email: this.adminEmail,
                to_name: 'Sohan',
                from_name: formData.name || formData.first_name + ' ' + formData.last_name || 'Unknown',
                from_email: formData.email || 'No email provided',
                subject: `New ${formType} Submission - ${formData.name || formData.first_name + ' ' + formData.last_name || 'Unknown'}`,
                form_data: JSON.stringify(formData, null, 2),
                form_type: formType,
                submission_date: new Date().toLocaleString(),
                user_ip: await this.getUserIP(),
                user_agent: navigator.userAgent,
                page_url: window.location.href
            };

            console.log(`📧 Sending ${formType} email with params:`, templateParams);
            
            const response = await emailjs.send(
                this.emailjsConfig.serviceId,
                this.emailjsConfig.templateId,
                templateParams,
                this.emailjsConfig.publicKey
            );

            console.log(`✅ ${formType} email sent successfully:`, response);
            return { success: true, response };
        } catch (error) {
            console.error(`❌ Error sending ${formType} email:`, error);
            return { success: false, error: error.message };
        }
    }

    // Get user IP address (approximate)
    async getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip || 'Unknown';
        } catch (error) {
            console.log('Could not get user IP:', error);
            return 'Unknown';
        }
    }

    // Test email functionality
    async testEmailService() {
        try {
            console.log('🧪 Testing email service...');
            
            const testData = {
                name: 'Test User',
                email: 'test@example.com',
                message: 'This is a test email from the form service'
            };

            const result = await this.sendFormSubmission(testData, 'Test Form');
            
            if (result.success) {
                console.log('✅ Email service test successful');
                return true;
            } else {
                console.log('❌ Email service test failed:', result.error);
                return false;
            }
        } catch (error) {
            console.error('❌ Email service test error:', error);
            return false;
        }
    }
}

// Export the service
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormEmailService;
} else {
    window.FormEmailService = FormEmailService;
}

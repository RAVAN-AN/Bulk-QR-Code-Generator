# 🔄 Dynamic QR Code Service Setup Guide

This guide will help you set up the dynamic QR code service for your bulk QR generator.

## 📋 **Prerequisites**

- Web hosting with PHP support (7.4+)
- MySQL/MariaDB database
- Basic knowledge of file uploads and database configuration

## 🚀 **Quick Setup (5 steps)**

### **Step 1: Upload Files**
Upload these files to your web server:
```
dynamic_service/
├── config.php          # Database configuration
├── redirect.php         # Main redirect handler  
├── api.php             # Management API
├── manage.html         # Web management interface
├── database.sql        # Database structure
└── SETUP_GUIDE.md      # This file
```

### **Step 2: Create Database**
1. Create a new MySQL database (e.g., `qr_dynamic`)
2. Import the `database.sql` file:
   ```sql
   mysql -u username -p qr_dynamic < database.sql
   ```

### **Step 3: Configure Database Connection**
Edit `config.php` and update these settings:
```php
define('DB_HOST', 'localhost');        // Your database host
define('DB_NAME', 'qr_dynamic');       // Your database name  
define('DB_USER', 'your_username');    // Your database user
define('DB_PASS', 'your_password');    // Your database password
define('BASE_URL', 'https://yourservice.com'); // Your domain
```

### **Step 4: Set Up URL Rewriting** 
Create a `.htaccess` file in your dynamic_service folder:
```apache
RewriteEngine On
RewriteRule ^go/([A-Za-z0-9]{8})$ redirect.php?id=$1 [QSA,L]
```

### **Step 5: Test the Setup**
1. Visit `https://yourservice.com/manage.html`
2. Create a test QR redirect
3. Test that `https://yourservice.com/go/ABC12345` redirects properly

## 🔗 **Integrating with QR Generator**

1. Open your QR generator (`offline_qr_generator_v2.html`)
2. Go to **Step 3: Customize & Preview**
3. Select **🔄 Dynamic QR Codes**
4. Click **"Setup Service"** 
5. Enter your service URL: `https://yourservice.com`

## 📊 **URL Structure**

Your dynamic QR codes will use this format:
```
QR Code Content: https://yourservice.com/go/ABC12345
Redirects to: https://actual-destination.com
```

## 🛠 **Management Interface**

Access your management panel at:
`https://yourservice.com/manage.html`

**Features:**
- ✅ View all QR codes and their destinations
- ✅ Edit destination URLs without changing QR codes  
- ✅ Enable/disable QR codes
- ✅ Track scan statistics
- ✅ Search and filter QR codes

## 📈 **API Endpoints**

The service provides a REST API:

- `POST /api.php?action=create` - Create new redirect
- `PUT /api.php?action=update&id=ABC123` - Update redirect  
- `GET /api.php?action=get&id=ABC123` - Get redirect info
- `GET /api.php?action=list` - List all redirects

## 🔒 **Security Considerations**

1. **Database Security**: Use strong database credentials
2. **HTTPS**: Always use HTTPS in production
3. **Input Validation**: The API validates all URLs and IDs
4. **Rate Limiting**: Consider adding rate limiting for high-traffic sites

## 🐛 **Troubleshooting**

### **QR codes not redirecting:**
- Check `.htaccess` file is uploaded and working
- Verify database connection in `config.php`
- Check error logs for PHP errors

### **Management interface not loading:**
- Ensure all files are uploaded correctly
- Check database connection
- Verify CORS settings if accessing from different domain

### **API errors:**
- Check database permissions
- Verify JSON content-type in requests
- Check error logs for detailed messages

## 📞 **Support**

If you need help:
1. Check the error logs in your hosting control panel
2. Verify database connection with a simple PHP script
3. Test API endpoints with a tool like Postman

## 🎉 **You're Ready!**

Once setup is complete, you can:
- Generate dynamic QR codes that never need reprinting
- Change destinations anytime through the web interface
- Track scan statistics and analytics
- Manage hundreds of QR codes easily

**Happy QR coding!** 🚀
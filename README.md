# Bulk QR Code Generator

**A Bcreate Systems Project - Vibe Coded and Designed by ALOK**

A professional, feature-rich QR code generator that supports bulk generation, custom branding, and multiple logo positions.

## 🚀 Features

- **Bulk QR Code Generation**: Upload CSV/Excel files for batch processing
- **Custom Branding**: Add logos in multiple positions (center, top, bottom, left, right)
- **Dynamic Canvas Sizing**: Automatically adjusts to accommodate all content
- **Customizable Text**: Add text below QR codes with adjustable sizing
- **Error Correction Levels**: Support for L, M, Q, and H error correction
- **Live Preview**: Real-time preview of QR codes before generation
- **Offline Capable**: All libraries embedded, no internet required
- **Professional Output**: High-quality QR codes ready for printing

## 📁 Project Structure

```
bulk-qr-generator/
├── offline_qr_generator.html    # Main application file
├── B create-01.png             # Bcreate Systems logo
├── sample_data.csv             # Example CSV format
├── README.md                   # This file
└── LICENSE                     # MIT License
```

## 🎯 Usage

1. **Open** `offline_qr_generator.html` in any modern web browser
2. **Upload** your CSV/Excel file with data to encode
3. **Customize** QR code appearance, logos, and text
4. **Preview** your QR codes in real-time
5. **Generate** and download individual or bulk QR codes

## 📊 CSV Format

Your CSV file should contain the following columns:
- `data`: The content to encode in the QR code
- `text`: (Optional) Text to display below the QR code
- `filename`: (Optional) Custom filename for the generated QR code

Example:
```csv
data,text,filename
https://example.com,Visit Our Website,website_qr
Contact: +1-555-0123,Call Us,contact_qr
```

## ⚙️ Customization Options

- **QR Code Styles**: Square, rounded, dots, classy rounded
- **Colors**: Custom foreground and background colors
- **Logo Positions**: Center, top, bottom, left, right
- **Text Sizing**: Adjustable font size with dynamic canvas expansion
- **Error Correction**: Choose based on your logo size requirements

## 🔧 Error Correction Levels

- **Low (L)**: ~7% recovery - For clean environments
- **Medium (M)**: ~15% recovery - Recommended for most use cases
- **Quartile (Q)**: ~25% recovery - Good for moderate logo sizes
- **High (H)**: ~30% recovery - Best for large logos

## 🌟 Key Benefits

- ✅ **No Internet Required**: Fully offline capable
- ✅ **Professional Branding**: Perfect for business use
- ✅ **Dynamic Layouts**: Automatically adjusts for any content
- ✅ **High Quality Output**: Print-ready QR codes
- ✅ **Bulk Processing**: Generate hundreds of QR codes at once
- ✅ **Cross-Platform**: Works on any device with a web browser

## 🏢 About Bcreate Systems

This project is developed by **Bcreate Systems**, focusing on innovative digital solutions for businesses.

**Developer**: ALOK  
**Company**: Bcreate Systems  
**Type**: Professional QR Code Generation Tool

## 📜 License

MIT License - Feel free to use and distribute.

## 🤝 Support

For support or questions about this QR code generator, please contact Bcreate Systems.

---

**Made with ❤️ by ALOK at Bcreate Systems**

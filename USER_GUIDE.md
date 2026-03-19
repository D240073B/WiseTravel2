# 🌏 WiseTravel - User Guiders

## 📖 Table of Contents
1. [Quick Start](#-quick-start)
2. [Features Overview](#-features-overview)
3. [Detailed Feature Guide](#-detailed-feature-guide)
4. [Technical Architecture](#-technical-architecture)
5. [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### Starting the Application

#### **Option 1: Double-Click Method (Easiest)**
1. **Double-click** `START-SERVER.bat` in the `wisetravel2` folder
2. A terminal window will open showing the server status
3. Open your browser and go to: **`http://localhost:8000`**
4. **Important**: Keep the terminal window open while using the app!

#### **Option 2: PowerShell Command**
1. Open **PowerShell** or **Command Prompt**
2. Copy and paste this command:
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -eq "php"} | Stop-Process -Force ; cd c:\laragon\www\wisetravel2\api\public ; php -S localhost:8000 router.php
   ```
3. Press **Enter**
4. Open your browser and go to: **`http://localhost:8000`**

#### **First Time Login**
- **Email**: `yeong135@gmail.com`
- **Password**: `yourpassword`
- Or click **"Sign Up"** to create a new account

### Stopping the Server
- Press `Ctrl + C` in the terminal window
- Or simply close the terminal window

---

## ✨ Features Overview

WiseTravel is a comprehensive **Malaysia travel planning and expense management** application designed to help you:

| Feature | Description |
|---------|-------------|
| 🗺️ **My Malaysia Adventures** | Plan and track trips to destinations across Malaysia |
| 💰 **Travel Expenses** | Record and categorize all trip expenses |
| 📊 **Budget Overview** | Visualize spending with charts and analytics |
| 💸 **Cash Flow** | Track income vs expenses over time |
| 👥 **Group Travel** | Manage group trips and split expenses |
| 🌟 **Malaysia Travel Tips** | Get destination-specific travel advice |
| ⚙️ **Settings & Feedback** | Submit suggestions, questions, or report problems |

---

## 📋 Detailed Feature Guide

### 1️⃣ **Authentication System**

#### **Login**
- Enter your email and password
- Stay logged in automatically (until you logout)
- Secure session management

#### **Sign Up**
- Create new account with email
- Password validation (minimum 6 characters)
- Instant account activation

#### **Profile Management**
- Click your username → **Profile**
- Update email or password
- View account creation date

---

### 2️⃣ **My Malaysia Adventures** 🗺️

#### **Create a Trip**
1. Click **"+ Create New Trip"**
2. Fill in:
   - **Trip Name** (e.g., "Cameron Highlands Getaway")
   - **Destination** (Choose from 15 popular Malaysian destinations)
   - **Start Date** & **End Date**
   - **Budget** (optional)
3. Click **"Create Trip"**

#### **15 Malaysia Destinations Available**
- Kuala Lumpur, Penang, Malacca, Langkawi
- Cameron Highlands, Ipoh, Johor Bahru, Kota Kinabalu
- Kuching, Putrajaya, Pahang, Kedah, Perak, Sabah, Sarawak

#### **Trip Features**
- ✏️ Edit trip details
- 🗑️ Delete trips
- 💰 Add expenses directly to trip
- 👥 Add participants for group trips
- 📊 View trip budget vs actual spending
- 🗓️ See trip duration countdown

---

### 3️⃣ **Travel Expenses** 💰

#### **Add Expense**
1. Go to **Services** → **Travel Expenses**
2. Click **"+ Add Expense"**
3. Fill in:
   - **Expense Name** (e.g., "Hotel Stay")
   - **Category** (Accommodation, Food, Transport, etc.)
   - **Amount** (MYR)
   - **Date** (must be within trip dates)
   - **Currency** (MYR, USD, SGD, EUR, GBP, etc.)
   - **Who Paid** (for group trips)
4. Click **"Add Expense"**

#### **Expense Categories**
| Icon | Category | Examples |
|------|----------|----------|
| 🏨 | Accommodation | Hotels, Airbnb, Resorts |
| 🍔 | Food & Dining | Restaurants, Street Food |
| 🚗 | Transportation | Flights, Grab, Petrol |
| 🎭 | Entertainment | Theme Parks, Tours |
| 🛍️ | Shopping | Souvenirs, Clothes |
| ⚕️ | Healthcare | Medicine, Doctor |
| 📱 | Others | SIM Card, Miscellaneous |

#### **Expense Management**
- ✏️ Edit expense details
- 🗑️ Delete expenses
- 💱 View converted amounts (if using foreign currency)
- 📅 Filter by date range
- 🏷️ Filter by category
- 🔍 Search expenses by name

---

### 4️⃣ **Budget Overview** 📊

#### **Visual Analytics**
- **Pie Chart**: Spending by category
- **Bar Chart**: Monthly expense trends
- **Progress Bars**: Budget vs actual spending per trip

#### **Budget Insights**
- Total trip budget
- Amount spent so far
- Remaining budget
- Over-budget warnings (red alerts)
- Spending percentage indicators

#### **Export Features**
- 📄 **Download PDF Report**
  - Complete expense summary
  - Category breakdown
  - Trip details
  - Budget analysis

---

### 5️⃣ **Cash Flow** 💸

#### **Track Financial Flow**
- **Income vs Expenses** graph
- Monthly comparison
- Cumulative balance tracking
- Visual trend analysis

#### **Insights**
- Net cash flow (Income - Expenses)
- Monthly spending patterns
- Budget health indicators

---

### 6️⃣ **Group Travel** 👥

#### **Manage Trip Participants**
1. Select a trip
2. Click **"Manage Participants"**
3. Add participants:
   - **Existing Users**: Search by email
   - **Guest**: Add name and email

#### **Expense Splitting**
- Record who paid for each expense
- Track individual contributions
- See each participant's spending
- Calculate fair splits

#### **Participant Features**
- View all participants in a trip
- See participant roles (Owner/Member/Guest)
- Track who paid what
- Remove participants (Owner only)

---

### 7️⃣ **Malaysia Travel Tips** 🌟

#### **Destination-Specific Advice**
Get practical tips for each Malaysian destination:

- **Getting Around**: Transportation options
- **Local Food**: Must-try dishes
- **Attractions**: Popular tourist spots
- **Best Time to Visit**: Weather & seasons
- **Budget Tips**: Save money advice
- **Cultural Notes**: Local customs

#### **Featured Destinations**
- 🏙️ **Kuala Lumpur**: Petronas Towers, Street Food
- 🏝️ **Langkawi**: Beaches, Duty-Free Shopping
- 🌄 **Cameron Highlands**: Tea Plantations, Cool Weather
- 🏛️ **Penang**: Georgetown Heritage, Char Kway Teow
- And 11 more destinations!

---

### 8️⃣ **Settings & Feedback** ⚙️

#### **Submit Feedback**
1. Click your username → **Settings**
2. Choose feedback type:
   - 💡 **Suggestion**: Feature requests
   - ❓ **Question**: General inquiries
   - 🐛 **Problem**: Report bugs
3. Fill in:
   - **Subject**: Brief title
   - **Message**: Detailed description
4. Click **"Submit Feedback"**

#### **Feedback History**
- View all your past feedback
- See response status (Pending/In Progress/Resolved)
- Track submission dates
- Delete old feedback

#### **Why Submit Feedback?**
- Help improve the app
- Get support for issues
- Suggest new features
- Report bugs or problems

---

## 🎨 User Interface Features

### **Night Mode** 🌙
- Click the **☀️/🌙** toggle in navigation bar
- Switches between day and night themes
- Saves your preference automatically

### **Responsive Design** 📱
- Works on desktop, tablet, and mobile
- Mobile-friendly hamburger menu
- Touch-optimized controls

### **Navigation**
- **Home**: Landing page with overview
- **Services**: Dropdown menu with all features
- **About Us**: App information
- **Profile**: User settings
- **Settings**: Feedback system

---

## 🏗️ Technical Architecture

### Why We Built a Custom PHP MVC Framework

When starting this project, I faced a critical decision: should I use a full-featured framework like Laravel, or build something more tailored to our needs? After careful consideration, I chose to develop a custom MVC (Model-View-Controller) framework inspired by Laravel's elegant design patterns, but simplified for this specific application.

**Development Environment:**
- **Laragon**: Version 2025 v8.2.0 (Full stack local development environment)
- **PHP**: Version 8.3.16 (Latest stable release)
- **MySQL**: Integrated database server
- **Architecture**: Custom MVC framework (Laravel-inspired patterns)

The development environment choice was deliberate. Laragon provides everything needed without the hassle of configuring Apache, MySQL, and PHP separately. It's particularly convenient for Windows development, handling all the PATH variables and service management automatically.

## 🔧 Troubleshooting

### **Problem: Can't Access http://localhost:8000**

**Solution**:
1. Make sure the PHP server is running (terminal window open)
2. Check if port 8000 is already in use:
   ```powershell
   netstat -ano | findstr :8000
   ```
3. If port is busy, stop the process or use a different port:
   ```powershell
   php -S localhost:8001 router.php
   ```

---

### **Problem: "Route not found" Error**

**Solution**:
1. Make sure you're using the **router.php** file:
   ```powershell
   cd c:\laragon\www\wisetravel2\api\public
   php -S localhost:8000 router.php
   ```
2. **Don't use**: `php -S localhost:8000` (missing router.php)

---

### **Problem: Login Not Working**

**Solution**:
1. Clear browser cache: Press `Ctrl + Shift + Delete`
2. Hard refresh: Press `Ctrl + F5`
3. Check browser console for errors (F12 → Console tab)
4. Verify database connection in HeidiSQL

---

### **Problem: Expenses Not Showing**

**Solution**:
1. Make sure you've created a trip first
2. Expenses must belong to a trip
3. Check date validation (expense date must be within trip dates)
4. Refresh the page

---

### **Problem: Database Errors**

**Solution**:
1. Open HeidiSQL and check if database **"wisetravel2"** exists
2. Verify tables exist: `users`, `trips`, `expenses`, `feedback`, etc.
3. Check MySQL service is running in Laragon
4. Import `Query.sql` if tables are missing

---

### **Problem: Server Won't Start**

**Solution**:
1. Check if PHP is in your PATH:
   ```powershell
   php -v
   ```
2. If error, use full path to PHP:
   ```powershell
   C:\laragon\bin\php\php-8.3.16-Win32-vs16-x64\php.exe -S localhost:8000 router.php
   ```
3. Make sure you're in the correct directory: `c:\laragon\www\wisetravel2\api\public`

---

## 💡 Tips & Tricks

### **Quick Actions**
- **Ctrl + F5**: Hard refresh (clears cache)
- **F12**: Open browser developer tools
- **Ctrl + C**: Stop PHP server in terminal

### **Best Practices**
1. ✅ Always create a trip before adding expenses
2. ✅ Use correct expense dates (within trip duration)
3. ✅ Regularly export PDF reports for records
4. ✅ Add participants before splitting expenses
5. ✅ Submit feedback for bugs or suggestions

### **Data Safety**
- All data is stored in MySQL database
- No data is lost when you close the browser
- Database backups recommended (export from HeidiSQL)
- Use strong passwords for accounts

---

## 📞 Support

### **Need Help?**
1. Submit feedback via **Settings** page
2. Check browser console (F12) for error messages
3. Verify database in HeidiSQL
4. Restart PHP server if issues persist

### **Feature Requests**
- Use the **Settings** → **Suggestion** feedback form
- Describe the feature you'd like to see
- Explain how it would help your travel planning

---

## 🎯 Quick Reference Commands

### **Start Server (PowerShell)**
```powershell
Get-Process | Where-Object {$_.ProcessName -eq "php"} | Stop-Process -Force ; cd c:\laragon\www\wisetravel2\api\public ; php -S localhost:8000 router.php
```

### **Start Server (Simple)**
```powershell
cd c:\laragon\www\wisetravel2\api\public
php -S localhost:8000 router.php
```

### **Stop Server**
```powershell
Ctrl + C
```

### **Check PHP Version**
```powershell
php -v
```

### **Test Database Connection**
```powershell
# Open HeidiSQL and connect to wisetravel2 database
# Run: SELECT * FROM users LIMIT 1;
```

---

## 📝 Version Information

### Application Stack
- **Application**: WiseTravel v2.0
- **Framework**: Custom PHP MVC (Laravel-inspired architecture)
- **Laragon**: Version 2025 v8.2.0
- **PHP**: Version 8.3.16 (with OPcache enabled)
- **Database**: MySQL 8.0+ (wisetravel2)
- **Web Server**: PHP Built-in Development Server
- **Default Port**: 8000

### PHP Extensions Used
- PDO (MySQL driver)
- JSON
- Session
- MBString
- OpenSSL

### Design Patterns Inspired By
- **Laravel 10.x/11.x** routing conventions
- **PSR-4** autoloading standards
- **RESTful API** architecture
- **MVC** separation of concerns

---

## 🌟 Features Summary

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 1 | User Authentication | ✅ Active | Login, Signup, Session Management |
| 2 | Trip Management | ✅ Active | Create, Edit, Delete Malaysia trips |
| 3 | Expense Tracking | ✅ Active | Add, Edit, Delete expenses with categories |
| 4 | Budget Analytics | ✅ Active | Charts, graphs, spending insights |
| 5 | Cash Flow | ✅ Active | Income vs expenses tracking |
| 6 | Group Travel | ✅ Active | Multi-user trip participation |
| 7 | Travel Tips | ✅ Active | Malaysia destination guides |
| 8 | Feedback System | ✅ Active | Submit suggestions, questions, bugs |
| 9 | Night Mode | ✅ Active | Dark theme toggle |
| 10 | PDF Export | ✅ Active | Download expense reports |
| 11 | Multi-Currency | ✅ Active | Support for 10+ currencies |
| 12 | Expense Splitting | ✅ Active | Track who paid in group trips |

---

**Happy Traveling! 🌏✈️🎒**

*Made with ❤️ for Malaysian travelers*

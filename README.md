# 🍽️ Mealix — Smart Campus Food Management Platform

> A full-stack campus food-management platform built to make ordering, pickup, group ordering, and canteen operations faster and more convenient.

**Mealix** is a solo-built full-stack web application designed around a simple campus problem: students shouldn't have to spend their break standing in a canteen queue.

The platform provides a complete digital ordering experience for students while giving canteen administrators tools to manage orders, food availability, operations, and business insights from one place.

---

## ✨ What is Mealix?

Mealix brings the campus food-ordering experience into one platform.

Students can:

- Browse and search the food menu
- Filter food by category
- Add and manage items in their cart
- Apply coupons
- Redeem reward points
- Save favourite items
- Place orders
- Receive a pickup token
- Track order progress
- View previous orders
- Create and participate in group orders
- Check pickup status

Canteen administrators can:

- Monitor incoming orders
- Update order status
- Manage food availability
- Monitor kitchen activity
- View sales and order analytics
- Track menu performance

---

## 🚀 Key Features

### 👤 Customer Experience

- 🔐 User registration and login
- 🍔 Dynamic food menu
- 🔎 Food search
- 🏷️ Category-based filtering
- 🛒 Cart management
- ➕ Increase/decrease item quantities
- ❌ Remove individual items
- 🧹 Clear cart
- 🎟️ Coupon system
- ⭐ Rewards points
- ❤️ Favourite food items
- 📦 Order placement
- 🧾 Order history
- 🎫 Pickup token generation
- 📍 Order status tracking

### 👥 GroupBite

A group-ordering experience designed for students ordering together.

GroupBite allows users to participate in a shared ordering flow instead of managing multiple separate orders.

### 📋 PickupBoard

A dedicated pickup experience that helps users understand when their orders are ready and provides a clear pickup workflow.

### 🏪 Admin Dashboard

The administrative side of Mealix provides tools for day-to-day canteen operations.

Administrators can:

- View total orders
- Monitor pending, preparing, ready and completed orders
- Update order status
- Monitor completed revenue
- View kitchen workload
- Manage food availability
- Access operational information from one dashboard

### 📊 Admin Analytics

Mealix includes an analytics dashboard for understanding canteen performance.

It provides insights such as:

- Total items sold
- Food sales
- Average order value
- Peak ordering hour
- Most popular food item
- Top-performing category
- Daily revenue trends
- Daily order volume

Charts are rendered using **Recharts**.

---

## 🏆 Standout Features

### 1. 👥 GroupBite

A dedicated group-ordering workflow designed around the way students naturally order food together.

### 2. 📋 PickupBoard

A pickup-focused workflow that connects order status with the final canteen collection experience.

### 3. ⭐ Rewards + 🎟️ Coupons

Mealix combines a reward-points system with coupon functionality to make repeat ordering more engaging.

### 4. 📊 Canteen Analytics

The admin side goes beyond basic CRUD operations by providing sales, order-volume and menu-performance insights.

### 5. 🏪 Complete Customer + Admin Ecosystem

Mealix isn't only an ordering interface. It includes both sides of the workflow:

**Customer → Menu → Cart → Checkout → Order → Pickup**

and

**Admin → Orders → Kitchen Operations → Food Management → Analytics**

---

## 🖼️ Screenshots

### Homepage

![Mealix Homepage](screenshots/homepage.png)

### Menu

![Mealix Menu](screenshots/menu.png)

### Cart

![Mealix Cart](screenshots/cart.png)

### Order Confirmation

![Order Confirmation](screenshots/order-success.png)

### Admin Dashboard

![Admin Dashboard](screenshots/admin-dashboard.png)

### Admin Analytics

![Admin Analytics](screenshots/admin-analytics.png)

> Screenshots can be updated as the project evolves.

---

## 🛠️ Tech Stack

### Frontend

- **React.js**
- **Vite**
- **JavaScript**
- **React Router**
- **Context API**
- **Recharts**
- **CSS**

### Backend

- **Node.js**
- **Express.js**
- **REST APIs**
- **JWT authentication**
- **bcryptjs**
- **CORS**

### Database

- **MySQL**
- **mysql2**

### Development Tools

- **Git**
- **GitHub**
- **ESLint**
- **npm**

---

## 🏗️ Architecture

Mealix follows a client-server architecture:

```text
                    ┌─────────────────────┐
                    │      Mealix UI      │
                    │   React + Vite      │
                    └──────────┬──────────┘
                               │
                         REST API / JSON
                               │
                    ┌──────────▼──────────┐
                    │   Express Backend   │
                    │       Node.js       │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │       MySQL         │
                    │      Database       │
                    └─────────────────────┘
```

The frontend communicates with the Express backend through REST APIs, while MySQL stores users, food, orders and related application data.

---

## 🔐 Authentication & Security

Mealix includes authentication and protected access for customer and administrative functionality.

Implemented security-related functionality includes:

- Password hashing using **bcryptjs**
- JWT-based authentication
- Bearer-token authentication for protected API requests
- Protected customer routes
- Protected admin routes
- Admin authorization middleware
- Input validation and error handling
- CORS configuration
- Environment-based API configuration

Sensitive configuration such as local environment variables is intentionally excluded from the repository.

---

## 📁 Project Structure

```text
Mealix/
│
├── public/
│
├── src/
│   ├── components/
│   ├── contexts/
│   ├── pages/
│   ├── assets/
│   └── ...
│
├── server/
│   ├── middleware/
│   ├── ...
│   └── server.js
│
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

The frontend and backend are maintained in the same repository to keep the project easy to develop and run locally.

---

## ⚙️ Local Development

### Prerequisites

Make sure you have:

- Node.js
- npm
- MySQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/mostlyishu/Mealix.git
cd Mealix
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the database

Create a MySQL database named:

```sql
CREATE DATABASE mealix;
```

Mealix uses MySQL for application data including users, food, orders and order items.

Configure the database connection according to the database configuration used by the backend.

### 4. Configure environment variables

Create a local `.env` file for the frontend configuration.

Example:

```env
VITE_API_URL=http://localhost:5001
```

> Do not commit `.env` to GitHub. Keep environment-specific and sensitive configuration local.

### 5. Start the backend

From the project root:

```bash
node server/server.js
```

The backend runs on:

```text
http://localhost:5001
```

### 6. Start the frontend

In another terminal:

```bash
npm run dev
```

Vite will provide the local frontend URL shown in the terminal.

---

## 🧪 Development & Verification

Mealix has been tested during development across the major application flows, including:

- User registration and login
- Authentication handling
- Menu loading
- Food search and filtering
- Cart operations
- Coupon application
- Rewards selection
- Order placement
- Order history
- Admin order management
- Food availability management
- Admin analytics
- Responsive layouts
- Production build
- ESLint validation

The project is continuously being refined as new features and improvements are added.

---

## 📦 Production Build

To create a production build:

```bash
npm run build
```

To run the linter:

```bash
npm run lint
```

The production build and linting are used as part of the project's development verification process.

---

## 🌐 Project Status

**Current status:** Active development

- ✅ Core full-stack application implemented
- ✅ Customer ordering flow implemented
- ✅ Authentication implemented
- ✅ Admin operations implemented
- ✅ Analytics implemented
- ✅ Rewards and coupon functionality implemented
- ✅ Group ordering implemented
- ✅ Pickup workflow implemented
- 🚧 Public deployment pending

---

## 📚 Documentation

Detailed project documentation is maintained separately in Notion.

**[📖 View Mealix Documentation](https://mealix-documentation.notion.site/Mealix-Smart-Campus-Food-Management-Platform-406d3e5e055280a6815bd9a040f0787a)**

The documentation covers the project's features, frontend, backend APIs, authentication, database, architecture, setup, testing, development decisions and future roadmap.

---

## 🔮 Future Improvements

Planned improvements may include:

- Public production deployment
- Further performance optimization
- More advanced analytics
- Additional personalization features
- Improved real-time order updates
- Expanded campus-level functionality

---

## 👨‍💻 Author

### Ishu Pandey

BTech student and developer who built Mealix as a solo full-stack project.

**GitHub:** [@mostlyishu](https://github.com/mostlyishu)

**Project:** [Mealix](https://github.com/mostlyishu/Mealix)

---

## 📌 Project Links

| Resource | Link |
|---|---|
| 💻 Source Code | [GitHub Repository](https://github.com/mostlyishu/Mealix) |
| 📚 Documentation | [Mealix Documentation](https://mealix-documentation.notion.site/Mealix-Smart-Campus-Food-Management-Platform-406d3e5e055280a6815bd9a040f0787a?source=copy_link)

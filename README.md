# Coffee Shop Full-Stack App

React frontend + Node/Express backend + MySQL (XAMPP).

## Ports
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- MySQL (XAMPP): `localhost:3306`

## XAMPP Database Setup
1. Start `Apache` and `MySQL` in XAMPP control panel.
2. Open phpMyAdmin.
3. Use database name `coffee_db` (the backend creates it automatically).
4. Optional: import [`backend/db/schema.sql`](backend/db/schema.sql) if you want to create tables manually.

## Environment (backend/.env)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=coffee_db
PORT=5000
UPI_VPA=your-upi-id@bank
UPI_PAYEE_NAME=Coffee Shop
UPI_NOTE=Coffee order payment
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
```

## Run
1. Backend:
```bash
cd backend
npm install
npm run dev
```
2. Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Verify MySQL Persistence
1. Add a new product from the app UI.
2. In phpMyAdmin, refresh `coffee_db.products` and confirm the new row exists.
3. Place an order from cart and refresh `coffee_db.orders`.
4. Check backend health at `http://localhost:5000/api/health`:
   - `mode: "database"` means data is writing to MySQL.
   - `mode: "fallback"` means backend is not connected to MySQL.

## Razorpay Checkout
1. Add your Razorpay test/live keys in [`backend/.env`](backend/.env):
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
2. Restart backend after changing `.env`.
3. Click `Pay with Razorpay` in cart.
4. On successful payment, backend verifies Razorpay signature and then stores order in MySQL.

## UPI QR Technical-Issue Fix
- Set a real UPI ID in [`backend/.env`](backend/.env):
  - `UPI_VPA=yourname@okhdfcbank` (example format)
- Do not use placeholder IDs like `coffeeshop@upi`.
- Restart backend after updating `.env`.

# Forgot Password - Testing Guide

## 🎯 Implementation Summary

The forgot password flow has been successfully integrated into the Restaurant POS application.

### ✅ What's Been Implemented

1. **ForgotPassword Page** (`/forgot-password`)
   - Step 1: Email input to request OTP
   - Step 2: OTP verification and new password entry
   - Step 3: Success confirmation
   - Beautiful UI with gradient backgrounds
   - Real-time validation
   - Loading states and error handling

2. **Routing**
   - Added `/forgot-password` route in App.tsx
   - Redirects authenticated users to dashboard
   - Accessible from login page

3. **Login Page Integration**
   - Added "Forgot password?" link below password field
   - Smooth navigation to forgot password flow

4. **API Service** (`client/lib/authApi.ts`)
   - `requestPasswordReset(email)` - Send OTP
   - `verifyOTP(email, otp)` - Optional OTP verification
   - `resetPasswordWithOTP(email, otp, newPassword)` - Reset password

---

## 🧪 Testing Instructions

### Prerequisites
- Backend API running at `http://localhost:8000`
- SMTP configured (or check console/logs for OTP in development)
- Test user account exists in database

### Test Flow

#### 1. Access Forgot Password Page
```
URL: http://localhost:8080/forgot-password
or click "Forgot password?" on login page
```

#### 2. Test Cases

**Case 1: Successful Password Reset**
```
1. Enter valid email: admin@restaurant.com
2. Click "Send OTP"
3. Check email or backend logs for 6-digit OTP
4. Enter OTP: 123456 (example)
5. Enter new password: NewPassword123!
6. Confirm password: NewPassword123!
7. Click "Reset Password"
8. ✅ See success message
9. Click "Go to Login"
10. Login with new password
```

**Case 2: Invalid Email**
```
1. Enter non-existent email: fake@test.com
2. Click "Send OTP"
3. ✅ System returns success (security - doesn't reveal if email exists)
4. No OTP will be sent
```

**Case 3: Invalid OTP**
```
1. Enter valid email
2. Request OTP
3. Enter wrong OTP: 000000
4. Try to reset password
5. ❌ Error: "Invalid or expired OTP"
```

**Case 4: Password Mismatch**
```
1. Enter valid email
2. Request OTP
3. Enter correct OTP
4. Enter password: Password123
5. Confirm password: Different123
6. ❌ Error: "Passwords do not match"
```

**Case 5: Short Password**
```
1. Complete OTP step
2. Enter password: 12345 (less than 6 chars)
3. ❌ Error: "Password must be at least 6 characters long"
```

**Case 6: Expired OTP**
```
1. Request OTP
2. Wait 10+ minutes
3. Try to reset password with OTP
4. ❌ Error: "Invalid or expired OTP"
```

**Case 7: Resend OTP**
```
1. Request OTP
2. Click "Resend OTP" button
3. ✅ Returns to email input
4. Previous OTP is invalidated
5. New OTP can be requested
```

---

## 📱 UI Features

### Design Elements
- ✨ Gradient background (purple/pink)
- 🎨 Step-based wizard interface
- 📧 Email icon for step 1
- 🔒 Lock icon for step 2
- ✅ Success icon for step 3
- ⏱️ OTP expiration timer display
- 🔄 Loading states with spinners
- ⚠️ Error alerts with red styling
- ℹ️ Info alerts with blue styling

### Validation
- Email format validation
- OTP must be 6 digits
- Password minimum 6 characters
- Password confirmation match
- Real-time error display
- Input sanitization (OTP allows only numbers)

### User Experience
- Auto-format OTP input (large centered text)
- Keyboard support (Enter to submit)
- Disabled state during API calls
- "Back to Login" navigation
- "Resend OTP" option
- Success redirect to login
- Security notice footer

---

## 🔗 API Endpoints Used

### 1. Request OTP
```
POST http://localhost:8000/api/v1/auth/forgot-password
Body: { "email": "user@example.com" }
Response: { "status": "success", "data": { "email": "...", "expires_in": 600 } }
```

### 2. Verify OTP (Optional)
```
POST http://localhost:8000/api/v1/auth/verify-otp
Body: { "email": "user@example.com", "otp": "123456" }
Response: { "status": "success", "data": { "valid": true } }
```

### 3. Reset Password
```
POST http://localhost:8000/api/v1/auth/reset-password
Body: { 
  "email": "user@example.com",
  "otp": "123456",
  "new_password": "NewPassword123!"
}
Response: { "status": "success", "data": { "email": "..." } }
```

---

## 🐛 Debugging Tips

### Get OTP from Backend Logs (Development)
```bash
# Watch backend logs
tail -f backend.log

# Or check database directly
# SQL query:
SELECT otp, expires_at 
FROM password_reset_tokens 
WHERE email = 'admin@restaurant.com' 
  AND is_used = false 
  AND expires_at > NOW()
ORDER BY created_at DESC 
LIMIT 1;
```

### Browser Console
```javascript
// Check if API is reachable
fetch('http://localhost:8000/api/v1/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@test.com' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### Network Tab
- Check XHR requests
- Verify API responses
- Check response status codes
- Inspect payload data

---

## 📊 Expected Behavior

### Success Indicators
✅ Step progression (1 → 2 → 3)
✅ Email sent confirmation
✅ OTP validation success
✅ Password reset success message
✅ Redirect to login page
✅ Login with new password works

### Error Handling
❌ Network errors show user-friendly messages
❌ Invalid inputs prevented at UI level
❌ API errors displayed clearly
❌ Form disabled during processing
❌ No page crashes or console errors

---

## 🔐 Security Features Implemented

1. **No Email Enumeration**: Response doesn't reveal if email exists
2. **OTP Expiration**: 10-minute timeout
3. **Single-Use OTPs**: Can't reuse OTP
4. **Token Invalidation**: Old OTPs invalidated on new request
5. **HTTPS Ready**: Works with secure connections
6. **Input Sanitization**: XSS protection
7. **Password Strength**: Minimum requirements enforced

---

## 📝 Test Accounts

```javascript
const testAccounts = [
  { email: "admin@restaurant.com", role: "admin" },
  { email: "manager@restaurant.com", role: "manager" },
  { email: "cashier@restaurant.com", role: "cashier" },
  { email: "staff@restaurant.com", role: "staff" }
];
```

---

## ✨ Features Not Yet Implemented (Future Enhancements)

- [ ] Rate limiting UI feedback
- [ ] OTP countdown timer visual
- [ ] Remember device option
- [ ] SMS OTP alternative
- [ ] Multi-factor authentication
- [ ] Password strength indicator
- [ ] Biometric authentication option
- [ ] Social login recovery

---

## 📧 SMTP Configuration

### Development Mode
- OTPs printed to console/logs
- Check backend terminal output
- Or query database directly

### Production Mode
Configure in backend `.env`:
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SENDER_EMAIL=noreply@restaurant.com
SENDER_NAME=Restaurant POS
```

---

## 🎉 Quick Start Test

1. **Start Backend**:
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload
   ```

2. **Start Frontend**:
   ```bash
   cd pos-web-app-master
   npm run dev
   ```

3. **Open Browser**:
   ```
   http://localhost:8080/login
   ```

4. **Click "Forgot password?"**

5. **Enter test email**: `admin@restaurant.com`

6. **Get OTP from backend logs or database**

7. **Complete password reset**

8. **Login with new password**

✅ **Implementation Complete and Ready to Test!**

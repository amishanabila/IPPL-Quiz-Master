# Dokumentasi Flow Password Reset

## Alur Lengkap Password Reset

### 1. **Halaman Lupa Password (LupaPassword.jsx)**
   - User memasukkan email mereka
   - Klik tombol "Reset Password"
   - Frontend call: `authService.requestPasswordReset(email)`
   - Backend call: `POST /api/auth/reset-password-request`
   - Backend kirim email dengan reset token
   - Jika sukses → Popup "Email telah dikirim"
   - Setelah OK popup → Redirect ke `/password-baru`

### 2. **Halaman Password Baru (PasswordBaru.jsx)**
   - Component menerima token dari URL query params: `?token=xxx`
   - User memasukkan password baru dan konfirmasi password
   - Validasi password (8-12 karakter, huruf besar, kecil, angka, simbol)
   - Klik tombol "Simpan Password"
   - Frontend call: `authService.resetPassword(token, newPassword)`
   - Backend call: `POST /api/auth/reset-password`
   - Backend verify token dan update password
   - Jika sukses → Popup "Password berhasil diubah"
   - Setelah OK popup → Redirect ke `/login`

### 3. **Halaman Login (Login.jsx)**
   - User login dengan email dan password baru
   - Jika berhasil → Popup "Login berhasil"
   - Setelah OK popup → Redirect ke halaman awal

## Endpoint Backend

### POST /api/auth/reset-password-request
**Request:**
```json
{
  "email": "user@gmail.com"
}
```

**Response (Success):**
```json
{
  "status": "success",
  "message": "Email reset password telah dikirim"
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "Email tidak terdaftar"
}
```

### POST /api/auth/reset-password
**Request:**
```json
{
  "token": "jwt_token_dari_email",
  "newPassword": "NewPassword123!"
}
```

**Response (Success):**
```json
{
  "status": "success",
  "message": "Password berhasil direset"
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "Token tidak valid atau kadaluarsa"
}
```

## Cara Testing di Postman

### 1. Request Reset Password
```
Method: POST
URL: http://localhost:5000/api/auth/reset-password-request
Headers:
  Content-Type: application/json
Body:
{
  "email": "johndoe@gmail.com"
}
```

### 2. Ambil Token dari Email
Setelah email dikirim, copy token dari URL di email
Contoh link email: `http://localhost:5173/password-baru?token=eyJhbGc...`

### 3. Reset Password dengan Token
```
Method: POST
URL: http://localhost:5000/api/auth/reset-password
Headers:
  Content-Type: application/json
Body:
{
  "token": "eyJhbGc...",
  "newPassword": "NewPassword123!"
}
```

## Requirement Database

Pastikan tabel `users` memiliki kolom:
- `id` (PRIMARY KEY)
- `nama` (VARCHAR)
- `email` (VARCHAR, UNIQUE)
- `password` (VARCHAR)
- `reset_token` (VARCHAR, nullable)

## Requirement Environment Variables (.env)

```
PORT=5000
JWT_SECRET=your_secret_key
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=quiz_master
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

## Error Handling

### Kasus yang Ditangani:

1. **Email tidak terdaftar**
   - Response: "Email tidak terdaftar"
   - Status: 404

2. **Token expired (lebih dari 1 jam)**
   - Response: "Token telah kadaluarsa, silakan minta reset password lagi"
   - Status: 400

3. **Token tidak valid**
   - Response: "Token tidak valid atau kadaluarsa"
   - Status: 400

4. **Password tidak sesuai format**
   - Frontend validation: 8-12 karakter, huruf besar, kecil, angka, simbol

5. **Email service error**
   - Response: "Terjadi kesalahan saat memproses permintaan reset password"
   - Status: 500

## Security Notes

- Token JWT expires dalam 1 jam
- Password di-hash menggunakan bcrypt
- Token di-clear dari database setelah password di-reset
- Email verification menggunakan nodemailer dengan Gmail App Password
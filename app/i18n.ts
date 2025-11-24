// src/i18n.ts
import i18n from 'i18next'
import { initReactI18next, Translation } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'vi',
    resources: {
      vi: { translation: { checking_auth: 'Đang xác thực...' } },
      en: { translation: { checking_auth: 'Checking auth...' } },
    },
  })
// src/i18n.ts
i18n.init({
  resources: {
    vi: {
      translation: {
        // Forbidden
        "forbidden.title": "Truy cập bị từ chối",
        "forbidden.message": "Bạn không có quyền truy cập trang này. Vui lòng kiểm tra vai trò của bạn hoặc liên hệ quản trị viên.",
        "forbidden.home": "Về trang chủ",
        "forbidden.login": "Đăng nhập lại",
        "forbidden.hint": "Mã lỗi: FORBIDDEN_403",

        // Not Found
        "notfound.title": "Oops! Trang không tồn tại",
        "notfound.message": "Có vẻ như bạn đã đi lạc vào một suất chiếu không có thật. Hãy quay lại rạp chính nhé!",
        "notfound.home": "Về trang chủ",
        "notfound.back": "Quay lại",
        "notfound.tip": "Mẹo: Kiểm tra URL hoặc dùng thanh tìm kiếm để tìm phim yêu thích!",
      },
    },
    en: {
      translation: {
        "forbidden.title": "Access Denied",
        "forbidden.message": "You don't have permission to access this page. Please check your role or contact admin.",
        "forbidden.home": "Back to Home",
        "forbidden.login": "Login Again",
        "forbidden.hint": "Error: FORBIDDEN_403",

        "notfound.title": "Oops! Page Not Found",
        "notfound.message": "Looks like you've wandered into a non-existent showtime. Let's get back to the main theater!",
        "notfound.home": "Back to Home",
        "notfound.back": "Go Back",
        "notfound.tip": "Tip: Check the URL or use search to find your favorite movie!",
      },
    },
  },
})
i18n.init({
  resources: {
    vi: {
      translation: {
        // Login
        "login.title": "Đăng nhập",
        "login.subtitle": "Nhập email và mật khẩu để tiếp tục",
        "login.password": "Mật khẩu",
        "login.loading": "Đang đăng nhập...",
        "login.submit": "Đăng nhập",
        "login.forgot": "Quên mật khẩu?",
        "login.reset": "Khôi phục",
        "login.no_account": "Chưa có tài khoản?",
        "login.register": "Đăng ký",
        "login.error": "Đăng nhập thất bại. Vui lòng thử lại.",

        // Register
        "register.title": "Đăng ký tài khoản",
        "register.subtitle": "Tạo tài khoản để đặt vé nhanh chóng",
        "register.name": "Họ tên",
        "register.phone": "Số điện thoại",
        "register.password": "Mật khẩu",
        "register.confirm": "Xác nhận mật khẩu",
        "register.loading": "Đang tạo tài khoản...",
        "register.submit": "Đăng ký",
        "register.login": "Đã có tài khoản?",
        "register.login_link": "Đăng nhập",
        "register.error": "Đăng ký thất bại. Vui lòng thử lại.",
      },
    },
    en: {
      translation: {
        "login.title": "Login",
        "login.subtitle": "Enter email and password to continue",
        "login.password": "Password",
        "login.loading": "Login...",
        "login.submit": "Login",
        "login.forgot": "Forgot password?",
        "login.reset": "Restore",
        "login.no_account": "No account yet?",
        "login.register": "Register",
        "login.error": "Login failed. Please try again.",

        "register.title": "Register an account",
        "register.subtitle": "Create an account to book tickets quickly",
        "register.name": "Full name",
        "register.phone": "Phone number",
        "register.password": "Password",
        "register.confirm": "Confirm password",
        "register.loading": "Creating an account...",
        "register.submit": "Register",
        "register.login": "Already have an account?",
        "register.login_link": "Log in",
        "register.error": "Registration failed. Please try again.",
      }
    }
  },
})
export default i18n
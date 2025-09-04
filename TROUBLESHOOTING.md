# Frontend Troubleshooting Guide

## ✅ **Issues Fixed**

### 1. **H1-check Error (Object.keys undefined)**

- **Fixed**: Added proper HTML attributes and improved component structure
- **Status**: ✅ Resolved

### 2. **Missing grid.svg File**

- **Fixed**: Replaced with inline SVG data URL
- **Status**: ✅ Resolved

### 3. **Smooth Scroll Warning**

- **Fixed**: Added `data-scroll-behavior="smooth"` to HTML element
- **Status**: ✅ Resolved

## 🔧 **CORS Error Fix Required**

### Problem

```
Access to XMLHttpRequest at 'http://localhost:8080/api/v1/auth/register' from origin 'http://localhost:3000' has been blocked by CORS policy
```

### Frontend Solution (Temporary)

I've configured Next.js to proxy API calls to avoid CORS issues during development.

### Backend Solution (Required)

You need to update your Spring Boot CORS configuration:

#### **Option 1: Update CorsConfig.java**

```java
@Configuration
@EnableWebMvc
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000", "http://127.0.0.1:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

#### **Option 2: Application Properties**

Add to your `application.properties`:

```properties
# CORS Configuration
cors.allowed-origins=http://localhost:3000,http://127.0.0.1:3000
cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS,PATCH
cors.allowed-headers=*
cors.allow-credentials=true
```

#### **Option 3: Quick Fix - Add to SecurityConfig**

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
    configuration.setAllowedMethods(Arrays.asList("*"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", configuration);
    return source;
}
```

## 🔄 **Testing Steps**

1. **Start Backend**: Ensure Spring Boot is running on `http://localhost:8080`
2. **Apply CORS Fix**: Add one of the CORS solutions above
3. **Restart Backend**: Stop and start your Spring Boot application
4. **Test Frontend**: Try registration at `http://localhost:3000/auth/register`

## 🌐 **Environment Setup**

### Required Files

1. **Create `.env.local`** in frontend-devices folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
```

### Backend Requirements

- Spring Boot running on port 8080
- CORS configured for localhost:3000
- Database running (MySQL)

## 🧪 **Test API Connection**

### Quick Test

1. **Health Check**: Visit `http://localhost:8080/actuator/health`
2. **API Docs**: Visit `http://localhost:8080/v3/api-docs`
3. **Frontend Health**: Visit `http://localhost:3000`

### API Test Steps

1. Go to `http://localhost:3000/auth/register`
2. Fill out the registration form
3. Submit - should connect to backend
4. Check browser console for any remaining errors

## 🐛 **Common Issues**

### "Network Error" when submitting forms

- **Cause**: Backend not running or CORS not configured
- **Fix**: Start backend and configure CORS

### "Cannot convert undefined or null to object"

- **Cause**: Fixed - was component structure issue
- **Status**: ✅ Resolved

### Missing grid.svg 404 errors

- **Cause**: Referenced file didn't exist
- **Fix**: ✅ Replaced with inline SVG

## 🚀 **Success Indicators**

✅ No console errors about h1-check  
✅ No 404 errors for grid.svg  
✅ No smooth scroll warnings  
⏳ Registration form submits successfully (needs backend CORS)  
⏳ Login form works (needs backend CORS)  
⏳ Dashboard loads user data (needs backend CORS)

## 📞 **Next Steps**

1. **Fix Backend CORS** - Apply one of the CORS solutions above
2. **Test Complete Auth Flow** - Registration → Login → Dashboard
3. **Configure Google OAuth** - Update client ID in `.env.local`
4. **Test Phone OTP** - When SMS service is configured
5. **Test Password Reset** - When email service is configured

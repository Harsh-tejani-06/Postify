## 🚀 Features

### 👤 User Authentication & Profile
- Secure user authentication using **JWT (stored in cookies)**
- User registration and login system
- Secure logout functionality
- Individual user profile pages
- Upload and update **profile picture**
- Default avatar fallback if no image is uploaded
- Profile picture visible across profile, posts, and friend lists

---

### 📝 Post Management
- Create new posts
- Edit own posts
- **Delete own posts**
- View posts created by other users
- Posts are permanently linked to the author
- Nested population to fetch user details with posts

---

### ❤️ Like System
- Like / Unlike posts
- Real-time like count display
- View list of users who liked a post
- Click on liked users to view their profile
- Prevent duplicate likes by the same user

---

### 🤝 Friend System
- Discover new users via **Find Friends**
- Send friend requests
- Cancel sent friend requests
- Accept friend requests
- Maintain a **friends list**
- Prevent duplicate friend requests
- Bidirectional friendship (both users updated)
- Remove friends

---

### 🔒 Privacy Controls
- Toggle **Public / Private Account**
- Private accounts hide posts from non-friends
- Visual lock indicator (🔒) for private profiles
- Only friends can view private profiles’ posts

---

### 🖼️ Profile Picture Management
- Upload profile picture using **Multer**
- Stored securely on server
- Displayed across:
  - Profile page
  - Posts
  - Likes list
  - Friend list
- Default profile image fallback

---

### ⚙️ Security & Backend Features
- Password hashing using **bcrypt**
- JWT verification middleware for protected routes
- MongoDB with Mongoose schemas & relationships
- Clean error handling for invalid routes and actions
- Authorization checks for edit/delete operations

---

### 🛠️ Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT, bcrypt
- **Templating:** EJS
- **File Uploads:** Multer
- **Frontend:** HTML, CSS (Dark Theme UI)

---

### 📌 Project Highlights
- Fully functional social media–style mini platform
- Real-world concepts: authentication, authorization, relationships
- Clean MVC-style backend logic
- Scalable schema design for future enhancements

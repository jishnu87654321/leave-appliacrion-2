require("dotenv").config({ path: "./.env" });
const axios = require("axios");

async function testLogin() {
  console.log("🔐 Testing Login API...\n");

  try {
    const response = await axios.post("http://localhost:5000/api/auth/login", {
      email: "hradmin@gmail.com",
      password: "admin123",
    });

    console.log("✅ Login Successful!");
    console.log("\nResponse:");
    console.log("Success:", response.data.success);
    console.log("Token:", response.data.token?.substring(0, 30) + "...");
    console.log("\nUser Data:");
    console.log("Name:", response.data.data.user.name);
    console.log("Email:", response.data.data.user.email);
    console.log("Role:", response.data.data.user.role);
    console.log("Active:", response.data.data.user.isActive);
  } catch (error) {
    console.error("❌ Login Failed!");
    
    if (error.response) {
      console.error("\nStatus:", error.response.status);
      console.error("Message:", error.response.data.message || error.response.data);
      console.error("\nFull Response:", JSON.stringify(error.response.data, null, 2));
    } else if (error.code === "ECONNREFUSED") {
      console.error("\n⚠️ Cannot connect to backend server!");
      console.error("Make sure the backend is running:");
      console.error("  cd backend");
      console.error("  npm start");
    } else {
      console.error("\nError:", error.message);
    }
  }
}

testLogin();

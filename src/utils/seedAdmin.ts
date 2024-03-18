import mongoose from "mongoose";
import { connect } from "mongoose";
import "dotenv/config";
import User from "../models/user";

connect(process.env.MONGOOSE_CONNECTION_STRING as string);

// Seed admin user
async function seedAdminUser() {
  try {
    const existingAdmin = await User.findOne({ isAdmin: true });
    if (existingAdmin) {
      console.log("Admin user already exists.");
      return;
    }

    const adminData = {
      name: "admin",
      password: "adminpassword",
      email: "admin@gmail.com",
      isAdmin: true,
    };

    const admin = new User(adminData);
    await admin.save();
    console.log("Admin user seeded successfully.");
  } catch (error) {
    console.error("Error seeding admin user:", error);
  } finally {
    mongoose.disconnect();
  }
}

seedAdminUser();

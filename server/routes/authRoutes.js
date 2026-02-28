const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Validation helper functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  if (!password || password.length < 8) return false;
  return /(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(password);
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const createDemoAuthResponse = async (provider) => {
  const normalizedProvider = String(provider || "demo").toLowerCase();

  const providerConfig = {
    google: {
      name: "Google Demo User",
      email: "demo.google@speaksense.ai",
      jobTitle: "google user",
      authProvider: "google"
    },
    github: {
      name: "GitHub Demo User",
      email: "demo.github@speaksense.ai",
      jobTitle: "github user",
      authProvider: "github"
    },
    demo: {
      name: "Demo User",
      email: "demo.user@speaksense.ai",
      jobTitle: "guest user",
      authProvider: "demo"
    }
  };

  const selected = providerConfig[normalizedProvider] || providerConfig.demo;
  let user = await User.findOne({ email: selected.email });

  if (!user) {
    const generatedPassword = `${selected.authProvider}Demo@1234`;
    const hashed = await bcrypt.hash(generatedPassword, 10);

    user = await User.create({
      name: selected.name,
      email: selected.email,
      password: hashed,
      company: "Demo",
      jobTitle: selected.jobTitle,
      industry: "Software Development",
      authProvider: selected.authProvider
    });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return {
    message: `${selected.authProvider} demo login successful`,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      industry: user.industry,
      experience: user.experience,
      company: user.company,
      jobTitle: user.jobTitle
    }
  };
};

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, company, jobTitle, experience, industry, interests, newsletter } = req.body;
    const normalizedName = String(name || "").trim();
    const normalizedEmail = normalizeEmail(email);

    // Validation
    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (!validateEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters with uppercase, lowercase, number & special character"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashed,
      phone: phone || '',
      company: company || '',
      jobTitle: jobTitle || '',
      experience: experience || '',
      industry: industry || '',
      interests: interests || [],
      newsletter: newsletter || false,
      authProvider: 'local'
    });

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Return success without exposing password
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        industry: user.industry,
        experience: user.experience,
        company: user.company,
        jobTitle: user.jobTitle
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Validation
    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!validateEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare passwords
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        industry: user.industry,
        experience: user.experience,
        company: user.company,
        jobTitle: user.jobTitle
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

router.post("/social", async (req, res) => {
  try {
    const { provider, mode } = req.body;
    const normalizedProvider = String(provider || "").toLowerCase();

    if (!["google", "github"].includes(normalizedProvider)) {
      return res.status(400).json({ message: "Unsupported social provider" });
    }

    if (mode !== "demo") {
      return res.status(400).json({
        message: "Social OAuth is not configured yet. Use demo mode for now."
      });
    }

    const payload = await createDemoAuthResponse(normalizedProvider);
    return res.status(200).json(payload);
  } catch (error) {
    console.error("Social auth error:", error);
    return res.status(500).json({ message: "Server error during social login" });
  }
});

router.post("/demo", async (_req, res) => {
  try {
    const payload = await createDemoAuthResponse("demo");
    return res.status(200).json(payload);
  } catch (error) {
    console.error("Demo auth error:", error);
    return res.status(500).json({ message: "Server error during demo login" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        industry: user.industry || "",
        experience: user.experience || "",
        company: user.company || "",
        jobTitle: user.jobTitle || "",
        interests: user.interests || [],
        authProvider: user.authProvider || "local"
      }
    });
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
});

module.exports = router;
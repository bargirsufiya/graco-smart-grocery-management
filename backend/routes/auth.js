const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const auth = require("../middleware/auth");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const makeToken = (user) =>
  jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: "7d" });

// her dashboard uses user.id and user.name, so we send "id"
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email });

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    res.status(201).json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name, sub, email_verified } = ticket.getPayload();
    if (!email_verified) {
      return res.status(401).json({ message: "Google email not verified" });
    }
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({ name, email, googleId: sub });
    } else if (!user.googleId) {
      user.googleId = sub;
      await user.save();
    }
    res.json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(401).json({ message: "Google login failed" });
  }
});

// Step 1 of reset: user enters email, we send a link
router.post("/forgot-password", async (req, res) => {
  const genericMessage =
    "If an account exists for that email, a reset link has been sent.";

  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");

      // only the hash is stored in the database
      user.resetPasswordToken = hashToken(token);
      user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
      await user.save();

      const link = `${process.env.FRONTEND_URL}/?resetToken=${token}`;

      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your Graco password",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;">
              <h2 style="color:#047857;">Reset your Graco password</h2>
              <p>Hi there,</p>
              <p>We received a request to reset your password. Click the button below to choose a new one. This link expires in 15 minutes.</p>
              <p style="margin:24px 0;">
                <a href="${link}" style="background:#059669;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">Reset Password</a>
              </p>
              <p style="color:#6b7280;font-size:13px;">If you did not request this, you can ignore this email. Your password will not change.</p>
            </div>
          `,
        });
      } catch (mailError) {
        console.log("Email error:", mailError.message);
      }
    }

    // same answer whether or not the email exists, so nobody can check who has an account
    res.json({ message: genericMessage });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Step 2 of reset: user submits the new password with the token from the link
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password updated. You can now sign in." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Profile management (needs a logged-in user)
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      user: {
        ...publicUser(user),
        hasPassword: Boolean(user.password),
        googleLinked: Boolean(user.googleId),
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/profile", auth, async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    const user = await User.findByIdAndUpdate(req.user.id, { name }, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // new token so the updated name shows up in share notifications
    res.json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Google-only accounts have no password yet, so they can set one directly
    if (user.password) {
      const match = await bcrypt.compare(currentPassword || "", user.password);
      if (!match) {
        // 400, not 401: the session is valid, only the typed password is wrong
        return res.status(400).json({ message: "Current password is incorrect" });
      }
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
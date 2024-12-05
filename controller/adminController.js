const { redirect } = require("express/lib/response");
const models = require("../models/adminModels");
const user = require("../models/userModels");
const { log, error } = require("console");
const { use } = require("../router/adminRouter");
const res = require("express/lib/response");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const nocache = require("nocache");

const path = require("path");
const Sharp = require("sharp");

const getLogin = (req, res) => {
  if (req.session.admin) {
    return res.redirect("/admin/index");
  }
  // console.log("aadmin ethi");

  res.render("admin/login", { message: "", title: "Login page" });
};

const postLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const adminExist = await models.Admin.findOne({ email: email });
    if (!adminExist) {
      return res.render("admin/login", {
        message: "Invalid Email",
        title: "Login page",
      });
    }
    // const adminVerify = await bcrypt.compare(password,adminExist.password)
    const adminVerify = await bcrypt.compare(password, adminExist.password);
    // console.log("post kazhinj");

    if (adminVerify) {
      req.session.Admin = true;
      res.status(200).redirect("/admin/index");
    } else {
      return res.render("admin/login", {
        message: "Invalid password",
        title: "Login page",
      });
    }
  } catch (error) {
    res.status(500).send("Internal server error");
  }
};

const getIndex = (req, res) => {
  nocache();
  console.log("user" + req.session.userId);

  res.redirect("/admin/dashboard");
};

const getUserList = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  try {
    const skip = (page - 1) * limit;
    // const items = await user.User.find().skip(skip).limit(limit);
    const total = await user.User.countDocuments();
    console.log(total);

    const userData = await user.User.find().skip(skip).limit(limit);

    res.render("admin/userList", {
      userData: userData,
      currentPage: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.log(err);
  }
};

const blockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const isBlock = await user.User.findOne({ _id: userId });

    console.log(isBlock.isBlocked);

    if (isBlock.isBlocked === true) {
      await user.User.updateOne(
        { _id: userId },
        { $set: { isBlocked: false } }
      );
      // console.log(isBlocked);
      console.log("UNBLOCKED");
      res.redirect("/admin/userList");
    } else {
      await user.User.updateOne({ _id: userId }, { $set: { isBlocked: true } });
      // console.log(isBlocked);
      console.log("BLOCKED");
      res.redirect("/admin/userList");
    }
  } catch (error) {
    res.status(500).send("Internal server error");
  }
};

module.exports = {
  getLogin,
  postLogin,
  getIndex,
  getUserList,
  blockUser,
};

const express = require("express");
const { check, validationResult} = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");
const router = express.Router();
const auth = require("../middleware/authenticationJWT");
const User = require("../model/User");

/**
 * @method - POST
 * @param - /signup
 * @description - User SignUp
 */
//localhost:4000/newuser/signup
router.post(
    "/signup",
    [
        check("username", "Please Enter a Valid Username")
        .not()
        .isEmpty(),
        check("email", "Please enter a valid email").isEmail(),
        check("password", "Please enter a valid password").isLength({
            min: 6
        })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        const {
            username,
            password,
            birthDate,
            gender,
            email,
        } = req.body;
        try {
            let user = await User.findOne({
                email
            });
            if (user) {
                return res.status(400).json({
                    msg: "User Already Exists"
                });
            }

            user = new User({
                username,
                email,
                password,
                gender,
                birthDate
            });

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            await user.save();

            const payload = {
                user: {
                    id: user._id
                }
            };

            jwt.sign(
                payload,
                "randomString", {
                    expiresIn: 10000
                },
                (err, token) => {
                    if (err) throw err;
                    res.status(200).json({
                        token
                    });
                }
            );
        } catch (err) {
            console.log(err.message);
            res.status(500).send("Error in Saving");
        }
    }
);

router.post(
    "/signin",
    [
      check("email", "Please enter a valid email").isEmail(),
      check("password", "Please enter a valid password").isLength({
        min: 6
      })
    ],
    async (req, res) => {
      console.log(req.body);
      const errors = validationResult(req);
  
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array()
        });
      }
  
      const { email, password } = req.body;
      try {
        let user = await User.findOne({
          email
        });
        if (!user)
          return res.status(400).json({
            message: "User Not Exist"
          });
  
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
          return res.status(400).json({
            message: "Incorrect Password !"
          });
  
        const payload = {
          user: {
            id: user._id
          }
        };
  
        jwt.sign(
          payload,
          "randomString",
          {
            expiresIn: 3600
          },
          async (err, token) => {
            if (err) throw err;
            /* res.status(200).json({
              token
            }); */
            console.log(token);

            req.session.token_id = token;
            res.redirect('self');
          }
        );
      } catch (e) {
        console.error(e);
        res.status(500).json({
          message: "Server Error"
        });
      }
    }
  );

  /**
 * @method - GET
 * @description - Get LoggedIn User
 * @param - /newuser/self
 */


router.get("/self", auth, async (req, res) => {
    try {
      // request.user is getting fetched from Middleware after token authentication
      const userObj = await User.findById(req.user.id);
      //res.json(user);
      //console.log(user);
      req.session.loggedIn = true;
      res.render('index', {loggedIn: req.session.loggedIn, user: userObj, errors: req.session.errors});
      req.session.errors = null;
    } catch (e) {
      res.send({ message: "Error in Fetching user" });
    }
  });

router.get("/signin", (req, res) => {
  res.render("signin");
});

router.get("/signup", (req, res) => {
  res.render("signup");
});

module.exports = router;
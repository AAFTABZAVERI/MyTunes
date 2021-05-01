const express = require("express");
const { check, validationResult} = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
var SpotifyWebApi = require('spotify-web-api-node');
const hbs = require('hbs');
//const fetch = require("node-fetch");
const router = express.Router();
const auth = require("../middleware/authenticationJWT");
const User = require("../model/User");
const spotify = require('./spotifyEndPoints')


//handlebars helper function for equality comparison

hbs.registerHelper('ifeq', function (a, b, options) {
  if (a == b) { return options.fn(this); }
  return options.inverse(this);
});

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
            email
        } = req.body;

        console.log(req.body);
      

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
      //console.log(req.body);
      const errors = validationResult(req);
      req
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
        /* if (!user)
          return res.status(400).json({
            message: "User Not Exist"
          });
  
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
          return res.status(400).json({
            message: "Incorrect Password !"
          }); */
        
        const isMatch = await bcrypt.compare(password, user.password);
        if(!user || !isMatch)
        {
          res.redirect('signin', {message: "User doesnot exist or incorrect password"});
        }
        else
        {
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
              //console.log(token);
  
              req.session.token_id = token;
              res.redirect('/newuser');
            }
          );
        }
        
      } catch (e) {
        console.error(e);
        res.status(500).json({
          message: "Server Error"
        });
      }
    }
  );


  router.post(
    "/viewprofile",
    [
      check("email", "Please enter a valid email").isEmail()
    ],
    async (req, res) => {
      //console.log(req.body);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array()
        });
      }
  
      const { username, email, gender, birthDate } = req.body;
      try {
        let user = await User.updateOne(
          { _id: req.session.user._id },
          {
            $set: {
              username: username,
              email: email,
              gender: gender,
              birthDate: birthDate
            }
          });
         res.redirect('viewprofile');
      } catch (e) {
        console.error(e);
        res.status(500).json({
          message: "User not found"
        });
      }
    }
  );

  router.get("/viewprofile", (req, res) => {
    res.render("viewprofile", {user: req.session.user});
  });

  /**
 * @method - GET
 * @description - Get LoggedIn User
 * @param - /newuser/self
 */


router.get("/", auth, async (req, res) => {
    try {
      // request.user is getting fetched from Middleware after token authentication
      const userObj = await User.findById(req.user.id);
      //res.json(user);
      
      req.session.loggedIn = true;
      req.session.user = userObj;

      //console.log('The access token is ' + spotifyApi.getAccessToken());
      var spotifyApiUser = new SpotifyWebApi({
        accessToken: spotify.spotifyApi.getAccessToken()
      });

      spotifyApiUser.getNewReleases({ limit : 10, offset: 0, country: 'US' })
      .then(function(data){
          var newr = data.body.albums.items;
          res.render('index',{
              newr: newr,
              user: req.session.user
        });
      });
  
      //req.session.errors = null;
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

router.get("/viewprofile", (req, res) => {
  res.render("viewprofile");
});

module.exports = router;
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
const Playlist = require("../model/Playlist");
const Songs = require("../model/Songs");
const { update } = require("../model/Playlist");
const { ObjectID } = require("bson");
const userApp = express();
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
        req.session.errors = [];
        if (!errors.isEmpty()) {
            req.session.errors = errors.array();
            res.redirect("signup");
        }
        else
        {
          const {
            username,
            password,
            birthDate,
            gender,
            email
            } = req.body;
      

          try {
              let existingUserByEmail = await User.findOne({
                  email
              });

              let existingUserByName = await User.findOne({
                username
              });

              if (existingUserByEmail || existingUserByName) {
                  req.session.errors.push({"value": "Duplicate", "msg": "User with the same username or email Already exists.."});
                  res.redirect("signup");
              }
              else
              {
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
                        req.session.success = "You have been signed up successfully. Please login to continue..";
                        res.redirect("signin");
                    }
                );
              }
              
          } catch (err) {
              console.log(err.message);
              req.session.errors.push({"value": "Database", "msg": "Error in Saving user data"});
              res.redirect("signup");
          }
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
    
      const errors = validationResult(req);
      let errorlist = [];
      if (!errors.isEmpty()) {
        errorlist = errors.array();
        res.render("signin", {errors: errorlist});
      }
      else
      {
        const { email, password } = req.body;
        try {
          let user = await User.findOne({
            email
          });
          let isMatch;
          if(user)
            isMatch = await bcrypt.compare(password, user.password);
          
          if(!user || !isMatch)
          {
            errorlist.push({"value": "mismatch", "msg": "User does not exist or incorrect password"});
            res.render("signin", {errors: errorlist});
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
    
                req.session.token_id = token;
                res.redirect('/newuser');
              }
            );
          }
          
        } catch (e) {
          console.error(e);
          errorlist.push({"value": "server", "msg": "Server Error"});
          res.render("signin", {errors: errorlist});
        }
    }
  });

  router.get("/", auth, async (req, res) => {
    try {
      // request.user is getting fetched from Middleware after token authentication
      const userObj = await User.findById(req.user.id);
      //res.json(user);
      
      req.session.loggedIn = true;
      req.session.user = userObj;
      req.session.userUpdated = false;

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

/* router.all() methoda to catch all routes for checking whether 
   the user is logged in or not at first except for "/signin" and "/signup" */
  
  router.all("*", (req, res, next) => {
    if(req.url === "/signin" || req.url === "/signup")
    {
      next();
    }
    else
    {
      if(!req.session.user)
        res.redirect("signin");
      next();
    }
  });
  
  router.get("/viewprofile", async (req, res) => {

    if(req.session.userUpdated)
    {
      let userUpd = await User.findById(req.session.user._id);
      req.session.user = userUpd;
    }
    res.render("viewprofile", {user: req.session.user});
  });

  router.post(
    "/addplaylist",
    async(req,res) => {
        req.session.errors = [];
        const {name} = req.body;
              try{
                  let existingPlaylist = await Playlist.findOne({name: name});

                  if(existingPlaylist)
                  {
                    req.session.errors.push({"value": "Duplicate", "msg": "Playlist with the same name already exists. Please try a new one!"});
                    res.redirect("addplaylist");
                  }
                  else
                  {
                    let playlist = new Playlist({
                      name
                    });
  
                    await playlist.save();
                    
                    let user = await User.updateOne(
                      { _id: req.session.user._id },
                      {
                        $push: {
                          playlist:{
                              id : playlist._id,
                              name:playlist.name
                          }
                        }
                      }
                    );
                    req.session.newPlaylist = true;
                    res.redirect('library');
                  }
              }catch (err) {
                console.log(err.message);
                res.status(500).send("Error in Saving playlist");
            }
    }
);


  /**
 * @method - GET
 * @description - Get LoggedIn User
 * @param - /newuser/self
 */


router.get("/signin", (req, res) => {
  res.render("signin", {authError: req.session.autherror, successMsg: req.session.success});
  req.session.autherror = null;
  req.session.success = null;
});

router.get("/signup", (req, res) => {
  res.render("signup", {errors: req.session.errors});
  req.session.errors = null;
});

router.get("/logout", (req, res) => {
  // req.session.token_id = null;
  // req.session.loggedIn = null;
  // req.session.user = null;
  // req.session.userUpdated = null;

  req.session.destroy();

  res.redirect("/");
}
);

router.get("/library", async (req, res) => {
  if(req.session.user)
  {
    try
    {
      if(req.session.newPlaylist)
      {
        req.session.user = await User.findById(req.session.user._id);
        req.session.newPlaylist = false;
      }
      res.render("viewplaylist", {
        user: req.session.user
      });
    }
    catch(err)
    {
      console.log(err.message);
    }
  }
  else{
    res.redirect("signin");
  }
});

router.get("/library/:pid", async (req, res) => {
  //playlist name 
  let pid = req.params.pid;
  
  let plist = await Playlist.findOne({
    _id: pid
  });
  let songdetails = [];
  if(!plist)
  {
    return res.status(400).json({
      message: "Playlist does Not Exist"
    });
  }
  else{
    //playlist.songsid
    if(plist.songsid)
    {
      plist.songsid.forEach(async (sid) => {
        let song = await Songs.findOne(
          {
            _id: sid
          }
        );

        if(song)
        {  
            songdetails.push({id:song._id , songName: song.name, songUrl: song.previewurl});
        }
        else{
          return res.status(400).json({
            message: "There is no matching song"
          });
        }
      });
    }
    else
    {
      return res.status(400).json({
        message: "No songs in the playlist"
      });
    }
    
  }
  res.render("viewplaylisttrack", {
    user: req.session.user,
    songdetails: songdetails,
    plist: plist
  });
});

//delete tracks from users playlist
router.post("/library/:pid/delete", async(req,res) => {
  let plid = req.params.pid;
  const {SongId} = req.body;

  await Playlist.updateOne(
    { _id: plid },
    { 
      $pull:{
          songsid : SongId
      }

    }
  );

   res.redirect("/newuser/library/"+plid);
});

router.get("/addplaylist",(req,res) => {
  if(req.session.user)
  {
    res.render("addplaylist",{
      user: req.session.user,
      errors: req.session.errors
     });
     req.session.errors = null;
  }
  else{
    res.redirect("signin");
  }
});

//delete account


router.route("/delete")
.delete( async (req,res)=>{

  let udelete = await User.findByIdAndRemove(
    {_id: req.session.user._id}
    );

  if(udelete){
    res.json({
      success: true, 
      message: 'Your account has been deleted successfully'});

  }
  else{
    res.json({
      success: false, 
      message: 'Server encountered error while deleting your account. Pleasy try after some time'});
  }
});

router.route("/viewprofile")
    .put(
      [
        check("email", "Please enter a valid email").isEmail()
      ],
      async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            errors: errors.array()
          });
        }

        const { username, email, gender, birthDate } = req.body;
        try {
          await User.updateOne(
            { _id: req.session.user._id },
            {
              $set: {
                username: username,
                email: email,
                gender: gender,
                birthDate: birthDate
              }
            });
          req.session.userUpdated=true;
          res.json({
              status: "ok",
              message: "User details successfully updated"
            });
        } 
        catch (e) 
        {
          console.error(e);
          res.json({
            status: "notok",
            message: "Error occured while fetching the user details. Please try after some time"
          });
        }
      }
    );

module.exports = router;
const express = require("express");
const { check, validationResult} = require("express-validator");
const hbs = require('hbs');
const router = express.Router();
const Playlist = require("../model/Playlist");
const Songs = require("../model/Songs");


// router.post(
//     "/addplaylist",
//     async(req,res) => {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//           return res.status(400).json({
//             errors: errors.array()
//           });
//         }
       
//         const  {name} = req.body;
//               try{
//                   Playlist = new Playlist({
//                     name
//                   });

//                   await Playlist.save();
//               }catch (err) {
//                 console.log(err.message);
//                 res.status(500).send("Error in Saving playlist");
//             }
//     }
// )
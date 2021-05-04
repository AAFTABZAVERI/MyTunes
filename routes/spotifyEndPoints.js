const express = require('express');
const app = express();
var router = express.Router();
var SpotifyWebApi = require('spotify-web-api-node');
const hbs = require('hbs');

hbs.registerHelper('each_upto', function(ary, max, options) {
  if(!ary || ary.length == 0)
      return options.inverse(this);

  var result = [ ];
  for(var i = 0; i < max && i < ary.length; ++i)
      result.push(options.fn(ary[i]));
  return result.join('');
});

var spotifyApi = new SpotifyWebApi({
    clientId: '10108018aed74ed4aaf69a1e83cd5adb',
    clientSecret: '8f9cac2afdef49ed9ad0dd37f7598446'
});

spotifyApi.clientCredentialsGrant().then(
    function (data) {
        console.log('The access token is ' + data.body.access_token);
        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body.access_token);

        exports.spotifyApi = spotifyApi;
        console.log(module.exports);
    },
    function (err) {
        console.log(
            'Something went wrong when retrieving an access token',
            err.message
        );
    }
);

router.get('/',function(req,res){
  spotifyApi.getNewReleases({ limit : 10, offset: 0, country: 'US' })
  .then(function(data){
      var newr = data.body.albums.items;
      res.render('index',{
          newr: newr
  });
  });
});

router.get('/albumtrack/:alid',function(req,res){
    spotifyApi.getAlbumTracks(req.params.alid)
    .then(function(data) {
      var resultOne = data.body.items;
      res.render('albumtrack', {
        resultOne: resultOne,
        user: req.session.user
      });
    }, function(err) {
      console.log('Something went wrong!', err);
    });
});

router.get('/search',function(req,res){
  if(req.query.searchby === "playlist"){
      //start
      spotifyApi.searchPlaylists(req.query.artist)
      .then(function(data) {
            var ar = data.body.playlists.items;
            res.render('playlists',{
                ar: ar,
                user: req.session.user
            });
      }, function(err) {
        console.log('Something went wrong!', err);
      });
      //end
  }else if(req.query.searchby === "artist"){
      //start
      spotifyApi.searchArtists(req.query.artist)
      .then(function(data) {
              var ar = data.body.artists.items;
                res.render('artists',{
                    ar: ar,
                    user: req.session.user
                });
      }, function(err) {
        console.log('Something went wrong!', err);
      });
      //end
  }
  else{
        spotifyApi.searchTracks(req.query.artist)
        .then(function(data){
        var ar = data.body.tracks.items;
          res.render('stracks',{
            ar: ar,
            user: req.session.user
          });
        },function(err){
            console.error(err);
        });
  }
});

router.get('/playlisttrack/:plid',function(req,res){
  spotifyApi.getPlaylistTracks(req.params.plid)    
.then(function(data) {
  var resultOne = data.body.items;
    res.render('playlisttrack', {
      resultOne: resultOne,
      user: req.session.user
    });
},function(err) {
  console.log('Something went wrong!', err);
});
});

router.get('/artistalbum/:arid',function(req,res){
  spotifyApi.getArtistAlbums(req.params.arid)    
  .then(function(data) {
      var alb = data.body.items;
      res.render('artistalbum', {
         alb: alb,
         user: req.session.user
      });
    }, function(err) {
      console.log('Something went wrong!', err);
    });
});

module.exports.spotifyRoutes = router;

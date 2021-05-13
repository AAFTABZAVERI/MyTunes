const jwt = require("jsonwebtoken");

module.exports = function(req, res, next) {
  //console.log(req.headers);
  const token = req.session.token_id;
  if (!token) 
  {
    req.session.autherror = "Authorization Error. Please login ..";
    req.session.save();
    res.redirect("signin");
    //return res.status(401).json({ message: "Auth Error" });
  }
  else{
    try {
      const decoded = jwt.verify(token, "randomString");
      req.user = decoded.user; 
      next();
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: "Invalid Token" });
    }
  }
};
const passport = require("passport")
const GoogleStrtegy = require("passport-google-oauth20").Strategy
// const User = require("../model/userModel/userSchema")
const User = require('../models/userModels');

const env = require("dotenv").config()



console.log("hai ethi");
passport.use(new GoogleStrtegy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:"http://localhost:3006/auth/google/callback"
},


async (accessToken, refreshToken, profile, done) => {
    
    try {
        let user = await User.User.findOne({ googleId: profile.id });
        console.log(user);
        
        if (user) {
            return done(null, user);
        } else {
            user = new User.User({
                name: profile.displayName,  // Correct the typo here
                email: profile.emails[0].value,
                googleId: profile.id,
            });
            await user.save();
            return done(null, user);
        }
    } catch (error) {
        console.error("error",error);
        
        return done(error, null);
    }
}));

// Serialize and deserialize user for session handling
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.User.findById(id)
    .then(user => {
        done(null, user);
    })
    .catch(err => {
        done(err, null);
    });
});

module.exports = { passport };
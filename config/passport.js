const passport = require("passport")
const GoogleStrtegy = require("passport-google-oauth20").Strategy
// const User = require("../model/userModel/userSchema")
const User = require('../models/userModels');

const env = require("dotenv").config()


passport.use(new GoogleStrtegy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://zoroscomicstore.ayushpj.in.net/auth/google/callback"
},


    async (accessToken, refreshToken, profile, done) => {

        try {
            const email = profile.emails[0].value
            console.log(email);

            let user = await User.User.findOne({ googleId: profile.id });
            let isExist = await User.User.findOne({ email: email })

            if (isExist) {
                return done(null, isExist);
            }

            console.log(user);

            if (user) {
                return done(null, user);
            } else {
                user = new User.User({
                    fullName: profile.displayName,  // Correct the typo here
                    email: profile.emails[0].value,
                    googleId: profile.id,
                });
                await user.save();
                return done(null, user);
            }
        } catch (error) {
            console.error("error", error);

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
    const dotenv = require('dotenv');
    dotenv.config();

    const passport = require('passport');
    const github = require('passport-github2');
    const LocalStrategy = require('passport-local').Strategy;
    const User = require('../dao/db/models/userModel');
    const bcrypt = require('bcrypt');
    const config = require('./config')

    const initPassport = () => {  
        passport.use("githubAuth", new github.Strategy(
            {
                clientID: config.githubClientId,
                clientSecret: config.githubClientSecret,
                callbackURL: `http://${config.host}:${config.port}/api/sessions/callbackGithub`,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {               
                    let { name, email } = profile._json;
                    let user = await User.findOne({ email });
                    if (!user) {
                        user = await User.create({
                            name: name, email, github: profile
                        });
                    }
                    return done(null, user);
                } catch (error) {
                    return done(error);
                }
            }
        ));

        passport.use("local", new LocalStrategy(
            {
                usernameField: 'email', 
                passwordField: 'password', 
                passReqToCallback: true, 
            },
            async (req, email, password, done) => {
                try {
                    const { first_name, last_name, age } = req.body;

                    const role = email === 'adminCoder@coder.com' ? 'admin' : 'user';

                    const newUser = new User({
                        first_name,
                        last_name,
                        email,
                        age,
                        password,
                        role,
                    });

                    await newUser.save();
                    req.session.user = newUser;

                    return done(null, newUser);
                } catch (error) {
                    return done(error);
                }
            }
        ));

        passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});
    };

    module.exports = { initPassport };

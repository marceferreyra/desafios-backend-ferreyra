const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: function () {
            return !this.github; // Requerido solo si no viene de GitHub
        }
    },
    last_name: {
        type: String,
        required: function () {
            return !this.github; // Requerido solo si no viene de GitHub
        }
    },
    email: {
        type: String,
        required: true, // Siempre requerido
        unique: true,
    },
    age: {
        type: Number,
        required: function () {
            return !this.github; 
        }
    },
    password: {
        type: String,
        required: function () {
            return !this.github;
        }
    },
    role: {
        type: String,
        default: 'user'
    },
    cartId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart'
    }
}, {
    timestamps: true,
    strict: false
});

userSchema.pre('save', async function (next) {
    try {
        if (!this.isModified('password')) {
            return next();
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(this.password, salt);
        this.password = hashedPassword;
        next();
    } catch (error) {
        next(error);
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;

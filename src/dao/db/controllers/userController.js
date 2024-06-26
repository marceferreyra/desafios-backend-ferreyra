const mongoose = require('mongoose');
const User = require('../models/userModel');
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    auth: {
        user: "marceeferreyra@gmail.com",
        pass: "qxdjqqquughitrbp",
    },
    tls: {
        rejectUnauthorized: false
    }
});

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('name first_name last_name email role');
        res.status(200).json(users);
    } catch (error) {
        console.error('Error al obtener todos los usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.deleteInactiveUsers = async (req, res) => {
    try {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const inactiveUsers = await User.find({ last_connection: { $lt: twoDaysAgo } });
        console.log('Usuarios inactivos:', inactiveUsers);

        if (inactiveUsers.length === 0) {
            console.log('No hay usuarios inactivos para eliminar');
            return res.status(200).json({ message: 'No hay usuarios inactivos para eliminar.' });
        }

        const deleteResults = await User.deleteMany({ last_connection: { $lt: twoDaysAgo } });
        console.log('Delete results:', deleteResults);

        const emailPromises = inactiveUsers.map(user => {
            const mailOptions = {
                from: 'Coder Test <marceeferreyra@gmail>',
                to: user.email,
                subject: 'Cuenta eliminada por inactividad',
                text: 'Hola, tu cuenta ha sido eliminada por inactividad.',
                html: '<div><h1>Hola, tu cuenta ha sido eliminada por inactividad.</h1></div>',
            };
            return transporter.sendMail(mailOptions);
        });

        await Promise.all(emailPromises);
        console.log('deleteInactiveUsers: Emails sent');

        res.status(200).json({ message: 'Usuarios inactivos eliminados y notificados exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar usuarios inactivos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.getUserRole = async (req, res) => {
    try {
        const userId = req.params.uid;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'El ID de usuario no es válido' });
        }

        const user = await User.findById(userId).lean();

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.status(200).json({ role: user.role });
    } catch (error) {
        console.error('Error al obtener el rol del usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.togglePremium = async (req, res) => {
    try {
        const userId = req.params.uid;
        const newRole = req.body.role;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (newRole === 'premium' && user.role !== 'premium') {
            const requiredDocuments = ['Identificación', 'Comprobante de domicilio', 'Comprobante de estado de cuenta'];
            const userDocuments = user.documents.filter(doc => doc.status === 'completado').map(doc => doc.name);

            const allDocumentsPresent = requiredDocuments.every(doc => userDocuments.includes(doc));

            if (!allDocumentsPresent) {
                return res.status(400).json({ error: 'El usuario no ha terminado de procesar su documentación' });
            }
        }

        user.role = newRole;

        await user.save();

        res.status(200).json({ message: 'Rol de usuario actualizado exitosamente', role: newRole });
    } catch (error) {
        console.error('Error al cambiar el rol del usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};



exports.uploadDocuments = async (req, res) => {
    try {
        const userId = req.params.uid;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'El ID de usuario no es válido' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (req.files['profile']) {
            const profile = req.files['profile'][0];
            user.documents.push({ name: 'profile', reference: profile.path, status: 'completado' });
        }
        
        if (req.files['product']) {
            const product = req.files['product'][0];
            user.documents.push({ name: 'product', reference: product.path, status: 'completado' });
        }

        if (req.files['identificacion']) {
            const identificacion = req.files['identificacion'][0];
            user.documents.push({ name: 'Identificación', reference: identificacion.path, status: 'completado' });
        }
        
        if (req.files['comprobante_domicilio']) {
            const comprobanteDomicilio = req.files['comprobante_domicilio'][0];
            user.documents.push({ name: 'Comprobante de domicilio', reference: comprobanteDomicilio.path, status: 'completado' });
        }
        
        if (req.files['comprobante_estado_cuenta']) {
            const comprobanteEstadoCuenta = req.files['comprobante_estado_cuenta'][0];
            user.documents.push({ name: 'Comprobante de estado de cuenta', reference: comprobanteEstadoCuenta.path, status: 'completado' });
        }

        await user.save();
        res.status(200).json({ message: 'Documentos subidos exitosamente' });
    } catch (error) {
        console.error('Error al subir documentos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};









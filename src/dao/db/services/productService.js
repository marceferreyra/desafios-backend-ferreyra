const Product = require('../models/productModel');
const User = require('../models/userModel')
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


class ProductService {
    constructor() {}

    async getProducts(req) {
        try {
            const { limit = 10, page = 1, category, status, owner, sort } = req.query;
            const filters = {};

            if (category) filters.category = category;
            if (status) filters.status = status === 'true'; 
            if (owner) filters.owner = owner;

            const options = {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
            };

            if (sort) {
                options.sort = { price: sort === 'asc' ? 1 : -1 };
            }

            const products = await Product.paginate(filters, options);
            return products;
        } catch (error) {
            req.logger.error('Error al obtener los productos:', error);
            throw error;
        }
    }

    async getProductById(id, req) {
        try {
            req.logger.info(`Buscando producto con ID ${id}`);
            const product = await Product.findById(id);
            if (product) {
                req.logger.info(`Producto encontrado con ID ${id}`);
                return product;
            } else {
                req.logger.warning(`No se encontró ningún producto con el ID ${id}`);
                return null;
            }
        } catch (error) {
            req.logger.error('Error al buscar el producto:', error);
            throw error;
        }
    }

    async addProduct(title, description, price, thumbnails, code, stock, status, category, owner, req) {
        try {
            if (!owner) {
                const adminUser = await User.findOne({ role: 'admin' });
                owner = adminUser ? adminUser._id : null;
            }
    
            const newProduct = await Product.create({
                title,
                description,
                price,
                code,
                stock,
                thumbnails,
                status: true,
                category,
                owner
            });
    
            req.logger.info(`Producto ${title} agregado correctamente.`);
            return { message: `Producto ${title} agregado correctamente.`, product: newProduct };
        } catch (error) {
            req.logger.error('Error al agregar el producto:', error);
            throw error;
        }
    }
    

    async deleteProduct(id, req) {
        try {
            const removedProduct = await Product.findByIdAndDelete(id);

            if (removedProduct) {
                req.logger.info(`Producto ${id} eliminado correctamente.`);
                
                // Enviar correo si el owner es premium
                const owner = await User.findById(removedProduct.owner);
                if (owner && owner.role === 'premium') {
                    const message = {
                        from: 'Tu App <tu_correo@gmail.com>',
                        to: owner.email,
                        subject: 'Producto Eliminado',
                        text: `Tu producto con ID ${id} ha sido eliminado.`,
                        html: `<div><h1>Producto Eliminado</h1><p>Tu producto con ID ${id} ha sido eliminado.</p></div>`
                    };
                    await transporter.sendMail(message);
                    req.logger.info(`Correo enviado a ${owner.email} sobre la eliminación del producto ${id}`);
                }

                return {
                    message: `Producto con ID ${id} eliminado correctamente.`,
                    removedProduct,
                };
            } else {
                req.logger.warning(`No se encontró ningún producto con el ID ${id} para eliminar.`);
                return { error: `No se encontró ningún producto con el ID ${id} para eliminar.` };
            }
        } catch (error) {
            req.logger.error('Error al eliminar el producto:', error);
            return { error: error.message };
        }
    }

    async updateProduct(id, updatedProduct, req) {
        try {
            const existingProduct = await Product.findById(id);

            if (existingProduct) {
                Object.assign(existingProduct, updatedProduct);

                await existingProduct.save();

                req.logger.info(`Producto con ID ${id} actualizado correctamente.`);
                return { message: `Producto con ID ${id} actualizado correctamente.` };
            } else {
                req.logger.warning(`No se encontró ningún producto con el ID ${id}`);
                return { error: `No se encontró ningún producto con el ID ${id}` };
            }
        } catch (error) {
            req.logger.error('Error al actualizar el producto:', error);
            return { error: error.message };
        }
    }
}

const productService = new ProductService();

module.exports = productService;


const cart = require('../models/cartModels');
const admin = require('../models/adminModels');
const user = require('../models/userModels');

const { checkout } = require('../router/userRouter');


exports.getCartPage = async (req, res) => {
    const userId = req.session.userId;
    const userCart = await cart.Cart.find({ userId }).populate('productId')
    console.log(userCart);
    const checkout = userCart.reduce((acc, cart) => acc + cart.totalPrice, 0);

    res.render('user/cart', { userCart, checkout })

}

exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity, productName, totalPrice } = req.body;
        const product = await admin.Product.findOne({ _id: productId })
        console.log("hsadssd");
        const userId = req.session.userId;

        const isCarted = await cart.Cart.findOne({ userId, productId }).populate("productId")
        console.log("isthis " + isCarted);


        if (isCarted) {
            return res.status(200).json({ success: false, message: "it is already exist" });

        }

        if (product.status === "Out of Stock" || product.status < 1) {
            return res.status(200).json({ success: false, message: "This product is out of stock" });

        }


        const userCart = new cart.Cart({
            userId,
            productId,
            quantity,
            productName,
            totalPrice,

        })

        await userCart.save();

        return res.status(200).json({ success: true, message: "success..." });

        console.log(product);


        console.log("Added to cart")
    } catch (error) {
        return res.status(500).json({ error: "something error" })

    }
}

exports.updateQuantity = async (req, res) => {
    console.log("update ethi...");

    const userId = req.session.userId;

    const { productId, quantity } = req.body
    console.log(req.body);
    const product = await cart.Cart.findOne({ productId }).populate('productId')

    // Assuming userCart is an array with each item having a 'totalPrice'


    const totalPrice = product.productId.salePrice * quantity;
    console.log("total" + totalPrice);

    await cart.Cart.updateOne({ userId, productId }, { quantity, totalPrice })
    // const userPro = await cart.Cart.findOne({userId,productId}).populate('productId')
    // console.log(userPro);
    // const checkout = userPro.reduce((acc,cart)=>acc + cart.totalPrice, 0);
    return res.status(200).json({ quantity, totalPrice });


}

exports.deleteFromCart = async (req, res) => {
    const userId = req.session.userId;

    const productId = req.params.id
    await cart.Cart.deleteOne({ userId, productId })
    console.log("deleted");

    return res.redirect('/user/cart')

}


exports.checkout = async (req, res) => {
    const userId = req.session.userId
    const query1 = req.query.address;
    const query2 = req.query.product;
    const userCart = await cart.Cart.find({ userId }).populate('productId')
    const userData = await user.User.findOne({ _id: userId })
    const checkout = userCart.reduce((acc, cart) => acc + cart.totalPrice, 0);

    // console.log(query1);
    // console.log(query2);

    res.render('user/checkout', { userData,userCart ,checkout })
}
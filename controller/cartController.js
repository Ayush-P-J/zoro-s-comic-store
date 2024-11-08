const cart = require('../models/cartModels');
const admin = require('../models/adminModels');


exports.getCartPage = async (req, res)=>{
    const userId = req.session.userId;
    const userCart = await cart.Cart.find({userId}).populate('productId') 
    console.log(userCart);
    
    
    res.render('user/cart',{userCart})
    
}

exports.addToCart = async (req, res)=>{
    try {
        const { productId, quantity, productName, totalPrice } = req.body;
    const product = await admin.Product.findOne({_id:productId})
    console.log("hsadssd");
    const userId = req.session.userId;

    const isCarted = await cart.Cart.findOne({userId,productId}).populate("productId")
    console.log("isthis "+isCarted);
    

    if(isCarted){
        return res.status(200).json({success:false,message:"it is already exist"});

    }

    if(product.status === "Out of Stock" || product.status < 1){
        return res.status(200).json({success:false,message:"This product is out of stock"});

    }


    const userCart = new cart.Cart({
        userId,
        productId,
        quantity,
        productName,
        totalPrice,

    })

    await userCart.save();

    return res.status(200).json({success:true,message:"success..."});

    console.log(product);

    
    console.log("Added to cart")
    } catch (error) {
    return res.status(500).json({error:"something error"})
        
    }
}

exports.updateQuantity = async (req, res )=> {
    console.log("update ethi...");
    
    const userId = req.session.userId;

    const { productId,quantity }= req.body
    console.log(req.body);
    const product = await cart.Cart.findOne({productId}).populate('productId')
    console.log(product);
    
    const totalPrice = product.productId.salePrice * quantity;
    console.log("total"+totalPrice);
    
    await cart.Cart.updateOne({userId,productId},{quantity,totalPrice})
    return res.status(200).json({quantity,totalPrice}); 


}

exports.deleteFromCart = async (req, res)=>{
    const userId = req.session.userId;

    const productId = req.params.id
    await cart.Cart.deleteOne({userId,productId})
    console.log("deleted");
    
    return res.redirect('/user/cart')

}
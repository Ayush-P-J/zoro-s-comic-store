

// const wishlist = document.getElementById('wishlist')
// const productData = {
//     productId: "<%= product._id %>",  // Ensure this value is rendered correctly
//     productName: "<%= product.productName %>",
// };

// if (wishlist.classList == "active"){
//     axios.post('/user/addToWishlist', productData)
//     .then(response => {
//         // Success SweetAlert notification
//         if (response.data.success === true) {
//             Swal.fire({
//                 icon: 'success',
//                 title: 'Success',
//                 text: 'Added to wishlist successfully!',
//                 confirmButtonText: 'OK'
//             })
//                 .then(() => {
//                     window.location.reload();
//                 });
//             // cartNumber.innerText = ""
//         } else {
//             Swal.fire({
//                 icon: 'error',
//                 title: 'error',
//                 text: response.data.message,
//                 confirmButtonText: 'OK'
//             });

//         }
//     })
//     .catch(error => {
//         // Error SweetAlert notification
//         Swal.fire({
//             icon: 'error',
//             title: 'Error',
//             text: 'There was an error updating the quantity. Please try again.',
//             confirmButtonText: 'OK'
//         });
//         console.error("Error updating quantity:", error);
//     });
// }


// wishlist
const order = require("../models/orderModels");
const admin = require("../models/adminModels");

const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

const getSalesReport = async (req, res) => {
  try {
    // console.log(req.query);

    const page = parseInt(req.query.page) || 1; // Current page (default: 1)
    const limit = 10000000; // Number of records per page
    const skip = (page - 1) * limit; // Number of records to skip for pagination

    // Optional filters (e.g., by date range)
    const startDate = req.query.startDate
      ? new Date(req.query.startDate).toISOString().split("T")[0]
      : null;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate).toISOString().split("T")[0]
      : null;
    const type = req.query.type;
    // Build query object
    const query = {};
    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    // Fetch total count and paginated orders
    const total = await order.Order.countDocuments(query);
    const orders = await order.Order.find(query)
      .populate("userId") // Populate user details (e.g., name, email)
      .sort({ createdAt: -1 }) // Sort by most recent orders
      .skip(skip)
      .limit(limit);

    //   if(req.query.axios){
    //       res.json(orders)

    //   }

    // Render the sales report view with paginated data
    return res.render("admin/salesReport", {
      orders,
      currentPage: page,
      limit,
      totalPages: Math.ceil(total / limit),
      startDate: startDate || "", // Preserve selected start date
      endDate: startDate || "", // Preserve selected end date
      type,
    });
  } catch (error) {
    console.error("Error fetching sales report:", error);
    res.status(500).send("Internal Server Error");
  }
};

const downloadSalesReport = async (req, res) => {
  try {
    
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    // Build query object for filtering
    const query = {};
    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    // Fetch orders for the report
    const orders = await order.Order.find(query)
      .populate("userId")
      .sort({ createdAt: -1 });

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    // Add columns to the worksheet
    worksheet.columns = [
      { header: "Order ID", key: "id", width: 20 },
      { header: "User Name", key: "userName", width: 25 },
      { header: "User Email", key: "userEmail", width: 30 },
      { header: "Total Amount", key: "totalAmount", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Order Date", key: "orderDate", width: 20 },
    ];

    // Populate the worksheet with data
    orders.forEach((order) => {
      worksheet.addRow({
        id: order.orderId,
        userName: order.userId?.fullName || "N/A",
        userEmail: order.userId?.email || "N/A",
        totalAmount: order.totalAmount || 0,
        status: order.status || "Pending",
        orderDate: order.createdAt.toISOString().slice(0, 10),
      });
    });

    // Style the header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    // Set response headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Sales_Report_${new Date().toISOString()}.xlsx"`
    );

    // Write the workbook to the response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).send("Error generating sales report");
  }
};

const downloadPdf = async (req, res) => {
  try {
    console.log(req.query.endDate+"pdf"+req.query.startDate);

    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    // Build query object for filtering
    let query = {};
    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }
     
    console.log(query);
    

    // Fetch orders for the report
    const orders = await order.Order.find(query)
      .populate("userId")
      .sort({ createdAt: -1 });
      // console.log(orders);
      

    // Create a PDF document
    const doc = new PDFDocument();

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Sales_Report_${new Date().toISOString()}.pdf"`
    );

    // Pipe the PDF into the response
    doc.pipe(res);

    doc.fontSize(18).text("Sales Report", { align: "center" });
    doc.moveDown();

    // Table header
    const tableTop = 100;
    const colWidths = [100, 100, 150, 80, 100, 100]; // Column widths
    const headers = [
      "Order ID",
      "User Name",
      "User Email",
      "Total Amount",
      "Status",
      "Order Date",
    ];

    // Draw header background
    doc
      .rect(
        50,
        tableTop,
        colWidths.reduce((a, b) => a + b),
        20
      )
      .fill("#eeeeee");

    // Draw header text
    headers.forEach((header, i) => {
      doc
        .fontSize(10)
        .fill("#000")
        .text(
          header,
          50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5,
          tableTop + 5
        );
    });

    // Reset fill color for rows
    doc.fill("#000");

    // Table rows
    let rowTop = tableTop + 20;
    orders.forEach((order) => {
      const rowData = [
        order.orderId || "N/A",
        order.userId?.fullName || "N/A",
        order.userId?.email || "N/A",
        order.totalAmount || 0,
        order.status || "Pending",
        order.createdAt.toISOString().slice(0, 10),
      ];

      // Draw row background alternately
      doc
        .rect(
          50,
          rowTop,
          colWidths.reduce((a, b) => a + b),
          20
        )
        .fill(rowTop % 40 === 0 ? "#f9f9f9" : "#ffffff")
        .stroke();

      // Draw row text
      rowData.forEach((data, i) => {
        doc
          .fontSize(10)
          .fill("#000")
          .text(
            data,
            50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5,
            rowTop + 5
          );
      });

      rowTop += 20;

      // Add a new page if the table exceeds the page height
      if (rowTop > doc.page.height - 50) {
        doc.addPage();
        rowTop = 50; // Reset rowTop for the new page
      }
    });

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).send("Error generating sales report");
  }
};

const getDashboard = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Current page (default: 1)
    const limit = 100; // Number of records per page
    const skip = (page - 1) * limit;

    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const type = req.query.type;

    const query = {};
    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }
    const categories = await admin.Category.find();
    const total = await order.Order.countDocuments(query);
    const orders = await order.Order.find(query)
      .populate("userId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("createdAt totalAmount products"); // Include products for analysis

    // Aggregate top-selling products
    const topSellingProducts = await order.Order.aggregate([
      { $match: query }, // Filter orders by date range
      { $unwind: "$products" }, // Flatten products array
      { $group: { _id: "$products.productId", count: { $sum: "$products.quantity" } } }, // Count quantity sold
      { $sort: { count: -1 } }, // Sort by quantity sold
      { $limit: 10 }, // Limit to top 10 products
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } }, // Get product details
      { $unwind: "$product" }, // Flatten product details
      { $project: { _id: 0, productName: "$product.productName", quantitySold: "$count", productId: "$_id" } } // Format result
    ]);

    // Aggregate top-selling categories
    const topSellingCategories = await order.Order.aggregate([
      { $match: query }, // Filter orders by date range
      { $unwind: "$products" }, // Flatten products array
      { $lookup: { from: "products", localField: "products.productId", foreignField: "_id", as: "productDetails" } }, // Get product details
      { $unwind: "$productDetails" }, // Flatten product details
      { $group: { _id: "$productDetails.category", count: { $sum: "$products.quantity" } } }, // Group by category
      { $sort: { count: -1 } }, // Sort by quantity sold
      { $limit: 10 } // Limit to top 10 categories
    ]);
    topSellingProducts.forEach((prod)=>{
      console.log(prod);
      
    });
    

    return res.render("admin/dashboard", {
      orders,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      startDate: startDate ? startDate.toISOString().split('T')[0] : "", // Format date
      endDate: endDate ? endDate.toISOString().split('T')[0] : "",
      type,
      topSellingProducts, // Send top-selling products data
      topSellingCategories, // Send top-selling categories data
      categories,
    });
  } catch (error) {
    console.error("Error fetching sales report:", error);
    res.status(500).send("Internal Server Error");
  }
};


module.exports = {
  getSalesReport,
  downloadSalesReport,
  downloadPdf,
  getDashboard,
};

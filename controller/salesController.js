const order = require("../models/orderModels");
const ExcelJS = require("exceljs");

const getSalesReport = async (req, res) => {
  try {
    console.log(req.query);
    
    const page = parseInt(req.query.page) || 1; // Current page (default: 1)
    const limit = 10000000; // Number of records per page
    const skip = (page - 1) * limit; // Number of records to skip for pagination

    // Optional filters (e.g., by date range)
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

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
      startDate: req.query.startDate || "", // Preserve selected start date
      endDate: req.query.endDate || "" // Preserve selected end date
    });
  } catch (error) {
    console.error("Error fetching sales report:", error);
    res.status(500).send("Internal Server Error");
  }
};

const downloadSalesReport = async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
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

module.exports = {
  getSalesReport,
  downloadSalesReport,
};

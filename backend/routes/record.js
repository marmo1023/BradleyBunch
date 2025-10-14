const express = require("express");
const recordRoutes = express.Router();
 
const ObjectId = require("mongodb").ObjectId;
 
 
// This section will help you get a list of all the records.
recordRoutes.route("/record").get(async (req, res) => {
    try {
        let db_connect = dbo.getDb("employees");
        const result = await db_connect.collection("records").find({}).toArray();
        res.json(result);
    } catch (err) {
        throw err;
    }
});
 
// // This section will help you get a single record by id
// recordRoutes.route("/record/:id").get(async (req, res) => {
//     try {
//         let db_connect = dbo.getDb();
//         let myquery = { _id: new ObjectId(req.params.id) };
//         const result = await db_connect.collection("records").findOne(myquery);
//         res.json(result);
//     } catch (err) {
//         throw err;
//     }
// });
 
// // This section will help you create a new record.
// recordRoutes.route("/record/add").post(async (req, res) => {
//     try {
//         let db_connect = dbo.getDb();
//         let obj = {
//             name: req.body.name,
//             position: req.body.position,
//             level: req.body.level
//         };
//         const result = db_connect.collection("records").insertOne(obj);
//         res.json(result);
//     } catch (err) {
//         throw err;
//     }
// });

 
// // This section will help you update a record by id.
// recordRoutes.route("/update/:id").put(async (req, res) => {
//     try {
//         let db_connect = dbo.getDb();
//         let myquery = { _id: new ObjectId(req.params.id)};
//         let values = {$set: {
//             name: req.body.name,
//             position: req.body.position,
//             level: req.body.level,
//         },};
//         const result = db_connect.collection("records").updateOne(myquery, values);
//         console.log("1 document updated");
//         res.json(result);
//     } catch (err) {
//         throw err;
//     }
// });
 
// // This section will help you delete a record
// recordRoutes.route("/:id").delete(async (req, res) => {
//     try {
//         let db_connect = dbo.getDb();
//         let myquery = { _id: new ObjectId(req.params.id) };
//         const result = db_connect.collection("records").deleteOne(myquery);
//         console.log("1 document deleted");
//         res.json(result);
//     } catch {
//         throw err;
//     }
// });
 
module.exports = recordRoutes;
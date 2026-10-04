/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: beauchemin
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `catagory`
--

LOCK TABLES `catagory` WRITE;
/*!40000 ALTER TABLE `catagory` DISABLE KEYS */;
INSERT INTO `catagory` (`id`, `name`, `description`, `created_by`, `update_at`, `create_at`) VALUES (1,'Processors','A processor (CPU) is the logic circuitry that responds to and processes the basic instructions that drive a computer. The CPU is seen as the main and most crucial integrated circuitry (IC) chip in a c',1,NULL,'2023-07-21 12:29:08'),
(2,'Motherboards','A motherboard (also called mainboard, main circuit board, MB, mboard, backplane board, base board, system board, mobo; or in Apple computers logic board)',1,NULL,'2023-07-21 12:29:35'),
(3,'RAM (Memory)','Random-access memory is a form of computer memory that can be read and changed in any order, typically used to store working data and machine code.',1,NULL,'2023-07-21 12:37:27');
/*!40000 ALTER TABLE `catagory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `expense`
--

LOCK TABLES `expense` WRITE;
/*!40000 ALTER TABLE `expense` DISABLE KEYS */;
INSERT INTO `expense` (`id`, `ex_date`, `expense_for`, `amount`, `expense_cat`, `ex_description`, `added_by`, `added_date`) VALUES (1,'2023-07-19','Transport',500.00,1,'order delivery',1,'2023-07-21 12:35:30');
/*!40000 ALTER TABLE `expense` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `expense_catagory`
--

LOCK TABLES `expense_catagory` WRITE;
/*!40000 ALTER TABLE `expense_catagory` DISABLE KEYS */;
INSERT INTO `expense_catagory` (`id`, `name`, `description`, `added_by`, `added_time`) VALUES (1,'Petrol','Petrol for transport',1,'2023-07-21 12:34:59');
/*!40000 ALTER TABLE `expense_catagory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `invoice`
--

LOCK TABLES `invoice` WRITE;
/*!40000 ALTER TABLE `invoice` DISABLE KEYS */;
INSERT INTO `invoice` (`id`, `invoice_number`, `customer_id`, `customer_name`, `order_date`, `sub_total`, `discount`, `pre_cus_due`, `net_total`, `paid_amount`, `due_amount`, `payment_type`, `return_status`, `last_update`) VALUES (1,'S1689942866',1,'Nilesh Pandit','2023-07-28',9000.00,0.00,0.00,9000.00,9000.00,0.00,'Bank Transfer','no',NULL),
(2,'S1689943248',1,'Nilesh Pandit','2023-07-27',10000.00,0.00,0.00,10000.00,10000.00,0.00,'Debit Card','no',NULL);
/*!40000 ALTER TABLE `invoice` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `invoice_details`
--

LOCK TABLES `invoice_details` WRITE;
/*!40000 ALTER TABLE `invoice_details` DISABLE KEYS */;
INSERT INTO `invoice_details` (`id`, `invoice_no`, `pid`, `product_name`, `price`, `quantity`) VALUES (1,1,1,'AMD Ryzen 9 5900X Processor','9000',2),
(2,2,3,'Adata XPG Gammix D30 8GB 3200MHz DDR4 CL16 RAM Memory Module','10000',5);
/*!40000 ALTER TABLE `invoice_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `member`
--

LOCK TABLES `member` WRITE;
/*!40000 ALTER TABLE `member` DISABLE KEYS */;
INSERT INTO `member` (`id`, `member_id`, `name`, `company`, `address`, `con_num`, `email`, `total_buy`, `total_paid`, `total_due`, `reg_date`, `update_by`, `update_at`, `create_at`) VALUES (1,'C1689940620','Nilesh Pandit','Nilesh Pandit Pvt Ltd','2nd floor, Nikhil Pride Building, Lokmanya Bal Gangadhar Tilak Rd, near Kaka Halwai, Pune, Maharasht','9090909090','nilesh@gmail.com',19000.00,19000.00,0.00,'2023-07-21',1,NULL,'2023-07-21 11:57:00');
/*!40000 ALTER TABLE `member` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` (`id`, `product_name`, `product_id`, `brand_name`, `catagory_id`, `catagory_name`, `product_source`, `sku`, `quantity`, `alert_quanttity`, `buy_price`, `sell_price`, `added_by`, `last_update_at`, `added_time`) VALUES (1,'AMD Ryzen 9 5900X Processor','P1689942626','Ryzen',1,'Processors','factory','456AD5S',48,5,'3653','4500',1,'2023-07-27','2023-07-21 12:30:26'),
(2,'Intel Core I5-10400 Processor','P1689942673','Intel',1,'Processors','factory','SDS55S',0,5,NULL,NULL,1,'0000-00-00','2023-07-21 12:31:13'),
(3,'Adata XPG Gammix D30 8GB 3200MHz DDR4 CL16 RAM Memory Module','P1689943120','XPG',3,'RAM (Memory)','factory','2365SDSV',0,160,'1839','2000',1,'2023-07-19','2023-07-21 12:38:40');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `purchase_payment`
--

LOCK TABLES `purchase_payment` WRITE;
/*!40000 ALTER TABLE `purchase_payment` DISABLE KEYS */;
INSERT INTO `purchase_payment` (`id`, `suppliar_id`, `payment_date`, `payment_amount`, `payment_type`, `pay_description`, `added_by`, `last_update`, `added_time`) VALUES (1,1,'2023-07-27',180000.00,'Gpay','',1,NULL,'2023-07-21 12:34:03'),
(2,1,'2023-07-19',9195.00,'Debit Card','',1,NULL,'2023-07-21 12:40:07');
/*!40000 ALTER TABLE `purchase_payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `purchase_products`
--

LOCK TABLES `purchase_products` WRITE;
/*!40000 ALTER TABLE `purchase_products` DISABLE KEYS */;
INSERT INTO `purchase_products` (`id`, `product_id`, `product_name`, `purchase_date`, `purchase_suppliar`, `suppliar_name`, `prev_quantity`, `purchase_quantity`, `purchase_price`, `purchase_sell_price`, `purchase_subtotal`, `prev_total_due`, `purchase_net_total`, `purchase_paid_bill`, `purchase_due_bill`, `purchase_pamyent_by`, `return_status`, `added_by`, `added_time`) VALUES (1,1,'AMD Ryzen 9 5900X Processor','2023-07-27',1,'Rakesh Jadhav',0,50,3653.00,4500.00,182650.00,500.00,183150.00,180000.00,3150.00,'Gpay','no',1,'2023-07-21 12:34:03'),
(2,3,'Adata XPG Gammix D30 8GB 3200MHz DDR4 CL16 RAM Memory Module','2023-07-19',1,'Rakesh Jadhav',0,5,1839.00,2000.00,9195.00,3150.00,12345.00,9195.00,3150.00,'Debit Card','no',1,'2023-07-21 12:40:07');
/*!40000 ALTER TABLE `purchase_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `sell_payment`
--

LOCK TABLES `sell_payment` WRITE;
/*!40000 ALTER TABLE `sell_payment` DISABLE KEYS */;
INSERT INTO `sell_payment` (`id`, `customer_id`, `payment_date`, `payment_amount`, `payment_type`, `pay_description`, `added_by`, `last_update`, `added_time`) VALUES (1,1,'2023-07-28',9000.00,'Bank Transfer','',1,NULL,'2023-07-21 12:34:26'),
(2,1,'2023-07-27',10000.00,'Debit Card','',1,NULL,'2023-07-21 12:40:48');
/*!40000 ALTER TABLE `sell_payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` (`id`, `name`, `designation`, `con_no`, `email`, `address`, `added_by`, `added_time`) VALUES (1,'Sushant Kolhe','Manager','8708708702','sushant@gmail.com','besides maruti temple, Shahupuri 5th Ln, E Ward, Shahupuri, Kolhapur, Maharashtra 416001',1,'2023-07-21 12:36:40');
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `suppliar`
--

LOCK TABLES `suppliar` WRITE;
/*!40000 ALTER TABLE `suppliar` DISABLE KEYS */;
INSERT INTO `suppliar` (`id`, `suppliar_id`, `name`, `company`, `address`, `con_num`, `email`, `total_buy`, `total_paid`, `total_due`, `reg_date`, `update_by`, `update_at`, `create_at`) VALUES (1,'S1689942181','Rakesh Jadhav','Rakesh Jadhav Pvt Ltd.','Level 2, Hermes Palazzo, opposite St Anne\'s School, Camp, Pune, Maharashtra 411001','7070707070','rakesh@gmail.com',191845.00,189195.00,3150.00,'2023-07-21',1,NULL,'2023-07-21 12:23:01');
/*!40000 ALTER TABLE `suppliar` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-04 14:52:07

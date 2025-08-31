# MapUP Electric Vehicle Dashboard

The **Electric Vehicle Dashboard** is a React-based application that provides insights into EV data through **charts, tables, sorting, filtering, and search functionality**.  
It is built with **React, Ant Design (UI), Chart.js (charts), and PapaParse (CSV parsing)**.

---

## 📊 What It Shows

1. **Header Section**
   - Displays the title: *Electric Vehicle Dashboard*.

2. **Charts Section**
   - **Bar Chart** → Distribution of EVs by County.  
   - **Pie Chart** → Distribution of EVs by Electric Vehicle Type.  
   - **Line Chart** → Growth trend of EVs over registration years.

3. **Table Section**
   - Displays the raw EV dataset in a table.  
   - Includes **sorting, filtering, and pagination**.
   - Columns like VIN, County, Model Year, Make, Model, Electric Vehicle Type, etc.

4. **Data Management**
   - CSV file is parsed dynamically using **PapaParse**.  
   - Charts and tables update automatically when new data is loaded.  
   - No hardcoded values — everything comes from the dataset.

---

## ⚙️ Features

- ✅ **CSV Import** (using PapaParse)  
- ✅ **Dynamic Charts** (Bar, Pie, Line via Chart.js)  
- ✅ **Sortable & Filterable Table** (Ant Design Table)  
- ✅ **Pagination & Scrolling Support**  
- ✅ **Componentized Design** (split into Header, ChartSection, TableSection)  

---

## 🗂️ Project Structure

